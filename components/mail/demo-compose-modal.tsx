"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
} from "react";
import { X, Paperclip, Send, ChevronDown, Plus, CheckCircle2 } from "lucide-react";
import { RichTextEditor } from "@/components/mail/rich-text-editor";

interface DemoComposeModalProps {
  open: boolean;
  onClose: () => void;
  onSendSimulation: (emailData: {
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    bodyHtml: string;
    attachments: string[];
  }) => void;
}

const SUGGESTED_CONTACTS = [
  "partner@fintech.io",
  "alex@startup.io",
  "team@cloudflare.com",
  "advisors@seedfund.vc",
  "client@enterprise.com",
];

/* ──────────────────────────────────────────────
   Address Pill Input with Autocomplete
   ────────────────────────────────────────────── */
function DemoAddressPillInput({
  label,
  addresses,
  onAddressesChange,
}: {
  label: string;
  addresses: string[];
  onAddressesChange: (addrs: string[]) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = inputValue.trim().length > 0
    ? SUGGESTED_CONTACTS.filter(
        (s) =>
          s.toLowerCase().includes(inputValue.toLowerCase()) &&
          !addresses.includes(s)
      )
    : SUGGESTED_CONTACTS.filter((s) => !addresses.includes(s)).slice(0, 3);

  const addAddress = useCallback(
    (addr: string) => {
      const trimmed = addr.trim().toLowerCase();
      if (trimmed && (trimmed.includes("@") || trimmed.length > 2) && !addresses.includes(trimmed)) {
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
      if (inputValue.trim()) {
        addAddress(inputValue);
      }
    } else if (e.key === "Backspace" && inputValue === "" && addresses.length > 0) {
      onAddressesChange(addresses.slice(0, -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const removeAddress = (addr: string) => {
    onAddressesChange(addresses.filter((a) => a !== addr));
  };

  return (
    <div className="relative flex flex-wrap items-center gap-1.5 px-4 py-2 border-b border-border/40 min-h-[42px] bg-card text-xs">
      <span className="font-semibold text-muted-foreground w-8 flex-shrink-0">
        {label}
      </span>

      {addresses.map((addr) => (
        <span
          key={addr}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary border border-border/60 text-xs font-mono text-foreground animate-in fade-in-0 duration-100"
        >
          <span>{addr}</span>
          <button
            type="button"
            onClick={() => removeAddress(addr)}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      <div className="relative flex-1 min-w-[140px]">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder={addresses.length === 0 ? "recipient@example.com (or select suggestion)..." : "Add more..."}
          className="w-full bg-transparent outline-none text-xs text-foreground placeholder:text-muted-foreground/50 py-0.5"
        />

        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute left-0 top-full mt-1 z-50 w-64 rounded-lg border border-border bg-popover text-popover-foreground shadow-md py-1 text-xs">
            <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Suggested Contacts
            </div>
            {filteredSuggestions.map((suggestion, idx) => (
              <button
                key={suggestion}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addAddress(suggestion);
                }}
                className={`w-full text-left px-2.5 py-1.5 hover:bg-secondary cursor-pointer flex items-center justify-between font-mono text-[11px] ${
                  highlightedIndex === idx ? "bg-secondary" : ""
                }`}
              >
                <span>{suggestion}</span>
                <span className="text-[10px] text-muted-foreground font-sans">Tab ↵</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Exact Compose Modal (Simulation)
   ────────────────────────────────────────────── */
export function DemoComposeModal({
  open,
  onClose,
  onSendSimulation,
}: DemoComposeModalProps) {
  const [to, setTo] = useState<string[]>(["partner@fintech.io"]);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState("DMail Integration: Custom Domain Webmail Setup");
  const [bodyHtml, setBodyHtml] = useState(
    "<p>Hi Alex,</p><p>We have successfully configured our custom domain MX routing with <strong>DMail</strong> and Cloudflare edge workers.</p><p>Delivery latency is under <strong>85ms</strong> with zero Linux mail server configuration.</p><p>Best regards,<br/>Dilip</p>"
  );
  const [attachments, setAttachments] = useState<string[]>([
    "architecture-spec.pdf",
  ]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset or initialize when modal opens
  useEffect(() => {
    if (open) {
      setError(null);
      setSending(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSend = () => {
    if (to.length === 0) {
      setError("Please add at least one recipient.");
      return;
    }

    setError(null);
    setSending(true);

    // Realistic Edge sending simulation delay
    setTimeout(() => {
      setSending(false);
      onSendSimulation({
        to,
        cc,
        bcc,
        subject,
        bodyHtml,
        attachments,
      });
      onClose();
    }, 450);
  };

  const handleAddSampleAttachment = () => {
    const sampleFiles = ["dmail-report.pdf", "webhook-payload.json", "certificate.pem"];
    const next = sampleFiles.find((f) => !attachments.includes(f)) || `attachment-${attachments.length + 1}.pdf`;
    setAttachments((prev) => [...prev, next]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center animate-in fade-in-0 duration-150">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl sm:mx-4 bg-card rounded-t-2xl sm:rounded-xl shadow-lg border border-border/80 overflow-hidden flex flex-col z-10 max-h-[90vh] animate-in slide-in-from-bottom-4 duration-200">
        {/* Mobile Sheet Grabber */}
        <div className="sm:hidden w-full flex items-center justify-center py-2 bg-secondary/30 flex-shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-border/60 bg-card flex-shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">New Message</h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Interactive Simulation</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
          {/* From Field */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40 text-xs bg-card flex-shrink-0">
            <span className="font-semibold text-muted-foreground w-8 flex-shrink-0">
              From
            </span>
            <div className="flex items-center gap-2 flex-1 font-mono text-foreground">
              <span className="font-medium">contact@dilip.website</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold font-sans">
                Verified MX
              </span>
            </div>
          </div>

          {/* To Field */}
          <DemoAddressPillInput
            label="To"
            addresses={to}
            onAddressesChange={setTo}
          />

          {/* CC / BCC Toggle */}
          {!showCcBcc ? (
            <div className="px-4 py-1 border-b border-border/30 bg-card flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowCcBcc(true)}
                className="text-[10px] font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                + CC / BCC
              </button>
            </div>
          ) : (
            <>
              <DemoAddressPillInput
                label="CC"
                addresses={cc}
                onAddressesChange={setCc}
              />
              <DemoAddressPillInput
                label="BCC"
                addresses={bcc}
                onAddressesChange={setBcc}
              />
            </>
          )}

          {/* Subject Line */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40 text-xs bg-card flex-shrink-0">
            <span className="font-semibold text-muted-foreground w-8 flex-shrink-0">
              Subj
            </span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject..."
              className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/40 font-medium text-foreground"
            />
          </div>

          {/* Exact Rich Text Editor */}
          <div className="p-3 flex-1 flex flex-col min-h-[190px]">
            <RichTextEditor
              value={bodyHtml}
              onChange={setBodyHtml}
              placeholder="Write your email content..."
              minHeight="170px"
            />
          </div>

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2 flex-shrink-0">
              {attachments.map((filename, i) => (
                <span
                  key={filename + i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary border border-border/60 text-xs font-medium text-foreground animate-in fade-in-0"
                >
                  <Paperclip className="w-3.5 h-3.5 text-primary" />
                  <span className="truncate max-w-[160px] font-mono text-[11px]">{filename}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-foreground ml-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {error && (
            <div className="px-4 pb-2 flex-shrink-0">
              <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-1.5">
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-card flex-shrink-0">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  const names = Array.from(e.target.files).map((f) => f.name);
                  setAttachments((prev) => [...prev, ...names]);
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddSampleAttachment}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border/60 hover:bg-secondary text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Attach document simulation"
            >
              <Paperclip className="w-3.5 h-3.5 text-primary" />
              <span>Attach</span>
            </button>
            <span className="hidden sm:inline text-[10px] text-muted-foreground/75">
              (Demo Simulation • No actual email sent)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || to.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer"
            >
              {sending ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Simulating dispatch...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
