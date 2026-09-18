"use client";

import { useState } from "react";
import { usePWA } from "@/components/pwa-provider";
import {
  Download,
  CheckCircle2,
  Smartphone,
  Laptop,
  Share2,
  X,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function PwaInstallButton({
  variant = "ghost",
  size = "icon",
  className = "",
  showText = false,
}: {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}) {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    if (isInstallable) {
      try {
        await installApp();
      } catch {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  const copyUrl = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={`text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ${
          size === "icon" ? "w-9 h-9 p-0 flex items-center justify-center" : "gap-2"
        } ${className}`}
        title={
          isInstalled
            ? "DMail is installed"
            : isInstallable
            ? "Install DMail Web App"
            : "Download / Install DMail App"
        }
        aria-label="Install DMail App"
      >
        {isInstalled ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : (
          <Download className="w-4 h-4 transition-colors" />
        )}
        {showText && (
          <span>{isInstalled ? "App Installed" : isInstallable ? "Install App" : "Download App"}</span>
        )}
      </Button>

      {/* Install Instructions Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in-0"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Install DMail App</h3>
                  <p className="text-[11px] text-muted-foreground">Fast, offline-ready webmail</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-3.5 text-xs text-muted-foreground leading-relaxed">
              {isInstalled ? (
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>DMail is already installed on your device. You can launch it from your home screen or applications menu.</span>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <Laptop className="w-4 h-4 text-primary" />
                      <span>Chrome / Edge / Brave (Desktop)</span>
                    </div>
                    <p className="text-[11px]">
                      Click the <strong>Install</strong> icon in your browser URL bar (top right), or click the browser menu (⋮) and select <strong>&quot;Install DMail&quot;</strong>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <Smartphone className="w-4 h-4 text-primary" />
                      <span>iPhone / iPad (Safari)</span>
                    </div>
                    <p className="text-[11px]">
                      Tap the <Share2 className="w-3.5 h-3.5 inline text-primary mx-0.5" /> <strong>Share</strong> button at the bottom of Safari, scroll down, and select <strong>&quot;Add to Home Screen&quot;</strong>.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-secondary/50 border border-border/60 space-y-2">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <Smartphone className="w-4 h-4 text-primary" />
                      <span>Android (Chrome / Firefox)</span>
                    </div>
                    <p className="text-[11px]">
                      Tap the browser menu (⋮) in the top right and select <strong>&quot;Install app&quot;</strong> or <strong>&quot;Add to Home screen&quot;</strong>.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer Copy Link */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-border/60">
              <button
                onClick={copyUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary/60 hover:bg-secondary text-xs font-medium text-foreground transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Link Copied!" : "Copy App Link"}</span>
              </button>

              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
