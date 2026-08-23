"use client";

import { useState, useEffect } from "react";
import { Undo2, Send } from "lucide-react";

interface UndoSendToastProps {
  visible: boolean;
  recipient: string;
  onUndo: () => void;
  onConfirmSend: () => void;
  durationMs?: number;
}

export function UndoSendToast({
  visible,
  recipient,
  onUndo,
  onConfirmSend,
  durationMs = 5000,
}: UndoSendToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!visible) {
      setProgress(100);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remaining);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        onConfirmSend();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [visible, durationMs, onConfirmSend]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-slide-in-up">
      <div className="glass rounded-xl shadow-sm px-5 py-3 flex items-center gap-4 bg-card border border-border">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Send className="w-4 h-4 text-primary" />
          <span>Sending email to <strong className="text-primary">{recipient}</strong>...</span>
        </div>

        <button
          onClick={onUndo}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Undo2 className="w-3.5 h-3.5" />
          <span>Undo</span>
        </button>

        {/* Countdown Progress Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary rounded-b-xl overflow-hidden">
          <div
            className="h-full bg-primary transition-all ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
