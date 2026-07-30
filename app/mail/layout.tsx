import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MailShell } from "@/components/mail/mail-shell";

export default async function MailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user's organization
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!org) {
    redirect("/auth/login");
  }

  // Fetch mailboxes with domain info
  const { data: rawMailboxes } = await supabase
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
    .eq("is_active", true);

  const mailboxes = (rawMailboxes ?? []).map((mb) => ({
    ...mb,
    domains: Array.isArray(mb.domains) ? mb.domains[0] ?? null : mb.domains,
  }));

  // Fetch unread count
  const { count: unreadCount } = await supabase
    .from("emails")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org.id)
    .eq("folder", "inbox")
    .eq("is_read", false);

  return (
    <MailShell
      user={user}
      org={org}
      mailboxes={mailboxes ?? []}
      unreadCount={unreadCount ?? 0}
    >
      {children}
    </MailShell>
  );
}
