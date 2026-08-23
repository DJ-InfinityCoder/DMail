"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type KeyboardEvent,
} from "react";
import { X, Paperclip, Send, ChevronDown, Check, GripHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useNotifications } from "@/components/notification-provider";
import { UndoSendToast } from "@/components/mail/undo-send-toast";
import { RichTextEditor } from "@/components/mail/rich-text-editor";
import type { Mailbox } from "@/lib/types";

interface ComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mailboxes: (Mailbox & { domains: { domain_name: string; send_enabled: boolean | null } })[];
  orgId: string;
  replyContext?: {
    inReplyTo?: string;
    references?: string[];
    subject?: string;
    to?: string;
  } | null;
  recentContacts?: string[];
  onContactsUsed?: (addresses: string[]) => void;
}

/* ──────────────────────────────────────────────
   Address Pill Input with Autocomplete
   ────────────────────────────────────────────── */
function AddressPillInput({
  label,
  addresses,
  onAddressesChange,
  suggestions = [],
}: {
  label: string;
  addresses: string[];
  onAddressesChange: (addrs: string[]) => void;
  suggestions?: string[];
}) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredSuggestions = inputValue.trim().length > 0
    ? suggestions.filter(
        (s) =>
          s.toLowerCase().includes(inputValue.toLowerCase()) &&
          !addresses.includes(s)
      )
    : [];

  const addAddress = useCallback(
    (addr: string) => {
      const trimmed = addr.trim().toLowerCase();
      if (trimmed && trimmed.includes("@") && !addresses.includes(trimmed)) {
        onAddressesChange([...addresses, trimmed]);
      }
      setInputValue("");
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    },
    [addresses, onAddressesChange]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        return;
      }
      if (
        (e.key === "Enter" || e.key === "Tab") &&
        highlightedIndex >= 0 &&
        highlightedIndex < filteredSuggestions.length
      ) {
        e.preventDefault();
        addAddress(filteredSuggestions[highlightedIndex]);
        return;
      }
    }

    if (e.key === "Enter" || e.key === "Tab" || e.key === ",") {
      e.preventDefault();
      addAddress(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && addresses.length > 0) {
      onAddressesChange(addresses.slice(0, -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const removeAddress = (addr: string) => {
    onAddressesChange(addresses.filter((a) => a !== addr));
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setHighlightedIndex(-1);
    setShowSuggestions(value.trim().length > 0);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div
        className="flex items-start gap-2 px-4 py-2 border-b border-border/20 cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <span className="text-xs font-semibold text-muted-foreground pt-1 w-8 flex-shrink-0">
          {label}
        </span>
        <div className="flex-1 flex flex-wrap gap-1 items-center min-h-[28px]">
          {addresses.map((addr) => (
            <span
              key={addr}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary border border-border/60 text-xs font-medium text-foreground"
            >
              <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center">
                {addr.charAt(0).toUpperCase()}
              </span>
              <span>{addr}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeAddress(addr);
                }}
                className="text-muted-foreground hover:text-foreground p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (inputValue.trim().length > 0) setShowSuggestions(true);
            }}
            onBlur={() => {
              setTimeout(() => {
                if (inputValue.trim()) addAddress(inputValue);
                setShowSuggestions(false);
              }, 200);
            }}
            className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
            placeholder={addresses.length === 0 ? "Add recipients..." : ""}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Autocomplete dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-10 right-4 top-full z-50 mt-0.5 max-h-[180px] overflow-y-auto rounded-lg border border-border bg-card shadow-xl animate-fade-in"
        >
          {filteredSuggestions.slice(0, 8).map((suggestion, i) => {
            const isHighlighted = i === highlightedIndex;
            const lowerInput = inputValue.toLowerCase();
            const idx = suggestion.toLowerCase().indexOf(lowerInput);

            return (
              <button
                key={suggestion}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addAddress(suggestion);
                }}
                onMouseEnter={() => setHighlightedIndex(i)}
                className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center gap-2 ${
                  isHighlighted
                    ? "bg-primary/10 text-foreground font-medium"
                    : "text-foreground/80 hover:bg-secondary/50"
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {suggestion.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">
                  {idx >= 0 ? (
                    <>
                      {suggestion.slice(0, idx)}
                      <span className="font-semibold text-primary">
                        {suggestion.slice(idx, idx + inputValue.length)}
                      </span>
                      {suggestion.slice(idx + inputValue.length)}
                    </>
                  ) : (
                    suggestion
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Compose Modal Component
   ────────────────────────────────────────────── */
export function ComposeModal({
  open,
  onOpenChange,
  mailboxes,
  orgId,
  replyContext,
  recentContacts = [],
  onContactsUsed,
}: ComposeModalProps) {
  const { sendNotification } = useNotifications();
  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [selectedMailboxId, setSelectedMailboxId] = useState(
    mailboxes.find((m) => m.domains?.send_enabled)?.id ?? mailboxes[0]?.id ?? ""
  );
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [undoSendVisible, setUndoSendVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (replyContext) {
        setTo(replyContext.to ? replyContext.to.split(",").map((s) => s.trim()).filter(Boolean) : []);
        setSubject(replyContext.subject ?? "");
      } else {
        setTo([]);
        setSubject("");
      }
      setCc([]);
      setBcc([]);
      setBodyHtml("");
      setShowCcBcc(false);
      setAttachments([]);
      setError(null);
    }
  }, [open, replyContext]);

  useEffect(() => {
    if (!selectedMailboxId || !mailboxes.some((m) => m.id === selectedMailboxId)) {
      const defaultId = mailboxes.find((m) => m.domains?.send_enabled)?.id ?? mailboxes[0]?.id ?? "";
      setSelectedMailboxId(defaultId);
    }
  }, [mailboxes, selectedMailboxId]);

  const sendableMailboxes = mailboxes.filter((m) => m.domains?.send_enabled);

  // Trigger 5-second Undo Send Countdown
  const initiateSend = () => {
    if (to.length === 0) {
      setError("Please add at least one recipient.");
      return;
    }
    if (!selectedMailboxId) {
      setError("No mailbox selected.");
      return;
    }

    setError(null);
    setUndoSendVisible(true);
    onOpenChange(false);
  };

  // Executed after 5-second countdown finishes without Undo click
  const executeActualDispatch = async () => {
    setUndoSendVisible(false);
    setSending(true);

    try {
      const res = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mailboxId: selectedMailboxId,
          to,
          cc: cc.length > 0 ? cc : undefined,
          bcc: bcc.length > 0 ? bcc : undefined,
          subject,
          bodyHtml: bodyHtml || "<div></div>",
          bodyText: bodyHtml.replace(/<[^>]*>?/gm, ""),
          inReplyTo: replyContext?.inReplyTo,
          references: replyContext?.references,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to send email");
      }

      onContactsUsed?.([...to, ...cc, ...bcc]);

      sendNotification("Email Sent 🚀", {
        body: `To: ${to.join(", ")}${subject ? ` | ${subject}` : ""}`,
        tag: "email-sent-" + Date.now(),
      });

      resetForm();
    } catch (err: any) {
      setError(err.message);
      onOpenChange(true);
    } finally {
      setSending(false);
    }
  };

  const handleUndoSend = () => {
    setUndoSendVisible(false);
    onOpenChange(true);
  };

  const resetForm = () => {
    setTo([]);
    setCc([]);
    setBcc([]);
    setSubject("");
    setBodyHtml("");
    setAttachments([]);
    setError(null);
    setShowCcBcc(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // Drag & drop file handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  if (!open && !undoSendVisible) return null;

  return (
    <>
      <UndoSendToast
        visible={undoSendVisible}
        recipient={to.join(", ")}
        onUndo={handleUndoSend}
        onConfirmSend={executeActualDispatch}
        durationMs={5000}
      />

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={handleClose}
          />

        {/* Modal Container — mobile sheet style */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative w-full max-w-2xl sm:mx-4 glass rounded-t-2xl sm:rounded-xl shadow-2xl animate-slide-in-up overflow-hidden h-[90vh] sm:h-auto flex flex-col z-10 transition-all
            ${isDragOver ? "ring-2 ring-primary bg-primary/5" : ""}
          `}
        >
          {/* Mobile Sheet Grabber Bar */}
          <div className="sm:hidden w-full flex items-center justify-center py-2 bg-secondary/30">
            <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 h-12 border-b border-border/30 bg-card">
            <h3 className="text-sm font-bold text-foreground">
              {replyContext ? "Reply" : "New Message"}
            </h3>
            <button
              onClick={handleClose}
              className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* From Selector */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
            <span className="text-xs font-semibold text-muted-foreground w-8 flex-shrink-0">
              From
            </span>
            <div className="relative flex-1">
              <select
                value={selectedMailboxId}
                onChange={(e) => setSelectedMailboxId(e.target.value)}
                className="w-full bg-transparent text-sm outline-none appearance-none cursor-pointer pr-6 font-mono text-foreground"
              >
                {sendableMailboxes.length > 0
                  ? sendableMailboxes.map((mb) => (
                      <option key={mb.id} value={mb.id}>
                        {mb.display_name
                          ? `${mb.display_name} <${mb.address}>`
                          : mb.address}
                      </option>
                    ))
                  : mailboxes.map((mb) => (
                      <option key={mb.id} value={mb.id}>
                        {mb.address} (sending not enabled)
                      </option>
                    ))}
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          {/* To */}
          <AddressPillInput
            label="To"
            addresses={to}
            onAddressesChange={setTo}
            suggestions={recentContacts}
          />

          {!showCcBcc && (
            <div className="px-4 py-1 border-b border-border/20">
              <button
                onClick={() => setShowCcBcc(true)}
                className="text-[10px] font-semibold text-muted-foreground hover:text-primary transition-colors"
              >
                + CC / BCC
              </button>
            </div>
          )}
          {showCcBcc && (
            <>
              <AddressPillInput
                label="CC"
                addresses={cc}
                onAddressesChange={setCc}
                suggestions={recentContacts}
              />
              <AddressPillInput
                label="BCC"
                addresses={bcc}
                onAddressesChange={setBcc}
                suggestions={recentContacts}
              />
            </>
          )}

          {/* Subject */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
            <span className="text-xs font-semibold text-muted-foreground w-8 flex-shrink-0">
              Subj
            </span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40 font-medium"
              placeholder="Subject..."
            />
          </div>

          {/* Rich Text Editor Body */}
          <div className="p-3 flex-1 overflow-y-auto min-h-[160px]">
            <RichTextEditor
              value={bodyHtml}
              onChange={setBodyHtml}
              placeholder="Write your email content..."
              minHeight="180px"
            />
          </div>

          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2">
              {attachments.map((file, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary border border-border/60 text-xs font-medium"
                >
                  <Paperclip className="w-3.5 h-3.5 text-primary" />
                  <span className="truncate max-w-[140px]">{file.name}</span>
                  <button
                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-foreground ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {error && (
            <div className="px-4 pb-2">
              <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-1.5">
                {error}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-card">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
                  }
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Attach files"
              >
                <Paperclip className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={initiateSend}
              disabled={sending || to.length === 0 || undoSendVisible}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {sending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      )}
    </>
  );
}
