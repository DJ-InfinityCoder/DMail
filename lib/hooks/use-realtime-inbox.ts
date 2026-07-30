"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
 * Triggers router refresh and native push notifications when new mail arrives.
 */
export function useRealtimeInbox(orgId: string) {
  const router = useRouter();
  const supabase = createClient();

  const handleNewEmail = useCallback((emailPayload?: Partial<Email>) => {
    router.refresh();

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
  }, [router]);

  useEffect(() => {
    const channel = supabase
      .channel("inbox-realtime")
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
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "emails",
          filter: `org_id=eq.${orgId}`,
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, orgId, handleNewEmail, router]);
}
