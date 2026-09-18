"use client";

import React, { useState, useEffect, useCallback, useRef, type TouchEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Star,
  Archive,
  Trash2,
  MailOpen,
  Mail as MailIcon,
  RefreshCw,
  CheckSquare,
  Square,
  Search,
  Check,
  X,
  Inbox,
  Send,
  FileEdit,
  AlertTriangle,
  Clock,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useMailContext } from "@/components/mail/mail-shell";
import type { Email, EmailListItem } from "@/lib/types";

interface EmailListProps {
  emails: (Email | EmailListItem)[];
  folder: string;
  orgId: string;
  onOpenSearch?: () => void;
  onSnoozeEmail?: (emailId: string) => void;
}

const folderLabels: Record<string, string> = {
  inbox: "Inbox",
  sent: "Sent",
  drafts: "Drafts",
  trash: "Trash",
  archive: "Archive",
  starred: "Starred",
};

const folderEmptyStates: Record<
  string,
  { title: string; description: string; icon: any }
> = {
  inbox: {
    title: "All caught up! 🎉",
    description: "Your inbox is completely clear.",
    icon: Inbox,
  },
  sent: {
    title: "No sent messages",
    description: "Emails you send will appear right here.",
    icon: Send,
  },
  drafts: {
    title: "No saved drafts",
    description: "In-progress messages will be auto-saved here.",
    icon: FileEdit,
  },
  trash: {
    title: "Trash is empty",
    description: "Deleted messages will stay here until cleared.",
    icon: Trash2,
  },
  archive: {
    title: "Archive is empty",
    description: "Archived conversations will be stored here.",
    icon: Archive,
  },
  starred: {
    title: "No starred emails",
    description: "Star important messages to find them quickly.",
    icon: Star,
  },
};

const AVATAR_PALETTE = [
  "#8B1E2D", // Deep burgundy
  "#1E40AF", // Royal blue
  "#065F46", // Forest emerald
  "#92400E", // Warm amber
  "#5B21B6", // Deep purple
  "#9D174D", // Rose
  "#115E59", // Teal
  "#9A3412", // Burnt orange
  "#3730A3", // Indigo
];

function getAvatarColor(str: string): string {
  if (!str) return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function getInitials(name: string): string {
  if (!name) return "?";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatAddressDisplay(rawAddress: string) {
  if (!rawAddress) return { name: "Unknown", address: "" };

  const match = rawAddress.match(/^(?:"?([^"]*)"?\s)?<([^>]+)>$/);
  if (match) {
    const rawName = match[1]?.trim();
    const address = match[2];
    if (rawName && rawName.length > 0 && !rawName.includes("@")) {
      return { name: rawName, address };
    }
  }

  const cleanAddr = (match ? match[2] : rawAddress).trim();
  if (!cleanAddr.includes("@")) {
    return { name: cleanAddr, address: cleanAddr };
  }

  const [localPart, domainPart] = cleanAddr.split("@");
  const genericPrefixes = new Set([
    "team", "marketing", "hello", "support", "info", "contact",
    "billing", "notifications", "notification", "community", "webinar",
    "updates", "update", "security", "digest", "news", "newsletter",
    "sales", "press", "admin", "noreply", "no-reply"
  ]);

  // If local part is generic, extract recognizable brand name from domain
  if (genericPrefixes.has(localPart.toLowerCase()) && domainPart) {
    const domainParts = domainPart.split(".");
    const nonBrand = new Set([
      "com", "io", "app", "org", "net", "ai", "co", "news",
      "comms", "mail", "email", "team", "mg", "sendgrid", "website"
    ]);
    const brandCandidates = domainParts.filter((p) => !nonBrand.has(p.toLowerCase()));
    const brand = brandCandidates.length > 0 ? brandCandidates[brandCandidates.length - 1] : domainParts[0];

    const formattedBrand = brand
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[-_]/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return { name: formattedBrand, address: cleanAddr };
  }

  const formattedName = localPart
    .replace(/[-_.]/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return { name: formattedName, address: cleanAddr };
}

function formatShortDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();

  // Same day -> "12:44 PM"
  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isSameDay) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  ) {
    return "Yesterday";
  }

  // Within current calendar year -> "Aug 24"
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // Prior year -> "8/24/25"
  return date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" });
}

