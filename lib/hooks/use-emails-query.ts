"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Email } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

export function useFolderEmails(
  folder: string,
  orgId: string,
  initialData?: Email[]
) {
  return useQuery({
    queryKey: ["emails", orgId, folder],
    queryFn: async () => {
      const res = await fetch(`/api/emails?folder=${encodeURIComponent(folder)}`);
      if (!res.ok) {
        throw new Error("Failed to fetch folder emails");
      }
      const data = await res.json();
      return (data.emails ?? []) as Email[];
    },
    initialData,
    staleTime: 1000 * 60 * 5,  // 5 minutes
    gcTime: 1000 * 60 * 15,     // 15 minutes cache retention
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useEmailDetail(
  emailId: string,
  initialData?: { email: Email; threadEmails: Email[] }
) {
  return useQuery({
    queryKey: ["email-detail", emailId],
    queryFn: async () => {
      const res = await fetch(`/api/emails/${encodeURIComponent(emailId)}`);
      if (!res.ok) {
        throw new Error("Failed to fetch email detail");
      }
      return res.json() as Promise<{ email: Email; threadEmails: Email[] }>;
    },
    initialData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
