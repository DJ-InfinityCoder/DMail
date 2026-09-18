import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { EmailList } from "@/components/mail/email-list";
import { ResizableSplitPane } from "@/components/mail/resizable-split-pane";
import type { ReactNode } from "react";

interface FolderLayoutProps {
  children: ReactNode;
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

export default async function FolderLayout({
  children,
  params,
}: FolderLayoutProps) {
  const { folder } = await params;

  if (!VALID_FOLDERS.includes(folder)) {
    redirect("/mail/inbox");
  }

  const supabase = await createClient();

  // Validate authentication
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

  // Query ONLY lightweight metadata for the email list (exclude body_html)
  const baseQuery = supabase
    .from("emails")
    .select(
      "id, org_id, mailbox_id, from_address, to_address, cc_address, bcc_address, subject, folder, is_read, is_starred, created_at, message_id, in_reply_to, attachments, labels"
    )
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const emailQuery =
    folder === "starred"
      ? baseQuery.eq("is_starred", true)
      : baseQuery.eq("folder", folder);

  const { data: emails } = await emailQuery;

  const cookieStore = await cookies();
  const splitCookie = cookieStore.get("dmail_split_pane_width");
  const parsedWidth = splitCookie ? parseInt(splitCookie.value, 10) : undefined;
  const initialSplitWidth =
    parsedWidth && !isNaN(parsedWidth) && parsedWidth >= 280 && parsedWidth <= 650
      ? parsedWidth
      : 380;

  const leftPane = (
    <EmailList
      emails={emails ?? []}
      folder={folder}
      orgId={org.id}
    />
  );

  return (
    <ResizableSplitPane
      left={leftPane}
      right={children}
      defaultWidth={initialSplitWidth}
      minWidth={280}
      maxWidth={650}
    />
  );
}
