"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  Send,
  FileEdit,
  Star,
  Archive,
  Trash2,
  AlertTriangle,
  Settings,
  Plus,
  LogOut,
} from "lucide-react";
import type { Organization, Mailbox } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface SidebarProps {
  org: Organization;
  mailboxes: (Mailbox & { domains: { domain_name: string; send_enabled: boolean | null } })[];
  unreadCount: number;
  onCompose: () => void;
  user: User;
}

const folders = [
  { name: "Inbox", slug: "inbox", icon: Inbox },
  { name: "Sent", slug: "sent", icon: Send },
  { name: "Drafts", slug: "drafts", icon: FileEdit },
  { name: "Starred", slug: "starred", icon: Star },
  { name: "Archive", slug: "archive", icon: Archive },
  { name: "Spam", slug: "spam", icon: AlertTriangle },
  { name: "Trash", slug: "trash", icon: Trash2 },
];

export function Sidebar({
  org,
  mailboxes,
  unreadCount,
  onCompose,
  user,
}: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <aside className="w-[var(--sidebar-width)] h-full flex flex-col border-r border-border bg-card">
      {/* Brand Header */}
      <div className="px-4 h-14 flex items-center justify-between border-b border-border/80 min-w-0">
        <span className="text-base font-bold tracking-tight text-[#8B1E2D]">
          DMail
        </span>
        <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded bg-secondary text-muted-foreground">
          Workspace
        </span>
      </div>

      {/* Compose Button */}
      <div className="p-3">
        <button
          onClick={onCompose}
          className="w-full flex items-center  gap-2 px-4 py-2.5 rounded-lg bg-[#8B1E2D] text-white text-sm font-semibold hover:bg-[#6E1522] transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Compose</span>
        </button>
      </div>

      {/* Folder Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2 space-y-6">
        <div className="space-y-1">
          {folders.map((folder) => {
            const isActive =
              pathname === `/mail/${folder.slug}` ||
              pathname.startsWith(`/mail/${folder.slug}/`);
            const showBadge = folder.slug === "inbox" && unreadCount > 0;

            return (
              <Link
                key={folder.slug}
                href={`/mail/${folder.slug}`}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "bg-[#8B1E2D]/10 text-[#8B1E2D] font-bold"
                      : "text-foreground/80 hover:bg-secondary hover:text-foreground"
                  }
                `}
              >
                <folder.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-[#8B1E2D]" : "text-muted-foreground"}`} />
                <span className="flex-1">{folder.name}</span>
                {showBadge && (
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#8B1E2D] text-white min-w-[20px] text-center shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Mailboxes List */}
        {mailboxes.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Connected Mailboxes
            </div>
            <div className="space-y-1">
              {mailboxes.map((mb) => (
                <div
                  key={mb.id}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono text-foreground/90 hover:bg-secondary/60 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="truncate">{mb.address}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom: Settings & User Account */}
      <div className="border-t border-border p-2.5 space-y-1 bg-muted/20">
        <Link
          href="/mail/settings"
          className={`
            flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
            ${
              pathname.startsWith("/mail/settings")
                ? "bg-[#8B1E2D]/10 text-[#8B1E2D] font-bold"
                : "text-foreground/80 hover:bg-secondary hover:text-foreground"
            }
          `}
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
          <span>Settings & Domains</span>
        </Link>

        <div className="pt-1 flex items-center justify-between px-3 py-1.5 text-xs text-muted-foreground">
          <span className="truncate max-w-[140px] font-mono text-[11px]" title={user.email}>
            {user.email}
          </span>
          <button
            onClick={handleSignOut}
            className="p-1 rounded hover:bg-secondary hover:text-foreground text-muted-foreground transition-colors"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
