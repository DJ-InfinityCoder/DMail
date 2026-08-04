import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { EmailThread } from "@/components/mail/email-thread";
import { EmailList } from "@/components/mail/email-list";
import { ResizableSplitPane } from "@/components/mail/resizable-split-pane";

export const dynamic = "force-dynamic";

interface EmailDetailPageProps {
  params: Promise<{ folder: string; emailId: string }>;
}

export default async function EmailDetailPage({ params }: EmailDetailPageProps) {
  const { folder, emailId } = await params;
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

  // Fetch list of emails for folder left-pane
  let folderQuery = supabase
    .from("emails")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (folder === "starred") {
    folderQuery = folderQuery.eq("is_starred", true);
  } else {
    folderQuery = folderQuery.eq("folder", folder);
  }

  const { data: folderEmails } = await folderQuery;

  // Fetch the selected email
  const { data: email, error } = await supabase
    .from("emails")
    .select("*")
    .eq("id", emailId)
    .single();

  if (error || !email) notFound();

  // Fetch thread emails
  let threadEmails = [email];

  if (email.message_id) {
    const { data: related } = await supabase
      .from("emails")
      .select("*")
      .or(
        `in_reply_to.eq.${email.message_id},message_id.eq.${email.in_reply_to ?? ""}`
      )
      .neq("id", email.id)
      .order("created_at", { ascending: true });

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
    await supabase
      .from("emails")
      .update({ is_read: true })
      .eq("id", emailId);
  }

  const leftPane = (
    <EmailList
      emails={folderEmails ?? []}
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
