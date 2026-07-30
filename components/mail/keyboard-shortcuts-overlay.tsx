"use client";

import { X } from "lucide-react";

interface KeyboardShortcutsOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = [
  { key: "C", desc: "Compose new email" },
  { key: "E", desc: "Archive selected email" },
  { key: "#", desc: "Delete / move to trash" },
  { key: "S", desc: "Star / unstar" },
  { key: "R", desc: "Reply" },
  { key: "A", desc: "Reply all" },
  { key: "F", desc: "Forward" },
  { key: "U", desc: "Mark as unread" },
  { key: "Enter", desc: "Open selected email" },
  { key: "Esc", desc: "Close modal / go back" },
  { key: "J", desc: "Next email" },
  { key: "K", desc: "Previous email" },
  { key: "G then I", desc: "Go to Inbox" },
  { key: "G then S", desc: "Go to Sent" },
  { key: "?", desc: "Show keyboard shortcuts" },
];

export function KeyboardShortcutsOverlay({
  open,
  onOpenChange,
}: KeyboardShortcutsOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      <div className="relative glass rounded-xl shadow-2xl shadow-black/50 w-full max-w-md mx-4 animate-slide-in-up overflow-hidden">
        <div className="flex items-center justify-between px-5 h-12 border-b border-border/30">
          <h3 className="text-sm font-semibold">Keyboard Shortcuts</h3>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto">
          {shortcuts.map(({ key, desc }) => (
            <div
              key={key}
              className="flex items-center justify-between py-1.5"
            >
              <span className="text-sm text-muted-foreground">{desc}</span>
              <span className="kbd">{key}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
