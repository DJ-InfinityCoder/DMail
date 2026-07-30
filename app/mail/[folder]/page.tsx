import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmailList } from "@/components/mail/email-list";

export const dynamic = "force-dynamic";

interface FolderPageProps {
  params: Promise<{ folder: string }>;
}

const VALID_FOLDERS = [
  "inbox",
  "sent",
  "drafts",
  "trash",
  "archive",
  "spam",
  "starred",
];

export default async function FolderPage({ params }: FolderPageProps) {
  const { folder } = await params;

  if (!VALID_FOLDERS.includes(folder)) {
    redirect("/mail/inbox");
  }

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

  // Build query based on folder
  let query = supabase
    .from("emails")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (folder === "starred") {
    query = query.eq("is_starred", true);
  } else {
    query = query.eq("folder", folder);
  }

  const { data: emails } = await query;

  return (
    <EmailList
      emails={emails ?? []}
      folder={folder}
      orgId={org.id}
    />
  );
}
