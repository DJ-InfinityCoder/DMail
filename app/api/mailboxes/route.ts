import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET: List all mailboxes for user's org
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 });
  }

  const { data: mailboxes, error } = await supabase
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
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  const formattedMailboxes = (mailboxes ?? []).map((mb) => ({
    ...mb,
    domains: Array.isArray(mb.domains) ? mb.domains[0] ?? null : mb.domains,
  }));

  return NextResponse.json({ mailboxes: formattedMailboxes });
}

// POST: Create a new mailbox
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { address, displayName, domainId } = await request.json();

  if (!address || !domainId) {
    return NextResponse.json(
      { error: "address and domainId are required" },
      { status: 400 }
    );
  }

  // Verify domain ownership
  const { data: domain } = await supabase
    .from("domains")
    .select("*, organizations!inner(owner_id)")
    .eq("id", domainId)
    .single();

  if (!domain || (domain as any).organizations?.owner_id !== user.id) {
    return NextResponse.json({ error: "Domain not found or unauthorized" }, { status: 403 });
  }

  // Validate address format and matches domain
  const parts = address.trim().toLowerCase().split("@");
  if (parts.length !== 2) {
    return NextResponse.json(
      { error: "Invalid email address format" },
      { status: 400 }
    );
  }

  const [localPart, emailDomain] = parts;
  if (!localPart || !/^[a-zA-Z0-9._%+-]+$/.test(localPart)) {
    return NextResponse.json(
      { error: "Invalid email username format" },
      { status: 400 }
    );
  }

  if (emailDomain !== domain.domain_name.toLowerCase()) {
    return NextResponse.json(
      { error: `Address must be on domain ${domain.domain_name}` },
      { status: 400 }
    );
  }

  const normalizedAddress = `${localPart}@${domain.domain_name.toLowerCase()}`;

  const { data: mailbox, error } = await supabase
    .from("mailboxes")
    .insert({
      org_id: domain.org_id,
      domain_id: domainId,
      address: normalizedAddress,
      display_name: displayName || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "This email address is already taken" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ mailbox }, { status: 201 });
}

// DELETE: Delete a mailbox
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  let id = searchParams.get("id");

  if (!id) {
    try {
      const body = await request.json();
      id = body?.id;
    } catch {
      // Body not provided
    }
  }

  if (!id) {
    return NextResponse.json({ error: "Mailbox ID is required" }, { status: 400 });
  }

  // Get user's org
  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  // Verify mailbox belongs to user's org
  const { data: mailbox, error: fetchError } = await supabase
    .from("mailboxes")
    .select("id, org_id")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (fetchError || !mailbox) {
    return NextResponse.json({ error: "Mailbox not found or unauthorized" }, { status: 404 });
  }

  // Clear catch_all_mailbox_id on any domains pointing to this mailbox
  await supabase
    .from("domains")
    .update({ catch_all_mailbox_id: null })
    .eq("catch_all_mailbox_id", id);

  // Clean up any child records referencing this mailbox
  await supabase.from("signatures").delete().eq("mailbox_id", id);
  await supabase.from("autoresponders").delete().eq("mailbox_id", id);
  await supabase.from("forwarding_rules").delete().eq("mailbox_id", id);
  await supabase.from("mailbox_aliases").delete().eq("mailbox_id", id);
  await supabase.from("email_sends").delete().eq("mailbox_id", id);
  await supabase.from("emails").delete().eq("mailbox_id", id);

  // Delete the mailbox
  const { error: deleteError } = await supabase
    .from("mailboxes")
    .delete()
    .eq("id", id)
    .eq("org_id", org.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
