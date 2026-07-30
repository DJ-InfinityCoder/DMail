"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

const CACHE_KEY = "dmail:recent-contacts";
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

interface CachedContacts {
  addresses: string[];
  timestamp: number;
}

/**
 * Hook that fetches unique email addresses the user has sent to,
 * ordered by most recently used. Results are cached in localStorage
 * for 30 minutes to avoid repeated DB queries.
 */
export function useRecentContacts() {
  const [contacts, setContacts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContacts = useCallback(async () => {
    const supabase = createClient();

    // Check localStorage cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CachedContacts = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_TTL) {
          setContacts(parsed.addresses);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Cache miss or corrupt — continue to fetch
    }

    // Fetch unique to_address from sent emails, most recent first
    const { data, error } = await supabase
      .from("emails")
      .select("to_address, cc_address, bcc_address, sent_at")
      .eq("folder", "sent")
      .order("sent_at", { ascending: false })
      .limit(200);

    if (error || !data) {
      setLoading(false);
      return;
    }

    // Extract and deduplicate all addresses
    const addressMap = new Map<string, number>(); // address -> latest timestamp

    for (const email of data) {
      const allFields = [
        email.to_address,
        email.cc_address,
        email.bcc_address,
      ].filter(Boolean);

      for (const field of allFields) {
        const addrs = (field as string).split(",").map((a) => a.trim().toLowerCase());
        for (const addr of addrs) {
          if (addr && addr.includes("@") && !addressMap.has(addr)) {
            addressMap.set(addr, Date.now());
          }
        }
      }
    }

    // Also extract from_address of received emails (people who emailed us)
    const { data: receivedData } = await supabase
      .from("emails")
      .select("from_address")
      .eq("folder", "inbox")
      .order("created_at", { ascending: false })
      .limit(200);

    if (receivedData) {
      for (const email of receivedData) {
        const addr = email.from_address.trim().toLowerCase();
        if (addr && addr.includes("@") && !addressMap.has(addr)) {
          addressMap.set(addr, Date.now());
        }
      }
    }

    const uniqueAddresses = Array.from(addressMap.keys());

    // Cache in localStorage
    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          addresses: uniqueAddresses,
          timestamp: Date.now(),
        } satisfies CachedContacts)
      );
    } catch {
      // localStorage full — ignore
    }

    setContacts(uniqueAddresses);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  /** Call this after sending an email to add new addresses to cache immediately */
  const addToCache = useCallback((newAddresses: string[]) => {
    setContacts((prev) => {
      const set = new Set(prev);
      for (const addr of newAddresses) {
        const normalized = addr.trim().toLowerCase();
        if (normalized && normalized.includes("@")) {
          set.delete(normalized); // remove to re-add at front
        }
      }
      const updated = [
        ...newAddresses.map((a) => a.trim().toLowerCase()).filter((a) => a.includes("@")),
        ...Array.from(set),
      ];

      // Update localStorage cache
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            addresses: updated,
            timestamp: Date.now(),
          } satisfies CachedContacts)
        );
      } catch {}

      return updated;
    });
  }, []);

  /** Invalidate the cache to force a re-fetch */
  const invalidateCache = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {}
    fetchContacts();
  }, [fetchContacts]);

  return { contacts, loading, addToCache, invalidateCache };
}
