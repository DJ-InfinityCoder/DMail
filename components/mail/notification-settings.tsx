"use client";

import { useState } from "react";
import { useNotifications } from "@/components/notification-provider";
import { Bell, BellOff, CheckCircle2, AlertCircle, Send, Smartphone, Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationSettings() {
  const {
    permission,
    isEnabled,
    isSupported,
    isBadgeSupported,
    toggleNotifications,
    sendTestNotification,
  } = useNotifications();

  const [isToggling, setIsToggling] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isSupported) {
    return (
      <div className="glass rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <BellOff className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="font-semibold">Push Notifications</h2>
            <p className="text-xs text-muted-foreground">Notifications are not supported in this browser engine.</p>
          </div>
        </div>
      </div>
    );
  }

  const isGranted = permission === "granted";
  const isDenied = permission === "denied";

  const handleToggle = async () => {
    setIsToggling(true);
    setSuccessMsg(null);
    try {
      const active = await toggleNotifications();
      if (active) {
        setSuccessMsg("Notifications enabled!");
      } else {
        setSuccessMsg("Notifications muted.");
      }
    } finally {
      setIsToggling(false);
    }
  };

  const handleTestNotification = async () => {
    setIsTesting(true);
    setSuccessMsg(null);
    try {
      await sendTestNotification();
      setSuccessMsg("Test notification popup dispatched!");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="glass rounded-xl p-6 mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            {isEnabled && isGranted ? (
              <Bell className="w-5 h-5 text-primary" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-base">Push Notifications & App Badging</h2>
            <p className="text-xs text-muted-foreground">
              Receive instant alerts & WhatsApp-style unread count badges on your device icon.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex-shrink-0">
          {isEnabled && isGranted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active
            </span>
          ) : isDenied ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive">
              <AlertCircle className="w-3.5 h-3.5" />
              Blocked in Browser
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <VolumeX className="w-3.5 h-3.5" />
              Muted
            </span>
          )}
        </div>
      </div>

      {/* Feature capabilities list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
        <div className="p-3 rounded-lg border border-border/60 bg-card/40 flex items-start gap-2.5">
          <Smartphone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs font-bold block text-foreground">App Icon Unread Badge</span>
            <span className="text-[11px] text-muted-foreground leading-relaxed">
              {isBadgeSupported
                ? "Live unread email count badge displayed on your PWA icon."
                : "App Badging active when installed as PWA."}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border/60 bg-card/40 flex items-start gap-2.5">
          <Bell className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs font-bold block text-foreground">Instant Realtime Push</span>
            <span className="text-[11px] text-muted-foreground leading-relaxed">
              Desktop and mobile push alerts when new custom domain emails arrive.
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/40">
        {/* Toggle Enable/Disable Button */}
        <Button
          onClick={handleToggle}
          disabled={isDenied || isToggling}
          variant={isEnabled && isGranted ? "secondary" : "default"}
          className={`text-xs font-medium gap-2 ${
            isEnabled && isGranted
              ? "bg-secondary text-foreground hover:bg-secondary/80"
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          }`}
        >
          {isToggling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isEnabled && isGranted ? (
            <>
              <VolumeX className="w-4 h-4" />
              <span>Disable Notifications</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span>Enable Notifications</span>
            </>
          )}
        </Button>

        {/* Send Test Notification Button */}
        <Button
          onClick={handleTestNotification}
          disabled={isTesting || isDenied}
          variant="outline"
          className="text-xs font-medium gap-2 border-primary/40 text-primary hover:text-primary hover:bg-primary/10 hover:border-primary/60 transition-colors"
        >
          {isTesting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span>Send Test Notification</span>
        </Button>

        {successMsg && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 animate-fade-in">
            {successMsg}
          </span>
        )}

        {isGranted && isEnabled && (
          <p className="text-[11px] text-muted-foreground w-full pt-1">
            💡 <b>Windows & Android System Tip:</b> Windows notifications pop up in <b>Windows Action Center</b> (bottom-right system tray). Ensure <i>Settings &gt; System &gt; Notifications &gt; Google Chrome / Microsoft Edge</i> is set to <b>ON</b> in Windows.
          </p>
        )}

        {isDenied && (
          <p className="text-xs text-muted-foreground w-full">
            Notifications are blocked in your browser settings. Click the lock/gear icon in your address bar to set permission to Allow.
          </p>
        )}
      </div>
    </div>
  );
}
