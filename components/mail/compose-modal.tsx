"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type KeyboardEvent,
} from "react";
import { X, Paperclip, Send, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
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

  // Filter suggestions based on input
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

  // Close dropdown when clicking outside
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
        <span className="text-xs text-muted-foreground pt-1 w-8 flex-shrink-0">
          {label}
        </span>
        <div className="flex-1 flex flex-wrap gap-1 items-center min-h-[28px]">
          {addresses.map((addr) => (
            <span
              key={addr}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-xs"
            >
              {addr}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeAddress(addr);
                }}
                className="text-muted-foreground hover:text-foreground"
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
              // Delay to allow click on suggestion
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
          className="absolute left-10 right-4 top-full z-50 mt-0.5 max-h-[180px] overflow-y-auto rounded-lg border border-border bg-card shadow-sm animate-fade-in"
        >
          {filteredSuggestions.slice(0, 8).map((suggestion, i) => {
            const isHighlighted = i === highlightedIndex;
            // Highlight matching part
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
                    ? "bg-[#8B1E2D]/8 text-foreground"
                    : "text-foreground/80 hover:bg-secondary/50"
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-[#8B1E2D]/10 text-[#8B1E2D] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {suggestion.charAt(0).toUpperCase()}
                </div>
                <span className="truncate">
                  {idx >= 0 ? (
                    <>
                      {suggestion.slice(0, idx)}
                      <span className="font-semibold text-[#8B1E2D]">
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
   Compose Modal
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
  const [to, setTo] = useState<string[]>([]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [selectedMailboxId, setSelectedMailboxId] = useState(
    mailboxes.find((m) => m.domains?.send_enabled)?.id ?? mailboxes[0]?.id ?? ""
  );

  // Sync form state when modal opens with replyContext
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
      setBody("");
      setShowCcBcc(false);
      setAttachments([]);
      setError(null);
    }
  }, [open, replyContext]);

  // Sync selectedMailboxId when mailboxes load/change
  useEffect(() => {
    if (!selectedMailboxId || !mailboxes.some((m) => m.id === selectedMailboxId)) {
      const defaultId = mailboxes.find((m) => m.domains?.send_enabled)?.id ?? mailboxes[0]?.id ?? "";
      setSelectedMailboxId(defaultId);
    }
  }, [mailboxes, selectedMailboxId]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendableMailboxes = mailboxes.filter((m) => m.domains?.send_enabled);

  const handleSend = async () => {
    if (to.length === 0) {
      setError("Please add at least one recipient.");
      return;
    }
    if (!selectedMailboxId) {
      setError("No mailbox selected.");
      return;
    }

    setSending(true);
    setError(null);

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
          bodyHtml: `<div>${body.replace(/\n/g, "<br/>")}</div>`,
          bodyText: body,
          inReplyTo: replyContext?.inReplyTo,
          references: replyContext?.references,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to send email");
      }

      // Update contacts cache with newly used addresses
      onContactsUsed?.([...to, ...cc, ...bcc]);

      // Reset and close
      resetForm();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setTo([]);
    setCc([]);
    setBcc([]);
    setSubject("");
    setBody("");
    setAttachments([]);
    setError(null);
    setShowCcBcc(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 mb-4 sm:mb-0 glass rounded-xl shadow-sm animate-slide-in-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-border/30">
          <h3 className="text-sm font-semibold">
            {replyContext ? "Reply" : "New Message"}
          </h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* From selector */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/20">
          <span className="text-xs text-muted-foreground w-8 flex-shrink-0">
            From
          </span>
          <div className="relative flex-1">
            <select
              value={selectedMailboxId}
              onChange={(e) => setSelectedMailboxId(e.target.value)}
              className="w-full bg-transparent text-sm outline-none appearance-none cursor-pointer pr-6"
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

        {/* CC / BCC toggle */}
        {!showCcBcc && (
          <div className="px-4 py-1 border-b border-border/20">
            <button
              onClick={() => setShowCcBcc(true)}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              CC / BCC
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
          <span className="text-xs text-muted-foreground w-8 flex-shrink-0">
            Subj
          </span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
            placeholder="Subject"
          />
        </div>

        {/* Body */}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full min-h-[200px] max-h-[400px] px-4 py-3 bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground/40"
          placeholder="Write your message..."
        />

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {attachments.map((file, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary text-xs"
              >
                <Paperclip className="w-3 h-3" />
                {file.name}
                <button
                  onClick={() =>
                    setAttachments((prev) => prev.filter((_, idx) => idx !== i))
                  }
                  className="text-muted-foreground hover:text-foreground ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="px-4 pb-2">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  setAttachments((prev) => [
                    ...prev,
                    ...Array.from(e.target.files!),
                  ]);
                }
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
              title="Attach files"
            >
              <Paperclip className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSend}
            disabled={sending || to.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#8B1E2D] text-white text-sm font-medium hover:bg-[#6E1522] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
