import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface EmailRouteParams {
  params: Promise<{ id: string }>;
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
