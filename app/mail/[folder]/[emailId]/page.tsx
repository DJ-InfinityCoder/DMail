import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { EmailThread } from "@/components/mail/email-thread";

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

  // Fetch the selected email
  const { data: email, error } = await supabase
    .from("emails")
    .select("*")
    .eq("id", emailId)
    .single();

  if (error || !email) notFound();

  // Fetch thread emails (by message_id / in_reply_to / references)
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

  return (
    <EmailThread
      emails={threadEmails}
      currentEmailId={emailId}
      folder={folder}
    />
  );
}
