import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { EmailThread } from "@/components/mail/email-thread";

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

  // Fetch only the selected email
  const { data: email, error } = await supabase
    .from("emails")
    .select("*")
    .eq("id", emailId)
    .eq("org_id", org.id)
    .single();

  if (error || !email) notFound();

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

  // Decoupled asynchronous write - does not block page rendering
  if (!email.is_read) {
    supabase
      .from("emails")
      .update({ is_read: true })
      .eq("id", emailId)
      .then();
  }

  return (
    <EmailThread
      emails={threadEmails}
      currentEmailId={emailId}
      folder={folder}
    />
  );
}
