"use client";

import { useState, useEffect, useCallback, useRef, type TouchEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  Archive,
  Trash2,
  MailOpen,
  Mail as MailIcon,
  RefreshCw,
  CheckSquare,
  Square,
  SlidersHorizontal,
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
import type { Email } from "@/lib/types";

interface EmailListProps {
  emails: Email[];
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

/* ──────────────────────────────────────────────
   Skeleton Loading State Component
   ────────────────────────────────────────────── */
function EmailListSkeleton({ density }: { density: "comfortable" | "compact" }) {
  return (
    <div className="divide-y divide-border/30">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className={`flex items-start gap-3.5 px-4 ${
            density === "compact" ? "py-2" : "py-3.5"
          }`}
        >
          <div className="w-4 h-4 rounded skeleton-shimmer mt-1 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-center">
              <div className="w-28 h-3.5 rounded skeleton-shimmer" />
              <div className="w-12 h-3 rounded skeleton-shimmer" />
            </div>
            <div className="w-48 h-3 rounded skeleton-shimmer" />
            {density === "comfortable" && (
              <div className="w-full max-w-[280px] h-2.5 rounded skeleton-shimmer" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Single Swipable Email Row Component
   ────────────────────────────────────────────── */
function SwipableEmailRow({
  email,
  folder,
  selectedId,
  isSelected,
  density,
  onSelectToggle,
  onOpenEmail,
  onToggleStar,
  onArchive,
  onTrash,
  onMarkReadToggle,
  onSnooze,
}: {
  email: Email;
  folder: string;
  selectedId: string | null;
  isSelected: boolean;
  density: "comfortable" | "compact";
  onSelectToggle: (e: React.MouseEvent, id: string) => void;
  onOpenEmail: (email: Email) => void;
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
      // Swiped right -> Archive
      onArchive(e as any, email.id);
    } else if (swipeOffset < -90) {
      // Swiped left -> Delete
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
          className={`absolute inset-0 flex items-center justify-between px-6 transition-colors font-medium text-xs text-white z-0 ${
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

      {/* Row content */}
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
          flex items-start gap-3 px-4 ${density === "compact" ? "py-2" : "py-3"}
          cursor-pointer transition-colors duration-150 relative bg-card z-10 select-none border-b border-border/30
          ${selectedId === email.id ? "bg-primary/10 border-l-4 border-l-primary" : ""}
          ${isSelected ? "bg-primary/5" : ""}
          ${!email.is_read ? "font-semibold bg-card" : "bg-card hover:bg-secondary/40"}
        `}
      >
        {/* Selection Checkbox */}
        <button
          onClick={(e) => onSelectToggle(e, email.id)}
          className="pt-0.5 text-muted-foreground hover:text-foreground transition-colors touch-target -ml-1"
          title={isSelected ? "Deselect" : "Select"}
        >
          {isSelected ? (
            <CheckSquare className="w-4 h-4 text-[#8B1E2D]" />
          ) : (
            <Square className="w-4 h-4 text-muted-foreground/50 hover:text-muted-foreground" />
          )}
        </button>

        {/* Star & Unread Indicator */}
        <div className="flex flex-col items-center gap-1.5 pt-0.5 flex-shrink-0">
          <button
            onClick={(e) => onToggleStar(e, email.id, !!email.is_starred)}
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
            <span className="w-2 h-2 rounded-full bg-[#8B1E2D] shadow-sm pulse-dot" title="Unread" />
          )}
        </div>

        {/* Content Column */}
        <div className="flex-1 min-w-0">
          {/* Sender & Date */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span
              className={`text-sm truncate leading-snug ${
                !email.is_read ? "font-bold text-foreground" : "font-semibold text-foreground/80"
              }`}
            >
              {folder === "sent" ? `To: ${senderInfo.name}` : senderInfo.name}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap flex-shrink-0">
              {formatShortDate(email.created_at)}
            </span>
          </div>

          {/* Subject */}
          <h4
            className={`text-xs truncate leading-snug mb-0.5 ${
              !email.is_read ? "font-bold text-foreground" : "font-medium text-foreground/80"
            }`}
          >
            {email.subject ?? "(no subject)"}
          </h4>

          {/* Body Snippet */}
          {density === "comfortable" && email.body_text && (
            <p className="text-[11px] text-muted-foreground/75 truncate leading-relaxed">
              {email.body_text}
            </p>
          )}
        </div>

        {/* Hover Quick Actions Toolbar */}
        <div className="hidden group-hover:flex items-center gap-0.5 bg-card/95 backdrop-blur-sm p-1 rounded-lg border border-border shadow-md absolute right-3 top-2.5 z-20">
          <button
            onClick={(e) => onArchive(e, email.id)}
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Archive"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => onTrash(e, email.id)}
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkReadToggle(email.id, !!email.is_read);
            }}
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title={email.is_read ? "Mark unread" : "Mark read"}
          >
            {email.is_read ? <MailIcon className="w-3.5 h-3.5" /> : <MailOpen className="w-3.5 h-3.5" />}
          </button>
          {onSnooze && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSnooze(email.id);
              }}
              className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-[#8B1E2D] transition-colors"
              title="Snooze"
            >
              <Clock className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [emails, setEmails] = useState(initialEmails);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [pullDistance, setPullDistance] = useState(0);

  const touchContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const { openSearch } = useMailContext();
  const handleSearchClick = onOpenSearch ?? openSearch;

  useEffect(() => {
    setEmails(initialEmails);
    setSelectedEmailIds([]);
  }, [initialEmails]);

  // Realtime postgres changes subscription
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
              setEmails((prev) => {
                if (prev.some((e) => e.id === newEmail.id)) return prev;
                return [newEmail, ...prev];
              });
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedEmail = payload.new as Email;
            const matchesFolder =
              folder === "starred" ? updatedEmail.is_starred : updatedEmail.folder === folder;

            setEmails((prev) => {
              if (matchesFolder) {
                const exists = prev.some((e) => e.id === updatedEmail.id);
                return exists
                  ? prev.map((e) => (e.id === updatedEmail.id ? updatedEmail : e))
                  : [updatedEmail, ...prev];
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
      client.removeChannel(channel);
    };
  }, [orgId, folder]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  }, [router]);

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
      setEmails((prev) =>
        prev.map((em) => (em.id === emailId ? { ...em, is_starred: !currentStarred } : em))
      );
      await supabase.from("emails").update({ is_starred: !currentStarred }).eq("id", emailId);
    },
    [supabase]
  );

  const archiveEmail = useCallback(
    async (e: React.MouseEvent, emailId: string) => {
      e.stopPropagation();
      setEmails((prev) => prev.filter((em) => em.id !== emailId));
      await supabase.from("emails").update({ folder: "archive" }).eq("id", emailId);
    },
    [supabase]
  );

  const trashEmail = useCallback(
    async (e: React.MouseEvent, emailId: string) => {
      e.stopPropagation();
      setEmails((prev) => prev.filter((em) => em.id !== emailId));
      await supabase.from("emails").update({ folder: "trash" }).eq("id", emailId);
    },
    [supabase]
  );

  const markReadToggle = useCallback(
    async (emailId: string, isRead: boolean) => {
      setEmails((prev) =>
        prev.map((em) => (em.id === emailId ? { ...em, is_read: !isRead } : em))
      );
      await supabase.from("emails").update({ is_read: !isRead }).eq("id", emailId);
    },
    [supabase]
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
    setEmails((prev) => prev.filter((e) => !ids.includes(e.id)));
    setSelectedEmailIds([]);
    await supabase.from("emails").update({ folder: "archive" }).in("id", ids);
  };

  const handleBatchDelete = async () => {
    const ids = selectedEmailIds;
    setEmails((prev) => prev.filter((e) => !ids.includes(e.id)));
    setSelectedEmailIds([]);
    await supabase.from("emails").update({ folder: "trash" }).in("id", ids);
  };

  const handleBatchMarkRead = async (isRead: boolean) => {
    const ids = selectedEmailIds;
    setEmails((prev) =>
      prev.map((e) => (ids.includes(e.id) ? { ...e, is_read: isRead } : e))
    );
    setSelectedEmailIds([]);
    await supabase.from("emails").update({ is_read: isRead }).in("id", ids);
  };

  const openEmail = useCallback(
    async (email: Email) => {
      setSelectedId(email.id);
      if (!email.is_read) {
        setEmails((prev) =>
          prev.map((em) => (em.id === email.id ? { ...em, is_read: true } : em))
        );
        await supabase.from("emails").update({ is_read: true }).eq("id", email.id);
      }
      router.push(`/mail/${folder}/${email.id}`);
    },
    [supabase, folder, router]
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
                className="p-1 rounded hover:bg-secondary text-[#8B1E2D] font-bold text-xs flex items-center gap-1.5"
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
                <Search className="w-3.5 h-3.5 text-[#8B1E2D]" />
                <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-sans font-semibold text-muted-foreground">
                  <kbd className="px-1 py-0.5 rounded bg-secondary border border-border text-[9px] font-mono leading-none">Ctrl</kbd>
                  <span className="text-[9px]">+</span>
                  <kbd className="px-1 py-0.5 rounded bg-secondary border border-border text-[9px] font-mono leading-none">K</kbd>
                </span>
              </button>

              {/* Density Toggle */}
              <button
                onClick={() =>
                  setDensity((d) => (d === "comfortable" ? "compact" : "comfortable"))
                }
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title={`Density: ${density}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
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
          className="flex items-center justify-center bg-primary/5 border-b border-primary/20 text-[#8B1E2D] overflow-hidden transition-all"
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
        className="flex-1 overflow-y-auto divide-y divide-border/40"
      >
        {isLoading ? (
          <EmailListSkeleton density={density} />
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-20 px-4 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-[#8B1E2D]/10 text-[#8B1E2D] flex items-center justify-center mb-4 shadow-sm">
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
              density={density}
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
