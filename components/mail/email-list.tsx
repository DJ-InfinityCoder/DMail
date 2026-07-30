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
import { formatDistanceToNow } from "date-fns";
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

export function EmailList({ emails: initialEmails, folder, orgId }: EmailListProps) {
  const [emails, setEmails] = useState(initialEmails);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Sync initialEmails whenever Server Component re-fetches / passes new props
  useEffect(() => {
    setEmails(initialEmails);
  }, [initialEmails]);

  // Subscribe to Realtime changes for instant UI updates
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
      // Optimistic update
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
      // Mark as read
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
    <div className="w-full flex flex-col h-full border-r border-border bg-card/40">
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-border/80 flex-shrink-0 bg-card">
        <h1 className="text-base font-bold text-foreground tracking-tight">{folderLabels[folder] ?? folder}</h1>
        <button
          onClick={refresh}
          className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          title="Refresh"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MailIcon className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm">No emails in {folderLabels[folder] ?? folder}</p>
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
                className={`email-row group ${
                  selectedId === email.id ? "active" : ""
                } ${!email.is_read ? "unread" : ""}`}
              >
                {/* Unread dot */}
                <div className="w-2 flex-shrink-0">
                  {!email.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </div>

                {/* Star */}
                <button
                  onClick={(e) => toggleStar(e, email.id, !!email.is_starred)}
                  className="flex-shrink-0 text-muted-foreground hover:text-yellow-500 transition-colors"
                >
                  <Star
                    className={`w-4 h-4 ${
                      email.is_starred
                        ? "fill-yellow-500 text-yellow-500"
                        : ""
                    }`}
                  />
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <span
                        className={`text-sm truncate ${
                          !email.is_read
                            ? "font-bold text-foreground"
                            : "font-semibold text-foreground/85"
                        }`}
                      >
                        {folder === "sent" ? `To: ${senderInfo.name}` : senderInfo.name}
                      </span>
                      <span className="text-xs text-muted-foreground/70 font-mono truncate">
                        &lt;{senderInfo.address}&gt;
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground flex-shrink-0">
                      {email.created_at
                        ? formatDistanceToNow(new Date(email.created_at), {
                            addSuffix: true,
                          })
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs truncate ${!email.is_read ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {email.subject ?? "(no subject)"}
                    </span>
                  </div>
                  {email.body_text && (
                    <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5 font-sans">
                      {email.body_text.slice(0, 110)}
                    </p>
                  )}
                </div>

                {/* Quick actions (visible on hover) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
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
