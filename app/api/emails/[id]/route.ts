import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface EmailRouteParams {
  params: Promise<{ id: string }>;
}

// GET: Fetch email detail and associated thread messages
export async function GET(request: NextRequest, { params }: EmailRouteParams) {
  const { id } = await params;
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
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const { data: email, error } = await supabase
    .from("emails")
    .select("*")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (error || !email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  let threadEmails = [email];
  if (email.message_id || email.in_reply_to) {
    let relatedQuery = supabase
      .from("emails")
      .select("*")
      .eq("org_id", org.id)
      .neq("id", email.id)
      .order("created_at", { ascending: true });

    if (email.in_reply_to && email.message_id) {
      relatedQuery = relatedQuery.or(
        `in_reply_to.eq."${email.message_id}",message_id.eq."${email.in_reply_to}"`
      );
    } else if (email.message_id) {
      relatedQuery = relatedQuery.eq("in_reply_to", email.message_id);
    } else if (email.in_reply_to) {
      relatedQuery = relatedQuery.eq("message_id", email.in_reply_to);
    }

    const { data: related } = await relatedQuery;

    if (related && related.length > 0) {
      threadEmails = [...related, email].sort(
        (a, b) =>
          new Date(a.created_at ?? 0).getTime() -
          new Date(b.created_at ?? 0).getTime()
      );
    }
  }

  return NextResponse.json({ email, threadEmails });
}

// PATCH: Update email properties (read, starred, folder, labels)
export async function PATCH(request: NextRequest, { params }: EmailRouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const allowedFields = ["is_read", "is_starred", "folder", "labels"];
  const updates: Record<string, any> = {};

  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("emails")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE: Move to trash or permanently delete
export async function DELETE(request: NextRequest, { params }: EmailRouteParams) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if already in trash
  const { data: email } = await supabase
    .from("emails")
    .select("folder")
    .eq("id", id)
    .single();

  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  if (email.folder === "trash") {
    // Permanently delete
    const { error } = await supabase.from("emails").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, action: "deleted" });
  } else {
    // Move to trash
    const { error } = await supabase
      .from("emails")
      .update({ folder: "trash" })
      .eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, action: "trashed" });
  }
}
