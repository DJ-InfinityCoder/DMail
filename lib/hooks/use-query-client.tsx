"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,      // 5 minutes — data fresh across navigations
            gcTime: 1000 * 60 * 10,         // 10 minutes — keep unused cache alive
            retry: 1,                        // Only retry once on failure
            refetchOnWindowFocus: false,     // Don't refetch just because user switches tabs
            refetchOnReconnect: true,        // Refetch when network comes back
            refetchOnMount: false,           // Don't refetch if data is still fresh
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
