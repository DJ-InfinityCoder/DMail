"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { Menu, X, Plus } from "lucide-react";
import { Sidebar } from "@/components/mail/sidebar";
import { ComposeModal } from "@/components/mail/compose-modal";
import { KeyboardShortcutsOverlay } from "@/components/mail/keyboard-shortcuts-overlay";
import { ThemeToggle } from "@/components/theme-switcher";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { NotificationProvider, useNotifications } from "@/components/notification-provider";
import { useRealtimeInbox } from "@/lib/hooks/use-realtime-inbox";
import { useRecentContacts } from "@/lib/hooks/use-recent-contacts";
import type { Organization, Mailbox } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

interface ReplyContext {
  inReplyTo?: string;
  references?: string[];
  subject?: string;
  to?: string;
}

interface MailContextType {
  openCompose: (context?: ReplyContext) => void;
  recentContacts: string[];
  addContactsToCache: (addrs: string[]) => void;
}

const MailContext = createContext<MailContextType>({
  openCompose: () => {},
  recentContacts: [],
  addContactsToCache: () => {},
});

export const useMailContext = () => useContext(MailContext);

function BadgeSync({ unreadCount }: { unreadCount: number }) {
  const { updateBadge } = useNotifications();
  useEffect(() => {
    updateBadge(unreadCount);
  }, [unreadCount, updateBadge]);
  return null;
}

interface MailShellProps {
  user: User;
  org: Organization;
  mailboxes: (Mailbox & { domains: { domain_name: string; send_enabled: boolean | null } })[];
  unreadCount: number;
  children: ReactNode;
}

export function MailShell({
  user,
  org,
  mailboxes,
  unreadCount,
  children,
}: MailShellProps) {
  const [composeOpen, setComposeOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [replyContext, setReplyContext] = useState<ReplyContext | null>(null);
  const { contacts: recentContacts, addToCache } = useRecentContacts();

  // Enable Realtime inbox updates & push notifications
  useRealtimeInbox(org.id);

  const handleCompose = useCallback(
    (context?: ReplyContext) => {
      setReplyContext(context ?? null);
      setComposeOpen(true);
    },
    []
  );

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case "?":
          e.preventDefault();
          setShortcutsOpen((prev) => !prev);
          break;
        case "Escape":
          setShortcutsOpen(false);
          setComposeOpen(false);
          setMobileSidebarOpen(false);
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCompose]);

  return (
    <>
      <BadgeSync unreadCount={unreadCount} />
      <MailContext.Provider
        value={{
          openCompose: handleCompose,
          recentContacts,
          addContactsToCache: addToCache,
        }}
      >
        <div className="h-screen w-full flex flex-col md:flex-row overflow-hidden bg-background">
          {/* Mobile Header Bar (< md screens) */}
          <header className="md:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-card flex-shrink-0 z-30 shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 -ml-2 rounded-lg hover:bg-secondary text-foreground transition-colors"
                aria-label="Open Navigation Drawer"
              >
                <Menu className="w-5 h-5 text-foreground" />
              </button>
              <div className="flex items-center gap-2">
                <img src="/icon.png" alt="DMail Logo" className="w-6 h-6 object-contain" />
                <span className="text-lg font-extrabold tracking-tight text-[#8B1E2D]">
                  DMail
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <PwaInstallButton size="icon" variant="ghost" showText={false} />
              <ThemeToggle size="icon" variant="ghost" />
            </div>
          </header>

          {/* Mobile Sidebar Overlay Drawer */}
          {mobileSidebarOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex">
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={() => setMobileSidebarOpen(false)}
              />

              {/* Sidebar drawer content */}
              <div className="relative w-[280px] max-w-[80vw] h-full bg-card shadow-2xl z-10 animate-slide-in-right">
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-secondary/80 text-muted-foreground hover:text-foreground z-20"
                  aria-label="Close Navigation Drawer"
                >
                  <X className="w-4 h-4" />
                </button>
                <Sidebar
                  org={org}
                  mailboxes={mailboxes}
                  unreadCount={unreadCount}
                  onCompose={() => {
                    setMobileSidebarOpen(false);
                    handleCompose();
                  }}
                  user={user}
                  onNavigate={() => setMobileSidebarOpen(false)}
                />
              </div>
            </div>
          )}

          {/* Desktop Sidebar (>= md screens) */}
          <div className="hidden md:block h-full flex-shrink-0">
            <Sidebar
              org={org}
              mailboxes={mailboxes}
              unreadCount={unreadCount}
              onCompose={() => handleCompose()}
              user={user}
            />
          </div>

          {/* Main Content Area */}
          <main className="flex-1 flex overflow-hidden w-full h-full min-w-0">
            {children}
          </main>

          {/* Mobile Floating Action Button (FAB) for Compose */}
          <button
            onClick={() => handleCompose()}
            className="md:hidden fixed bottom-6 right-6 z-40 p-4 rounded-full bg-[#8B1E2D] text-white shadow-xl hover:bg-[#6E1522] active:scale-95 transition-all flex items-center justify-center"
            title="Compose New Mail"
            aria-label="Compose New Mail"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Compose Modal */}
          <ComposeModal
            open={composeOpen}
            onOpenChange={setComposeOpen}
            mailboxes={mailboxes}
            orgId={org.id}
            replyContext={replyContext}
            recentContacts={recentContacts}
            onContactsUsed={addToCache}
          />

          {/* Keyboard Shortcuts */}
          <KeyboardShortcutsOverlay
            open={shortcutsOpen}
            onOpenChange={setShortcutsOpen}
          />
        </div>
      </MailContext.Provider>
    </>
  );
}
