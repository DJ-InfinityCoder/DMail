import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EmailList } from "@/components/mail/email-list";
import { ResizableSplitPane } from "@/components/mail/resizable-split-pane";
import { Mail } from "lucide-react";
import type { Email } from "@/lib/types";

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

  const leftPane = (
    <EmailList
      emails={emails ?? []}
      folder={folder}
      orgId={org.id}
    />
  );

  const rightPane = (
    <div className="flex flex-col items-center justify-center h-full bg-background/50 text-muted-foreground p-8 text-center animate-fade-in border-l border-border/20">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
        <Mail className="w-8 h-8 stroke-[1.75]" />
      </div>
      <h3 className="text-base font-bold text-foreground mb-1">Select an email to read</h3>
      <p className="text-xs text-muted-foreground max-w-[260px]">
        Choose a message from the list on the left to view the complete thread conversation.
      </p>
    </div>
  );

  return (
    <ResizableSplitPane
      left={leftPane}
      right={rightPane}
      defaultWidth={380}
      minWidth={280}
      maxWidth={650}
    />
  );
}
