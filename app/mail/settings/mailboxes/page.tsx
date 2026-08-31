import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MailboxesManager } from "@/components/mail/mailboxes-manager";

export default async function MailboxesSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!org) redirect("/auth/login");

  // Fetch mailboxes + domains IN PARALLEL (was sequential before)
  const [mailboxesResult, domainsResult] = await Promise.all([
    supabase
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
      .order("created_at", { ascending: false }),
    supabase
      .from("domains")
      .select("id, domain_name")
      .eq("org_id", org.id),
  ]);

  const formattedMailboxes = (mailboxesResult.data ?? []).map((mb) => ({
    ...mb,
    domains: Array.isArray(mb.domains) ? mb.domains[0] ?? null : mb.domains,
  }));

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <MailboxesManager
          mailboxes={formattedMailboxes as any}
          domains={domainsResult.data ?? []}
        />
      </div>
    </div>
  );
}

