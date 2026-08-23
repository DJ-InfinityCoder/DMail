"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { Bell, X } from "lucide-react";

interface InAppToast {
  id: string;
  title: string;
  body?: string;
}

interface NotificationContextType {
  permission: NotificationPermission;
  isEnabled: boolean;
  isSupported: boolean;
  isBadgeSupported: boolean;
  requestPermission: () => Promise<boolean>;
  toggleNotifications: (enable?: boolean) => Promise<boolean>;
  sendNotification: (title: string, options?: NotificationOptions) => Promise<void>;
  sendTestNotification: () => Promise<void>;
  updateBadge: (count: number) => void;
  activeToast: InAppToast | null;
  dismissToast: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  permission: "default",
  isEnabled: true,
  isSupported: false,
  isBadgeSupported: false,
  requestPermission: async () => false,
  toggleNotifications: async () => false,
  sendNotification: async () => {},
  sendTestNotification: async () => {},
  updateBadge: () => {},
  activeToast: null,
  dismissToast: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isEnabled, setIsEnabled] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [isBadgeSupported, setIsBadgeSupported] = useState(false);
  const [activeToast, setActiveToast] = useState<InAppToast | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ("Notification" in window) {
        setIsSupported(true);
        setPermission(Notification.permission);
      }
      if ("setAppBadge" in navigator) {
        setIsBadgeSupported(true);
      }
      const savedEnabled = localStorage.getItem("dmail_notifications_enabled");
      if (savedEnabled !== null) {
        setIsEnabled(savedEnabled === "true");
      }
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;

    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      return res === "granted";
    } catch (err) {
      console.warn("Error requesting notification permission:", err);
      return false;
    }
  }, []);

  const toggleNotifications = useCallback(
    async (enable?: boolean): Promise<boolean> => {
      const targetState = enable !== undefined ? enable : !isEnabled;

      if (targetState) {
        let currentPerm = Notification.permission;
        if (currentPerm !== "granted") {
          const granted = await requestPermission();
          if (!granted) {
            setIsEnabled(false);
            localStorage.setItem("dmail_notifications_enabled", "false");
            return false;
          }
        }
        setIsEnabled(true);
        localStorage.setItem("dmail_notifications_enabled", "true");
        return true;
      } else {
        setIsEnabled(false);
        localStorage.setItem("dmail_notifications_enabled", "false");
        if ("clearAppBadge" in navigator) {
          (navigator as any).clearAppBadge().catch(() => {});
        }
        return false;
      }
    },
    [isEnabled, requestPermission]
  );

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const sendNotification = useCallback(
    async (title: string, options?: NotificationOptions) => {
      if (!isEnabled) return;

      // 1. Show in-app visual popup banner immediately on screen
      const toastId = "toast-" + Date.now();
      setActiveToast({
        id: toastId,
        title,
        body: options?.body,
      });

      // Auto dismiss toast after 6 seconds
      setTimeout(() => {
        setActiveToast((prev) => (prev?.id === toastId ? null : prev));
      }, 6000);

      // 2. Dispatch OS / System Notification for Windows Action Center / Android System Tray
      if (typeof window === "undefined" || !("Notification" in window)) return;

      let currentPerm = Notification.permission;
      if (currentPerm === "default") {
        const res = await Notification.requestPermission();
        setPermission(res);
        currentPerm = res;
      }

      if (currentPerm !== "granted") return;

      const origin = window.location.origin;
      const iconUrl = `${origin}/icons/icon-192.png`;

      const notificationOptions: any = {
        icon: iconUrl,
        badge: iconUrl,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        tag: options?.tag || `dmail-notification-${Date.now()}`,
        renotify: true,
        ...options,
      };

      // Play soft notification sound chime if Web Audio API is supported
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch (e) {
        // Audio context may be restricted before user interaction
      }

      let systemTriggered = false;

      // Primary: Trigger via Service Worker (Required for Android & PWA Action Center)
      if ("serviceWorker" in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            await reg.showNotification(title, notificationOptions);
            systemTriggered = true;
          }
        } catch (err) {
          console.warn("SW showNotification error:", err);
        }
      }

      // Secondary Fallback: Trigger via native Notification constructor (Windows / Desktop Chrome / Edge)
      if (!systemTriggered) {
        try {
          const n = new Notification(title, notificationOptions);
          n.onclick = () => {
            window.focus();
            if (options?.data?.url) {
              window.location.href = options.data.url;
            }
          };
        } catch (err) {
          console.warn("Native Notification constructor error:", err);
        }
      }
    },
    [isEnabled]
  );

  const sendTestNotification = useCallback(async () => {
    if (!isEnabled) {
      await toggleNotifications(true);
    }
    let currentPerm = Notification.permission;
    if (currentPerm !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
    }

    await sendNotification("DMail Windows & Android System Alert 📬", {
      body: "Push notifications, Windows Action Center & PWA icon badging are working on your device!",
      tag: "test-notification-" + Date.now(),
      data: { url: "/mail/inbox" },
    });
  }, [isEnabled, toggleNotifications, requestPermission, sendNotification]);

  const updateBadge = useCallback(
    (count: number) => {
      if (typeof window === "undefined" || !isEnabled) return;

      if ("setAppBadge" in navigator) {
        if (count > 0) {
          (navigator as any).setAppBadge(count).catch((err: any) => {
            console.warn("Failed to set app badge:", err);
          });
        } else {
          (navigator as any).clearAppBadge().catch((err: any) => {
            console.warn("Failed to clear app badge:", err);
          });
        }
      }
    },
    [isEnabled]
  );

  return (
    <NotificationContext.Provider
      value={{
        permission,
        isEnabled,
        isSupported,
        isBadgeSupported,
        requestPermission,
        toggleNotifications,
        sendNotification,
        sendTestNotification,
        updateBadge,
        activeToast,
        dismissToast,
      }}
    >
      {children}

      {/* Floating In-App Visual Notification Popup Banner */}
      {activeToast && (
        <div className="fixed top-4 right-4 z-[9999] max-w-sm w-full bg-card/95 backdrop-blur-md border border-primary/40 rounded-xl shadow-sm p-4 animate-slide-in-up flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-foreground truncate">{activeToast.title}</h4>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                DMail
              </span>
            </div>
            {activeToast.body && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                {activeToast.body}
              </p>
            )}
          </div>
          <button
            onClick={dismissToast}
            className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            aria-label="Dismiss Notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
}
