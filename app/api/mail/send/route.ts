import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      mailboxId,
      to,
      cc,
      bcc,
      subject,
      bodyHtml,
      bodyText,
      inReplyTo,
      references,
    } = body;

    if (!mailboxId || !to || to.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: mailboxId, to" },
        { status: 400 }
      );
    }

    // Verify the mailbox belongs to the user's org and has send_enabled
    const { data: rawMailbox } = await supabase
      .from("mailboxes")
      .select(`
        id,
        address,
        display_name,
        is_active,
        created_at,
        domain_id,
        org_id,
        domains:domain_id (
          domain_name,
          send_enabled
        )
      `)
      .eq("id", mailboxId)
      .single();

    if (!rawMailbox) {
      return NextResponse.json(
        { error: "Mailbox not found" },
        { status: 404 }
      );
    }

    const mailbox = {
      ...rawMailbox,
      domains: Array.isArray(rawMailbox.domains) ? rawMailbox.domains[0] ?? null : rawMailbox.domains,
    };

    // Verify org ownership
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("id", mailbox.org_id)
      .eq("owner_id", user.id)
      .single();

    if (!org) {
      return NextResponse.json(
        { error: "Unauthorized access to this mailbox" },
        { status: 403 }
      );
    }

    // Generate a message ID
    const messageId = `<${crypto.randomUUID()}@${mailbox.address.split("@")[1]}>`;

    // Validate Resend API key exists early
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    // Check daily send quota BEFORE sending
    const { data: quotaOk, error: quotaError } = await supabase.rpc(
      "check_send_quota",
      { target_org_id: org.id }
    );

    if (quotaError || !quotaOk) {
      return NextResponse.json(
        { error: "Daily send quota exceeded for your organization." },
        { status: 429 }
      );
    }

    // Store the sent email in our database
    const { data: email, error: insertError } = await supabase
      .from("emails")
      .insert({
        org_id: org.id,
        mailbox_id: mailboxId,
        message_id: messageId,
        in_reply_to: inReplyTo ?? null,
        references_header: references ?? null,
        from_address: mailbox.address,
        to_address: to.join(", "),
        cc_address: cc?.join(", ") ?? null,
        bcc_address: bcc?.join(", ") ?? null,
        subject,
        body_html: bodyHtml,
        body_text: bodyText,
        folder: "sent",
        is_read: true,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert email:", insertError);
      return NextResponse.json(
        { error: "Failed to save email" },
        { status: 500 }
      );
    }

    // Send email via Resend API
    const fromAddress = mailbox.display_name
      ? `${mailbox.display_name} <${mailbox.address}>`
      : mailbox.address;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to,
        subject: subject || "(no subject)",
        html: bodyHtml || bodyText || "",
        text: bodyText || undefined,
        cc: cc?.length ? cc : undefined,
        bcc: bcc?.length ? bcc : undefined,
        headers: {
          "Message-ID": messageId,
          ...(inReplyTo ? { "In-Reply-To": inReplyTo } : {}),
          ...(references?.length ? { "References": references.join(" ") } : {}),
        },
      }),
    });

    if (!resendRes.ok) {
      const resendErr = await resendRes.json().catch(() => ({}));
      console.error("Resend API send error:", resendErr);
      return NextResponse.json(
        { error: resendErr.message || "Failed to send email via Resend" },
        { status: resendRes.status >= 400 && resendRes.status < 500 ? 400 : 500 }
      );
    }

    // Log the send
    await supabase.from("email_sends").insert({
      org_id: org.id,
      mailbox_id: mailboxId,
      to_address: to.join(", "),
      subject,
      status: "sent",
    });

    return NextResponse.json({
      success: true,
      messageId,
      emailId: email.id,
    });
  } catch (err: any) {
    console.error("Send email error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
