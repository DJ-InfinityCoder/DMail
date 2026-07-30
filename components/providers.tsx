"use client";

import { type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { QueryProvider } from "@/lib/hooks/use-query-client";
import { PwaProvider } from "@/components/pwa-provider";
import { NotificationProvider } from "@/components/notification-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <PwaProvider>
        <NotificationProvider>
          <QueryProvider>{children}</QueryProvider>
        </NotificationProvider>
      </PwaProvider>
    </ThemeProvider>
  );
}
