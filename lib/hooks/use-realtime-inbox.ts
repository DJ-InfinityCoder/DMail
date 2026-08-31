"use client";

import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Email } from "@/lib/types";

function extractSenderName(rawAddress: string | undefined): string {
  if (!rawAddress) return "Someone";
  const match = rawAddress.match(/^(?:"?([^"]*)"?\s)?<([^>]+)>$/);
  if (match && match[1]?.trim()) return match[1].trim();
  if (rawAddress.includes("@")) return rawAddress.split("@")[0];
  return rawAddress;
}

/**
 * Subscribes to Supabase Realtime for new emails in the user's org.
 * Triggers native push notifications when new mail arrives.
 * NOTE: EmailList handles its own INSERT/UPDATE/DELETE subscriptions for UI updates.
 * This hook only handles push notifications for new emails.
 */
export function useRealtimeInbox(orgId: string) {
  const handleNewEmail = useCallback((emailPayload?: Partial<Email>) => {
    // Trigger system push notification if permission granted
    if (
      emailPayload &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      const sender = extractSenderName(emailPayload.from_address);
      const title = `New Email from ${sender}`;
      const body = emailPayload.subject || emailPayload.body_text?.slice(0, 80) || "You received a new email.";

      try {
        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((reg) => {
            reg.showNotification(title, {
              body,
              icon: "/icons/icon-192.png",
              badge: "/icons/icon-192.png",
              tag: `email-${emailPayload.id ?? Date.now()}`,
              data: { url: `/mail/inbox/${emailPayload.id ?? ""}` },
            });
          });
        } else {
          new Notification(title, {
            body,
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            tag: `email-${emailPayload.id ?? Date.now()}`,
          });
        }
      } catch (err) {
        console.warn("Realtime notification trigger error:", err);
      }
    }
  }, []);

  useEffect(() => {
    const client = createClient();
    const channelId = `inbox-notify-${orgId}-${Math.random().toString(36).substring(2, 7)}`;
    const channel = client
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "emails",
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          console.log("[Realtime] New email received:", payload.new);
          handleNewEmail(payload.new as Email);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [orgId, handleNewEmail]);
}
