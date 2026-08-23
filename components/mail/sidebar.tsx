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
  Copy,
  Check,
} from "lucide-react";
import type { Organization, Mailbox } from "@/lib/types";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { useState } from "react";

interface SidebarProps {
  org: Organization;
  mailboxes: (Mailbox & { domains: { domain_name: string; send_enabled: boolean | null } })[];
  unreadCount: number;
  onCompose: () => void;
  user: User;
  onNavigate?: () => void;
}

const folders = [
  { name: "Inbox", slug: "inbox", icon: Inbox },
  { name: "Sent", slug: "sent", icon: Send },
  { name: "Drafts", slug: "drafts", icon: FileEdit },
  { name: "Starred", slug: "starred", icon: Star },
  { name: "Archive", slug: "archive", icon: Archive },
  { name: "Trash", slug: "trash", icon: Trash2 },
];

export function Sidebar({
  org,
  mailboxes,
  unreadCount,
  onCompose,
  user,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  const handleCopyAddress = (e: React.MouseEvent, mbId: string, address: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopiedId(mbId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <aside className="w-[var(--sidebar-width)] h-full flex flex-col border-r border-border bg-card">
      {/* Brand Header */}
      <div className="px-4 h-14 flex items-center justify-between border-b border-border/80 min-w-0">
        <div className="flex items-center gap-2.5">
          <img src="/icon.png" alt="DMail Logo" className="w-7 h-7 object-contain" />
          <span className="text-base font-bold tracking-tight text-foreground flex items-center">
            <span className="text-primary">D</span>Mail
          </span>
        </div>
        <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded bg-secondary text-muted-foreground">
          Workspace
        </span>
      </div>

      {/* Compose Button */}
      <div className="p-3">
        <button
          onClick={() => {
            onCompose();
            onNavigate?.();
          }}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
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
                onClick={() => onNavigate?.()}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-foreground/80 hover:bg-secondary hover:text-foreground"
                  }
                `}
              >
                <folder.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                <span className="flex-1">{folder.name}</span>
                {showBadge && (
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-primary text-primary-foreground min-w-[20px] text-center shadow-sm">
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
                  onClick={(e) => handleCopyAddress(e, mb.id, mb.address)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-foreground/80 hover:bg-secondary/70 hover:text-foreground transition-all cursor-pointer group/mb min-w-0"
                  title={`Click to copy ${mb.address}`}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="truncate flex-1 font-mono">{mb.address}</span>
                  <button
                    onClick={(e) => handleCopyAddress(e, mb.id, mb.address)}
                    className={`p-1 rounded hover:bg-background text-muted-foreground hover:text-foreground transition-opacity flex-shrink-0 ${
                      copiedId === mb.id
                        ? "opacity-100"
                        : "opacity-0 group-hover/mb:opacity-100"
                    }`}
                    title="Copy email address"
                  >
                    {copiedId === mb.id ? (
                      <Check className="w-3 h-3 text-emerald-500 animate-scale-in" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
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
          onClick={() => onNavigate?.()}
          className={`
            flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
            ${
              pathname.startsWith("/mail/settings")
                ? "bg-primary/10 text-primary font-bold"
                : "text-foreground/80 hover:bg-secondary hover:text-foreground"
            }
          `}
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
          <span>Settings & Domains</span>
        </Link>

        <div className="pt-1 flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground gap-1">
          <span className="truncate max-w-[120px] font-mono text-[10px] text-foreground/75" title={user.email}>
            {user.email}
          </span>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <PwaInstallButton showText={false} variant="ghost" size="icon" />
            <ThemeSwitcher size="icon" variant="ghost" align="start" />
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-md hover:bg-secondary hover:text-foreground text-muted-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
