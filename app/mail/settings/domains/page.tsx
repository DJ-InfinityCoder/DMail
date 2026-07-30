import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DomainsManager } from "@/components/mail/domains-manager";

export default async function DomainsSettingsPage() {
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

  const { data: domains } = await supabase
    .from("domains")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <DomainsManager domains={domains ?? []} orgId={org.id} />
      </div>
    </div>
  );
}
