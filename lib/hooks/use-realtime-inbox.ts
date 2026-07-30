"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to Supabase Realtime for new emails in the user's org.
 * Triggers a router refresh when new mail arrives.
 */
export function useRealtimeInbox(orgId: string) {
  const router = useRouter();
  const supabase = createClient();

  const handleNewEmail = useCallback(() => {
    // Refresh the page to pick up new emails
    router.refresh();
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
          handleNewEmail();
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
          handleNewEmail();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, orgId, handleNewEmail]);
}
