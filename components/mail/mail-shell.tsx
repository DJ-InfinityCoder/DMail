"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { Sidebar } from "@/components/mail/sidebar";
import { ComposeModal } from "@/components/mail/compose-modal";
import { KeyboardShortcutsOverlay } from "@/components/mail/keyboard-shortcuts-overlay";
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
  const [replyContext, setReplyContext] = useState<ReplyContext | null>(null);
  const { contacts: recentContacts, addToCache } = useRecentContacts();

  // Enable Realtime inbox updates
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
      // Don't trigger shortcuts when typing in inputs
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
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCompose]);

  return (
    <MailContext.Provider
      value={{
        openCompose: handleCompose,
        recentContacts,
        addContactsToCache: addToCache,
      }}
    >
      <div className="h-screen flex overflow-hidden bg-background">
        <Sidebar
          org={org}
          mailboxes={mailboxes}
          unreadCount={unreadCount}
          onCompose={() => handleCompose()}
          user={user}
        />

        <main className="flex-1 flex overflow-hidden">{children}</main>

        <ComposeModal
          open={composeOpen}
          onOpenChange={setComposeOpen}
          mailboxes={mailboxes}
          orgId={org.id}
          replyContext={replyContext}
          recentContacts={recentContacts}
          onContactsUsed={addToCache}
        />

        <KeyboardShortcutsOverlay
          open={shortcutsOpen}
          onOpenChange={setShortcutsOpen}
        />
      </div>
    </MailContext.Provider>
  );
}