/* ──────────────────────────────────────────────
   Skeleton Loading State Component
   ────────────────────────────────────────────── */
function EmailListSkeleton() {
  return (
    <div className="p-1.5 space-y-1">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 px-3.5 py-2.5 rounded-xl border border-transparent"
        >
          <div className="w-8 h-8 rounded-full skeleton-shimmer flex-shrink-0 mt-0.5" />
          <div className="w-3.5 h-3.5 rounded skeleton-shimmer flex-shrink-0 mt-2" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex justify-between items-center">
              <div className="w-28 h-3.5 rounded skeleton-shimmer" />
              <div className="w-12 h-3 rounded skeleton-shimmer" />
            </div>
            <div className="w-48 h-3 rounded skeleton-shimmer" />
            <div className="w-full max-w-[260px] h-2.5 rounded skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Single Swipable Email Row Component
   ────────────────────────────────────────────── */
const SwipableEmailRow = React.memo(function SwipableEmailRow({
  email,
  folder,
  selectedId,
  isSelected,
  hasActiveSelection,
  onSelectToggle,
  onOpenEmail,
  onToggleStar,
  onArchive,
  onTrash,
  onMarkReadToggle,
  onSnooze,
}: {
  email: Email | EmailListItem;
  folder: string;
  selectedId: string | null;
  isSelected: boolean;
  hasActiveSelection: boolean;
  onSelectToggle: (e: React.MouseEvent, id: string) => void;
  onOpenEmail: (email: Email | EmailListItem) => void;
  onToggleStar: (e: React.MouseEvent, id: string, starred: boolean) => void;
  onArchive: (e: React.MouseEvent, id: string) => void;
  onTrash: (e: React.MouseEvent, id: string) => void;
  onMarkReadToggle: (id: string, isRead: boolean) => void;
  onSnooze?: (id: string) => void;
}) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const isSwiping = useRef(false);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isSwiping.current = true;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStartX.current === null || !isSwiping.current) return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - touchStartX.current;

    // Resistance formula
    if (Math.abs(diffX) < 180) {
      setSwipeOffset(diffX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    isSwiping.current = false;

    if (swipeOffset > 90) {
      onArchive(e as any, email.id);
    } else if (swipeOffset < -90) {
      onTrash(e as any, email.id);
    }

    setSwipeOffset(0);
    touchStartX.current = null;
  };

  const senderInfo = formatAddressDisplay(
    folder === "sent" ? email.to_address : email.from_address
  );

  return (
    <div className="relative overflow-hidden group">
      {/* Swipe Background Action Indicator (only visible during touch swipe) */}
      {swipeOffset !== 0 && (
        <div
          className={`absolute inset-0 flex items-center justify-between px-6 transition-colors font-medium text-xs text-white z-0 rounded-xl ${
            swipeOffset > 0 ? "bg-emerald-600 justify-start" : "bg-rose-600 justify-end"
          }`}
        >
          {swipeOffset > 0 ? (
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5" />
              <span>Archive</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>Delete</span>
              <Trash2 className="w-5 h-5" />
            </div>
          )}
        </div>
      )}

      {/* Row Card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => onOpenEmail(email)}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)" : "none",
        }}
        className={`
          flex items-start gap-3 px-3.5 py-2.5 mx-1 my-0.5 rounded-xl
          cursor-pointer transition-all duration-150 relative z-10 select-none border
          ${
            selectedId === email.id
              ? "bg-primary/[0.08] dark:bg-primary/[0.14] border-primary/30 shadow-xs"
              : isSelected
              ? "bg-primary/[0.05] border-primary/20"
              : !email.is_read
              ? "bg-card hover:bg-secondary/60 border-border/50 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
              : "bg-card/40 hover:bg-secondary/40 border-transparent text-muted-foreground/90"
          }
        `}
      >
        {/* Active email left indicator pill */}
        {selectedId === email.id && (
          <div className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-primary rounded-r-full shadow-xs" />
        )}

        {/* Left: Avatar with Checkbox Morph & Star */}
        <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
          {/* Morphing Avatar / Checkbox */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              onSelectToggle(e, email.id);
            }}
            className="relative w-8 h-8 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0 select-none group/avatar transition-transform active:scale-95"
            title={isSelected ? "Deselect" : "Select"}
          >
            {/* Colored Avatar with Sender Initials */}
            <div
              className={`w-full h-full rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-xs transition-all duration-150 ${
                isSelected
                  ? "hidden"
                  : hasActiveSelection
                  ? "hidden"
                  : "group-hover:hidden"
              }`}
              style={{ backgroundColor: getAvatarColor(email.from_address) }}
            >
              {getInitials(senderInfo.name)}
            </div>

            {/* Checkbox (visible on row hover, or when selected, or in multi-select mode) */}
            <div
              className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-150 ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-sm scale-100"
                  : hasActiveSelection
                  ? "flex bg-secondary border border-border text-muted-foreground/60 hover:text-foreground hover:border-primary"
                  : "hidden group-hover:flex bg-secondary border border-border/80 text-muted-foreground/60 hover:text-foreground hover:border-primary"
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>

          {/* Star button */}
          <button
            onClick={(e) => onToggleStar(e, email.id, !email.is_starred)}
            className="p-1 rounded-md text-muted-foreground/40 hover:text-amber-500 transition-colors"
            title={email.is_starred ? "Unstar" : "Star"}
          >
            <Star
              className={`w-4 h-4 transition-transform active:scale-125 ${
                email.is_starred
                  ? "fill-amber-500 text-amber-500"
                  : "hover:text-amber-500"
              }`}
            />
          </button>
        </div>

        {/* Middle: Content Column */}
        <div className="flex-1 min-w-0 pr-1">
          {/* Sender & Date Line */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              {!email.is_read && (
                <span
                  className="w-2 h-2 rounded-full bg-primary flex-shrink-0 animate-pulse"
                  title="Unread"
                />
              )}
              <span
                className={`text-xs truncate leading-snug ${
                  !email.is_read
                    ? "font-bold text-foreground"
                    : "font-semibold text-foreground/85"
                }`}
              >
                {folder === "sent" ? `To: ${senderInfo.name}` : senderInfo.name}
              </span>
            </div>
            <span
              className={`text-[11px] font-mono whitespace-nowrap flex-shrink-0 ${
                !email.is_read ? "font-bold text-primary" : "text-muted-foreground/70"
              }`}
            >
              {formatShortDate(email.created_at)}
            </span>
          </div>

          {/* Subject Line */}
          <h4
            className={`text-xs truncate leading-snug mb-0.5 ${
              !email.is_read
                ? "font-bold text-foreground"
                : "font-medium text-foreground/80"
            }`}
          >
            {email.subject ?? "(no subject)"}
          </h4>

          {/* Body Snippet */}
          {email.body_text && (
            <p className="text-[11px] text-muted-foreground/65 truncate leading-relaxed font-normal">
              {email.body_text}
            </p>
          )}
        </div>

        {/* Hover Floating Action Bar */}
        <div className="hidden group-hover:flex items-center gap-0.5 bg-background/95 dark:bg-card/95 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-border/80 shadow-md absolute right-3 top-2.5 z-20 animate-in fade-in-0 zoom-in-95 duration-100">
          <button
            onClick={(e) => onArchive(e, email.id)}
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Archive"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => onTrash(e, email.id)}
            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkReadToggle(email.id, !email.is_read);
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
          {onSnooze && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSnooze(email.id);
              }}
              className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
              title="Snooze"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

import { useQueryClient } from "@tanstack/react-query";
import { useFolderEmails } from "@/lib/hooks/use-emails-query";

/* ──────────────────────────────────────────────
   Main EmailList Component
   ────────────────────────────────────────────── */
export function EmailList({
  emails: initialEmails,
  folder,
  orgId,
  onOpenSearch,
  onSnoozeEmail,
}: EmailListProps) {
  const queryClient = useQueryClient();
  const { data: cachedEmails = initialEmails, refetch, isFetching } = useFolderEmails(
    folder,
    orgId,
    initialEmails
  );

  const [emails, setEmails] = useState<(Email | EmailListItem)[]>(cachedEmails);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const isLoading = isFetching && emails.length === 0;

  const touchContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { openSearch } = useMailContext();
  const handleSearchClick = onOpenSearch ?? openSearch;

  // Sync selectedId with active route (e.g. /mail/inbox/[emailId])
  useEffect(() => {
    if (pathname) {
      const segments = pathname.split("/").filter(Boolean);
      if (segments.length >= 3 && segments[0] === "mail") {
        setSelectedId(segments[2]);
      } else {
        setSelectedId(null);
      }
    }
  }, [pathname]);

  // Sync state when cachedEmails updates
  useEffect(() => {
    if (cachedEmails) {
      setEmails(cachedEmails);
    }
  }, [cachedEmails]);

  // Sync initial emails into query cache immediately
  useEffect(() => {
    if (initialEmails && initialEmails.length > 0) {
      queryClient.setQueryData(["emails", orgId, folder], initialEmails);
    }
  }, [initialEmails, orgId, folder, queryClient]);

  // Realtime postgres changes subscription synced directly with query cache
  useEffect(() => {
    const client = createClient();
    const channelId = `email-list-${folder}-${orgId}-${Math.random().toString(36).substring(2, 7)}`;
    const channel = client
      .channel(channelId)
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
              folder === "starred" ? newEmail.is_starred : newEmail.folder === folder;

            if (matchesFolder) {
              queryClient.setQueryData<Email[]>(["emails", orgId, folder], (prev = []) => {
                if (prev.some((e) => e.id === newEmail.id)) return prev;
                return [newEmail, ...prev];
              });
              setEmails((prev) => {
                if (prev.some((e) => e.id === newEmail.id)) return prev;
                return [newEmail, ...prev];
              });
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedEmail = payload.new as Email;
            const matchesFolder =
              folder === "starred" ? updatedEmail.is_starred : updatedEmail.folder === folder;

            queryClient.setQueryData<Email[]>(["emails", orgId, folder], (prev = []) => {
              if (matchesFolder) {
                const exists = prev.some((e) => e.id === updatedEmail.id);
                return exists
                  ? prev.map((e) => (e.id === updatedEmail.id ? updatedEmail : e))
                  : [updatedEmail, ...prev];
              } else {
                return prev.filter((e) => e.id !== updatedEmail.id);
              }
            });

            setEmails((prev) => {
              const existing = prev.find((e) => e.id === updatedEmail.id);
              if (
                existing &&
                existing.is_read === updatedEmail.is_read &&
                existing.is_starred === updatedEmail.is_starred &&
                existing.folder === updatedEmail.folder
              ) {
                return prev;
              }
              if (matchesFolder) {
                const exists = prev.some((e) => e.id === updatedEmail.id);
                return exists
                  ? prev.map((e) => (e.id === updatedEmail.id ? { ...e, ...updatedEmail } : e))
                  : [updatedEmail, ...prev];
              } else {
                return prev.filter((e) => e.id !== updatedEmail.id);
              }
            });
          } else if (payload.eventType === "DELETE") {
            const oldEmail = payload.old as { id: string };
            queryClient.setQueryData<Email[]>(["emails", orgId, folder], (prev = []) =>
              prev.filter((e) => e.id !== oldEmail.id)
            );
            setEmails((prev) => prev.filter((e) => e.id !== oldEmail.id));
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [orgId, folder, queryClient]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 300);
  }, [refetch]);

  // Touch Pull-to-refresh
  const handleTouchStartPull = (e: React.TouchEvent) => {
    if (touchContainerRef.current && touchContainerRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMovePull = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const dist = currentY - touchStartY.current;

    if (dist > 0 && dist < 120) {
      setPullDistance(dist);
    }
  };

  const handleTouchEndPull = () => {
    if (pullDistance > 60) {
      refresh();
    }
    setPullDistance(0);
    touchStartY.current = null;
  };

  const toggleStar = useCallback(
    async (e: React.MouseEvent, emailId: string, currentStarred: boolean) => {
      e.stopPropagation();
      const updatedStarred = !currentStarred;
      queryClient.setQueryData<Email[]>(["emails", orgId, folder], (prev = []) =>
        prev.map((em) => (em.id === emailId ? { ...em, is_starred: updatedStarred } : em))
      );
      setEmails((prev) =>
        prev.map((em) => (em.id === emailId ? { ...em, is_starred: updatedStarred } : em))
      );
      await supabase.from("emails").update({ is_starred: updatedStarred }).eq("id", emailId);
    },
    [supabase, orgId, folder, queryClient]
  );

  const archiveEmail = useCallback(
    async (e: React.MouseEvent, emailId: string) => {
      e.stopPropagation();
      queryClient.setQueryData<Email[]>(["emails", orgId, folder], (prev = []) =>
        prev.filter((em) => em.id !== emailId)
      );
      setEmails((prev) => prev.filter((em) => em.id !== emailId));
      await supabase.from("emails").update({ folder: "archive" }).eq("id", emailId);
    },
    [supabase, orgId, folder, queryClient]
  );

  const trashEmail = useCallback(
    async (e: React.MouseEvent, emailId: string) => {
      e.stopPropagation();
      queryClient.setQueryData<Email[]>(["emails", orgId, folder], (prev = []) =>
        prev.filter((em) => em.id !== emailId)
      );
      setEmails((prev) => prev.filter((em) => em.id !== emailId));
      await supabase.from("emails").update({ folder: "trash" }).eq("id", emailId);
    },
    [supabase, orgId, folder, queryClient]
  );

  const markReadToggle = useCallback(
    async (emailId: string, isRead: boolean) => {
      const updatedRead = !isRead;
      queryClient.setQueryData<Email[]>(["emails", orgId, folder], (prev = []) =>
        prev.map((em) => (em.id === emailId ? { ...em, is_read: updatedRead } : em))
      );
      setEmails((prev) =>
        prev.map((em) => (em.id === emailId ? { ...em, is_read: updatedRead } : em))
      );
      await supabase.from("emails").update({ is_read: updatedRead }).eq("id", emailId);
    },
    [supabase, orgId, folder, queryClient]
  );

  const handleSelectToggle = (e: React.MouseEvent, emailId: string) => {
    e.stopPropagation();
    setSelectedEmailIds((prev) =>
      prev.includes(emailId) ? prev.filter((id) => id !== emailId) : [...prev, emailId]
    );
  };

  const handleSelectAll = () => {
    if (selectedEmailIds.length === emails.length) {
      setSelectedEmailIds([]);
    } else {
      setSelectedEmailIds(emails.map((e) => e.id));
    }
  };

  // Batch actions
  const handleBatchArchive = async () => {
    const ids = selectedEmailIds;
    queryClient.setQueryData<Email[]>(["emails", orgId, folder], (prev = []) =>
      prev.filter((e) => !ids.includes(e.id))
    );
    setEmails((prev) => prev.filter((e) => !ids.includes(e.id)));
    setSelectedEmailIds([]);
    await supabase.from("emails").update({ folder: "archive" }).in("id", ids);
  };

  const handleBatchDelete = async () => {
    const ids = selectedEmailIds;
    queryClient.setQueryData<Email[]>(["emails", orgId, folder], (prev = []) =>
      prev.filter((e) => !ids.includes(e.id))
    );
    setEmails((prev) => prev.filter((e) => !ids.includes(e.id)));
    setSelectedEmailIds([]);
    await supabase.from("emails").update({ folder: "trash" }).in("id", ids);
  };

  const handleBatchMarkRead = async (isRead: boolean) => {
    const ids = selectedEmailIds;
    queryClient.setQueryData<Email[]>(["emails", orgId, folder], (prev = []) =>
      prev.map((e) => (ids.includes(e.id) ? { ...e, is_read: isRead } : e))
    );
    setEmails((prev) =>
      prev.map((e) => (ids.includes(e.id) ? { ...e, is_read: isRead } : e))
    );
    setSelectedEmailIds([]);
    await supabase.from("emails").update({ is_read: isRead }).in("id", ids);
  };

  const openEmail = useCallback(
    (email: Email | EmailListItem) => {
      setSelectedId(email.id);

      if (!email.is_read) {
        queryClient.setQueryData<Email[]>(["emails", orgId, folder], (prev = []) =>
          prev.map((em) => (em.id === email.id ? { ...em, is_read: true } : em))
        );
        setEmails((prev) =>
          prev.map((em) => (em.id === email.id ? { ...em, is_read: true } : em))
        );
        supabase.from("emails").update({ is_read: true }).eq("id", email.id).then();
      }
      router.push(`/mail/${folder}/${email.id}`);
    },
    [supabase, folder, router, orgId, queryClient]
  );

  const EmptyStateIcon = folderEmptyStates[folder]?.icon ?? Inbox;

  return (
    <div className="w-full flex flex-col h-full border-r border-border bg-card/20 select-none">
      {/* Top Bar / Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border flex-shrink-0 bg-card">
        {selectedEmailIds.length > 0 ? (
          /* Multi-Select Batch Actions Header */
          <div className="flex items-center justify-between w-full animate-fade-in">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="p-1 rounded hover:bg-secondary text-primary font-bold text-xs flex items-center gap-1.5"
              >
                <CheckSquare className="w-4 h-4" />
                <span>{selectedEmailIds.length} Selected</span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleBatchArchive}
                className="p-2 rounded-lg hover:bg-secondary text-foreground transition-colors"
                title="Archive Selected"
              >
                <Archive className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleBatchMarkRead(true)}
                className="p-2 rounded-lg hover:bg-secondary text-foreground transition-colors"
                title="Mark Read"
              >
                <MailOpen className="w-4 h-4" />
              </button>
              <button
                onClick={handleBatchDelete}
                className="p-2 rounded-lg hover:bg-secondary text-destructive transition-colors"
                title="Delete Selected"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedEmailIds([])}
                className="p-1.5 rounded hover:bg-secondary text-muted-foreground ml-1"
                title="Clear Selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Standard Header Bar */
          <>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-foreground tracking-tight">
                {folderLabels[folder] ?? folder}
              </h1>
              <span className="text-xs font-mono text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                {emails.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Quick Search Button (Ctrl+K / ⌘K) */}
              <button
                onClick={handleSearchClick}
                className="px-2 py-1.5 rounded-lg hover:bg-secondary/70 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 text-xs border border-border/40 bg-card/60"
                title="Search (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-sans font-semibold text-muted-foreground">
                  <kbd className="px-1 py-0.5 rounded bg-secondary border border-border text-[9px] font-mono leading-none">Ctrl</kbd>
                  <span className="text-[9px]">+</span>
                  <kbd className="px-1 py-0.5 rounded bg-secondary border border-border text-[9px] font-mono leading-none">K</kbd>
                </span>
              </button>

              {/* Refresh Button */}
              <button
                onClick={refresh}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Touch Pull-to-refresh Indicator */}
      {pullDistance > 0 && (
        <div
          style={{ height: `${pullDistance}px` }}
          className="flex items-center justify-center bg-primary/5 border-b border-primary/20 text-primary overflow-hidden transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${pullDistance > 60 ? "animate-spin" : ""}`} />
        </div>
      )}

      {/* Main Email List Content */}
      <div
        ref={touchContainerRef}
        onTouchStart={handleTouchStartPull}
        onTouchMove={handleTouchMovePull}
        onTouchEnd={handleTouchEndPull}
        className="flex-1 overflow-y-auto p-1.5 space-y-0.5"
      >
        {isLoading ? (
          <EmailListSkeleton />
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20 px-4 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
              <EmptyStateIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">
              {folderEmptyStates[folder]?.title ?? "No messages"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-[240px]">
              {folderEmptyStates[folder]?.description ?? "This folder is currently empty."}
            </p>
          </div>
        ) : (
          emails.map((email) => (
            <SwipableEmailRow
              key={email.id}
              email={email}
              folder={folder}
              selectedId={selectedId}
              isSelected={selectedEmailIds.includes(email.id)}
              hasActiveSelection={selectedEmailIds.length > 0}
              onSelectToggle={handleSelectToggle}
              onOpenEmail={openEmail}
              onToggleStar={toggleStar}
              onArchive={archiveEmail}
              onTrash={trashEmail}
              onMarkReadToggle={markReadToggle}
              onSnooze={onSnoozeEmail}
            />
          ))
        )}
      </div>
    </div>
  );
}
