import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { EmailThread } from "@/components/mail/email-thread";
import { EmailList } from "@/components/mail/email-list";
import { ResizableSplitPane } from "@/components/mail/resizable-split-pane";
import type { Email } from "@/lib/types";

export const dynamic = "force-dynamic";

interface EmailDetailPageProps {
  params: Promise<{ folder: string; emailId: string }>;
}

const VALID_FOLDERS = [
  "inbox",
  "sent",
  "drafts",
  "trash",
  "archive",
  "starred",
];

export default async function EmailDetailPage({ params }: EmailDetailPageProps) {
  const { folder, emailId } = await params;

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

  // Fetch folder list and selected email in PARALLEL
  const baseQuery = supabase
    .from("emails")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const folderQuery =
    folder === "starred"
      ? baseQuery.eq("is_starred", true)
      : baseQuery.eq("folder", folder);

  const [folderResult, emailResult] = await Promise.all([
    folderQuery,
    supabase
      .from("emails")
      .select("*")
      .eq("id", emailId)
      .eq("org_id", org.id)
      .single(),
  ]);

  const email = emailResult.data;
  if (emailResult.error || !email) notFound();

  // Fetch thread emails if part of a reply chain
  let threadEmails = [email];

  if (email.message_id || email.in_reply_to) {
    let relatedQuery = supabase
      .from("emails")
      .select("*")
      .eq("org_id", org.id)
      .neq("id", email.id)
      .order("created_at", { ascending: true });

    if (email.in_reply_to && email.message_id) {
      relatedQuery = relatedQuery.or(
        `in_reply_to.eq."${email.message_id}",message_id.eq."${email.in_reply_to}"`
      );
    } else if (email.message_id) {
      relatedQuery = relatedQuery.eq("in_reply_to", email.message_id);
    } else if (email.in_reply_to) {
      relatedQuery = relatedQuery.eq("message_id", email.in_reply_to);
    }

    const { data: related } = await relatedQuery;

    if (related && related.length > 0) {
      threadEmails = [...related, email].sort(
        (a, b) =>
          new Date(a.created_at ?? 0).getTime() -
          new Date(b.created_at ?? 0).getTime()
      );
    }
  }

  // Mark as read
  if (!email.is_read) {
    await supabase.from("emails").update({ is_read: true }).eq("id", emailId);
  }

  const leftPane = (
    <EmailList
      emails={folderResult.data ?? []}
      folder={folder}
      orgId={org.id}
    />
  );

  const rightPane = (
    <EmailThread
      emails={threadEmails}
      currentEmailId={emailId}
      folder={folder}
    />
  );

  return (
    <ResizableSplitPane
      left={leftPane}
      right={rightPane}
      defaultWidth={380}
      minWidth={280}
      maxWidth={650}
      mobileShowRight={true}
    />
  );
}
