"use client";

import { usePWA } from "@/components/pwa-provider";
import { Download, CheckCircle2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaInstallButton({
  variant = "outline",
  size = "sm",
  className = "",
  showText = true,
}: {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}) {
  const { isInstallable, isInstalled, installApp } = usePWA();

  if (isInstalled) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium ${className}`}>
        <CheckCircle2 className="w-4 h-4" />
        {showText && <span>App Installed</span>}
      </div>
    );
  }

  // Always show button or prompt on mobile / installable browsers
  return (
    <Button
      variant={variant}
      size={size}
      onClick={installApp}
      disabled={!isInstallable}
      className={`gap-2 ${className}`}
      title={isInstallable ? "Install DMail as App on your desktop/phone" : "PWA App Ready"}
    >
      <Download className="w-4 h-4 text-[#8B1E2D]" />
      {showText && <span>{isInstallable ? "Install App" : "DMail App"}</span>}
    </Button>
  );
}
