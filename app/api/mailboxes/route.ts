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

  // Validate address matches domain
  const emailDomain = address.split("@")[1];
  if (emailDomain !== domain.domain_name) {
    return NextResponse.json(
      { error: `Address must be on domain ${domain.domain_name}` },
      { status: 400 }
    );
  }

  const { data: mailbox, error } = await supabase
    .from("mailboxes")
    .insert({
      org_id: domain.org_id,
      domain_id: domainId,
      address: address.toLowerCase(),
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
