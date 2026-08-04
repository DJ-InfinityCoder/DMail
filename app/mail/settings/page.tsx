import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Globe, Mail, Building2 } from "lucide-react";
import { AppearanceSettings } from "@/components/mail/appearance-settings";
import { NotificationSettings } from "@/components/mail/notification-settings";
import { SignaturesManager } from "@/components/mail/signatures-manager";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!org) redirect("/auth/login");

  const { count: domainCount } = await supabase
    .from("domains")
    .select("*", { count: "exact", head: true })
    .eq("org_id", org.id);

  const { data: mailboxesData, count: mailboxCount } = await supabase
    .from("mailboxes")
    .select("*")
    .eq("org_id", org.id)
    .eq("is_active", true);

  const { data: quota } = await supabase
    .from("org_send_quotas")
    .select("*")
    .eq("org_id", org.id)
    .single();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Manage your workspace, domains, mailboxes, and signatures.
        </p>

        {/* Organization info */}
        <div className="glass rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">{org.name}</h2>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>

          {quota && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4 pt-4 border-t border-border/30">
              <span>
                Daily send quota:{" "}
                <span className="text-foreground font-medium">
                  {quota.sent_today} / {quota.daily_limit}
                </span>
              </span>
            </div>
          )}
        </div>

        {/* Appearance / Theme Settings */}
        <AppearanceSettings />

        {/* Push Notifications & App Icon Badging Settings */}
        <NotificationSettings />

        {/* Signatures Manager */}
        <SignaturesManager mailboxes={mailboxesData ?? []} />

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/mail/settings/domains"
            className="glass-hover rounded-xl p-6 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Domains</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {domainCount ?? 0} domain{domainCount !== 1 ? "s" : ""} configured.
              Add and verify custom domains.
            </p>
          </Link>

          <Link
            href="/mail/settings/mailboxes"
            className="glass-hover rounded-xl p-6 group"
          >
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Mailboxes</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {mailboxCount ?? 0} mailbox{mailboxCount !== 1 ? "es" : ""} active.
              Create and manage email addresses.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
