import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET: Fetch emails by folder with user/org auth
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const folder = searchParams.get("folder") || "inbox";
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 });
  }

  let query = supabase
    .from("emails")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (folder === "starred") {
    query = query.eq("is_starred", true);
  } else {
    query = query.eq("folder", folder);
  }

  const { data: emails, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ emails: emails ?? [] });
}
