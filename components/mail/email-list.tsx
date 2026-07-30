"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  Archive,
  Trash2,
  MailOpen,
  Mail as MailIcon,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Email } from "@/lib/types";

interface EmailListProps {
  emails: Email[];
  folder: string;
  orgId: string;
}

const folderLabels: Record<string, string> = {
  inbox: "Inbox",
  sent: "Sent",
  drafts: "Drafts",
  trash: "Trash",
  archive: "Archive",
  spam: "Spam",
  starred: "Starred",
};

function formatAddressDisplay(rawAddress: string) {
  if (!rawAddress) return { name: "Unknown", address: "" };

  const match = rawAddress.match(/^(?:"?([^"]*)"?\s)?<([^>]+)>$/);
  if (match) {
    const name = match[1]?.trim() || match[2].split("@")[0];
    return { name, address: match[2] };
  }

  if (rawAddress.includes("@")) {
    const parts = rawAddress.split("@");
    return { name: parts[0], address: rawAddress };
  }

  return { name: rawAddress, address: rawAddress };
}

function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function EmailList({ emails: initialEmails, folder, orgId }: EmailListProps) {
  const [emails, setEmails] = useState(initialEmails);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    setEmails(initialEmails);
  }, [initialEmails]);

  useEffect(() => {
    const channel = supabase
      .channel(`email-list-${folder}-${orgId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "emails",
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newEmail = payload.new as Email;
            const matchesFolder =
              folder === "starred"
                ? newEmail.is_starred
                : newEmail.folder === folder;

            if (matchesFolder) {
              setEmails((prev) => {
                if (prev.some((e) => e.id === newEmail.id)) return prev;
                return [newEmail, ...prev];
              });
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedEmail = payload.new as Email;
            const matchesFolder =
              folder === "starred"
                ? updatedEmail.is_starred
                : updatedEmail.folder === folder;

            setEmails((prev) => {
              if (matchesFolder) {
                const exists = prev.some((e) => e.id === updatedEmail.id);
                if (exists) {
                  return prev.map((e) =>
                    e.id === updatedEmail.id ? updatedEmail : e
                  );
                } else {
                  return [updatedEmail, ...prev];
                }
              } else {
                return prev.filter((e) => e.id !== updatedEmail.id);
              }
            });
          } else if (payload.eventType === "DELETE") {
            const oldEmail = payload.old as { id: string };
            setEmails((prev) => prev.filter((e) => e.id !== oldEmail.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, orgId, folder]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [router]);

  const toggleStar = useCallback(
    async (e: React.MouseEvent, emailId: string, currentStarred: boolean) => {
      e.stopPropagation();
      setEmails((prev) =>
        prev.map((em) =>
          em.id === emailId ? { ...em, is_starred: !currentStarred } : em
        )
      );
      await supabase
        .from("emails")
        .update({ is_starred: !currentStarred })
        .eq("id", emailId);
    },
    [supabase]
  );

  const archiveEmail = useCallback(
    async (e: React.MouseEvent, emailId: string) => {
      e.stopPropagation();
      setEmails((prev) => prev.filter((em) => em.id !== emailId));
      await supabase
        .from("emails")
        .update({ folder: "archive" })
        .eq("id", emailId);
    },
    [supabase]
  );

  const trashEmail = useCallback(
    async (e: React.MouseEvent, emailId: string) => {
      e.stopPropagation();
      setEmails((prev) => prev.filter((em) => em.id !== emailId));
      await supabase
        .from("emails")
        .update({ folder: "trash" })
        .eq("id", emailId);
    },
    [supabase]
  );

  const markReadToggle = useCallback(
    async (emailId: string, isRead: boolean) => {
      setEmails((prev) =>
        prev.map((em) =>
          em.id === emailId ? { ...em, is_read: !isRead } : em
        )
      );
      await supabase
        .from("emails")
        .update({ is_read: !isRead })
        .eq("id", emailId);
    },
    [supabase]
  );

  const openEmail = useCallback(
    async (email: Email) => {
      setSelectedId(email.id);
      if (!email.is_read) {
        setEmails((prev) =>
          prev.map((em) =>
            em.id === email.id ? { ...em, is_read: true } : em
          )
        );
        await supabase
          .from("emails")
          .update({ is_read: true })
          .eq("id", email.id);
      }
      router.push(`/mail/${folder}/${email.id}`);
    },
    [supabase, folder, router]
  );

  return (
    <div className="w-full flex flex-col h-full border-r border-border bg-card/20">
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-border flex-shrink-0 bg-card">
        <h1 className="text-lg font-extrabold text-foreground tracking-tight">
          {folderLabels[folder] ?? folder}
        </h1>
        <button
          onClick={refresh}
          className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-16">
            <MailIcon className="w-12 h-12 mb-3 opacity-30 text-[#8B1E2D]" />
            <p className="text-sm font-medium">No emails in {folderLabels[folder] ?? folder}</p>
          </div>
        ) : (
          emails.map((email) => {
            const senderInfo = formatAddressDisplay(
              folder === "sent" ? email.to_address : email.from_address
            );

            return (
              <div
                key={email.id}
                onClick={() => openEmail(email)}
                className={`
                  flex items-start gap-3.5 px-4 py-3.5 cursor-pointer transition-all duration-150 relative group
                  ${selectedId === email.id ? "bg-primary/10 border-l-4 border-l-primary" : ""}
                  ${!email.is_read ? "bg-background/90 font-semibold" : "bg-card/20 hover:bg-secondary/50"}
                `}
              >
                {/* Left Star & Unread indicator */}
                <div className="flex flex-col items-center gap-2 pt-0.5 flex-shrink-0">
                  <button
                    onClick={(e) => toggleStar(e, email.id, !!email.is_starred)}
                    className="text-muted-foreground hover:text-amber-500 transition-colors p-0.5"
                    title={email.is_starred ? "Unstar" : "Star"}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        email.is_starred
                          ? "fill-amber-500 text-amber-500"
                          : "text-muted-foreground/40 hover:text-amber-500"
                      }`}
                    />
                  </button>
                  {!email.is_read && (
                    <span className="w-2 h-2 rounded-full bg-[#8B1E2D] shadow-sm" title="Unread email" />
                  )}
                </div>

                {/* Main Content Column */}
                <div className="flex-1 min-w-0">
                  {/* Line 1: Sender & Date */}
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-sm truncate leading-snug ${
                        !email.is_read
                          ? "font-bold text-foreground"
                          : "font-semibold text-foreground/80"
                      }`}
                    >
                      {folder === "sent" ? `To: ${senderInfo.name}` : senderInfo.name}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {formatShortDate(email.created_at)}
                    </span>
                  </div>

                  {/* Line 2: Subject */}
                  <h4
                    className={`text-xs truncate mb-1 leading-snug ${
                      !email.is_read
                        ? "font-bold text-foreground"
                        : "font-medium text-foreground/80"
                    }`}
                  >
                    {email.subject ?? "(no subject)"}
                  </h4>

                  {/* Line 3: Body snippet */}
                  {email.body_text && (
                    <p className="text-[11px] text-muted-foreground/75 truncate leading-relaxed font-sans">
                      {email.body_text}
                    </p>
                  )}
                </div>

                {/* Quick actions bar (visible on hover / active) */}
                <div className="hidden group-hover:flex items-center gap-1 bg-card/95 backdrop-blur-sm p-1 rounded-lg border border-border shadow-md absolute right-3 top-3 z-10">
                  <button
                    onClick={(e) => archiveEmail(e, email.id)}
                    className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    title="Archive"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => trashEmail(e, email.id)}
                    className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markReadToggle(email.id, !!email.is_read);
                    }}
                    className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    title={email.is_read ? "Mark unread" : "Mark read"}
                  >
                    {email.is_read ? (
                      <MailIcon className="w-3.5 h-3.5" />
                    ) : (
                      <MailOpen className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
