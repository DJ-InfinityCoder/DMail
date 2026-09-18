"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Reply,
  ReplyAll,
  Forward,
  Star,
  Archive,
  Trash2,
  Download,
  ChevronDown,
  ChevronUp,
  Paperclip,
  MoreVertical,
  Send,
  X,
  Minimize2,
  Maximize2,
  Lock,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { useMailContext } from "@/components/mail/mail-shell";
import { RichTextEditor } from "@/components/mail/rich-text-editor";
import { EmailIframeViewer } from "@/components/mail/email-iframe-viewer";
import type { Email } from "@/lib/types";

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */
interface EmailThreadProps {
  emails: Email[];
  currentEmailId: string;
  folder: string;
}

type ReplyMode = "reply" | "replyAll" | "forward" | null;

/* ──────────────────────────────────────────────
   Utility helpers
   ────────────────────────────────────────────── */
const AVATAR_PALETTE = [
  "#8B1E2D", // Deep burgundy
  "#1E40AF", // Royal blue
  "#065F46", // Forest emerald
  "#92400E", // Warm amber
  "#5B21B6", // Deep purple
  "#9D174D", // Rose
  "#115E59", // Teal
  "#9A3412", // Burnt orange
  "#3730A3", // Indigo
];

function getAvatarColor(str: string): string {
  if (!str) return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function getInitials(name: string): string {
  if (!name) return "?";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatAddressDisplay(rawAddress: string) {
  if (!rawAddress) return { name: "Unknown", address: "" };

  const match = rawAddress.match(/^(?:"?([^"]*)"?\s)?<([^>]+)>$/);
  if (match) {
    const rawName = match[1]?.trim();
    const address = match[2];
    if (rawName && rawName.length > 0 && !rawName.includes("@")) {
      return { name: rawName, address };
    }
  }

  const cleanAddr = (match ? match[2] : rawAddress).trim();
  if (!cleanAddr.includes("@")) {
    return { name: cleanAddr, address: cleanAddr };
  }

  const [localPart, domainPart] = cleanAddr.split("@");
  const genericPrefixes = new Set([
    "team", "marketing", "hello", "support", "info", "contact",
    "billing", "notifications", "notification", "community", "webinar",
    "updates", "update", "security", "digest", "news", "newsletter",
    "sales", "press", "admin", "noreply", "no-reply"
  ]);

  if (genericPrefixes.has(localPart.toLowerCase()) && domainPart) {
    const domainParts = domainPart.split(".");
    const nonBrand = new Set([
      "com", "io", "app", "org", "net", "ai", "co", "news",
      "comms", "mail", "email", "team", "mg", "sendgrid", "website"
    ]);
    const brandCandidates = domainParts.filter((p) => !nonBrand.has(p.toLowerCase()));
    const brand = brandCandidates.length > 0 ? brandCandidates[brandCandidates.length - 1] : domainParts[0];

    const formattedBrand = brand
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[-_]/g, " ")
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    return { name: formattedBrand, address: cleanAddr };
  }

  const formattedName = localPart
    .replace(/[-_.]/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return { name: formattedName, address: cleanAddr };
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) {
    return format(date, "h:mm a");
  } else if (diffDays < 7) {
    return format(date, "EEE, h:mm a");
  } else {
    return format(date, "MMM d, yyyy, h:mm a");
  }
}

function buildQuotedContent(email: Email): string {
  const date = email.created_at
    ? format(new Date(email.created_at), "EEE, MMM d, yyyy 'at' h:mm a")
    : "";
  const from = email.from_address;

  const header = `\n\n---------- Forwarded message ----------\nFrom: ${from}\nDate: ${date}\nSubject: ${email.subject ?? "(no subject)"}\nTo: ${email.to_address}\n\n`;

  const replyHeader = `\n\nOn ${date}, ${from} wrote:\n> `;

  return email.body_text ?? "";
}

function buildQuotedHtml(email: Email, mode: ReplyMode): string {
  const date = email.created_at
    ? format(new Date(email.created_at), "EEE, MMM d, yyyy 'at' h:mm a")
    : "";
  const from = email.from_address;
  const originalBody = email.body_html || email.body_text?.replace(/\n/g, "<br/>") || "";

  if (mode === "forward") {
    return `<br/><br/><div style="border-top:1px solid #ccc;padding-top:10px;margin-top:10px;color:#555;">
      <p style="margin:0;font-size:13px;"><b>---------- Forwarded message ----------</b></p>
      <p style="margin:0;font-size:13px;">From: <b>${from}</b></p>
      <p style="margin:0;font-size:13px;">Date: ${date}</p>
      <p style="margin:0;font-size:13px;">Subject: ${email.subject ?? "(no subject)"}</p>
      <p style="margin:0;font-size:13px;">To: ${email.to_address}</p>
      <br/>${originalBody}
    </div>`;
  }

  // Reply / Reply All
  return `<br/><br/><div style="border-left:3px solid #8B1E2D;padding-left:12px;margin-left:0;color:#555;">
    <p style="margin:0 0 8px 0;font-size:12px;color:#888;">On ${date}, <b>${from}</b> wrote:</p>
    ${originalBody}
  </div>`;
}

function prepareEmailHtml(html: string): string {
  if (!html) return "";
  let prepared = html.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi, (match, href, rest) => {
    if (rest.includes("target=")) return match;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer"${rest}>`;
  });
  // Add loading="lazy" to all img tags if not already present
  prepared = prepared.replace(/<img\b(?![^>]*\bloading=)([^>]*?)>/gi, '<img loading="lazy"$1>');
  return prepared;
}

/* ──────────────────────────────────────────────
   Single Email Message (collapsible)
   ────────────────────────────────────────────── */
function EmailMessage({
  email,
  isLast,
  isFirst,
  defaultExpanded,
  onReply,
  onReplyAll,
  onForward,
}: {
  email: Email;
  isLast: boolean;
  isFirst: boolean;
  defaultExpanded: boolean;
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showDetails, setShowDetails] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  // Close details dropdown on click outside, scroll, wheel, Escape key, or window blur
  useEffect(() => {
    if (!showDetails) return;

    const handleInteractionOutside = (e: Event) => {
      if (detailsRef.current && detailsRef.current.contains(e.target as Node)) {
        return;
      }
      setShowDetails(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowDetails(false);
      }
    };

    const handleWindowBlur = () => {
      setShowDetails(false);
    };

    // Capture phase intercepts mousedown, touchstart, scroll, and wheel anywhere on the page
    // passive: true guarantees that scrolling is NEVER blocked or delayed
    document.addEventListener("mousedown", handleInteractionOutside, true);
    document.addEventListener("touchstart", handleInteractionOutside, true);
    window.addEventListener("wheel", handleInteractionOutside, { capture: true, passive: true });
    window.addEventListener("scroll", handleInteractionOutside, { capture: true, passive: true });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("mousedown", handleInteractionOutside, true);
      document.removeEventListener("touchstart", handleInteractionOutside, true);
      window.removeEventListener("wheel", handleInteractionOutside, true);
      window.removeEventListener("scroll", handleInteractionOutside, true);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [showDetails]);

  const sanitizedHtml = useMemo(() => {
    return email.body_html ? prepareEmailHtml(email.body_html) : "";
  }, [email.body_html]);

  const formattedFullDate = useMemo(() => {
    if (!email.created_at) return "";
    try {
      return format(new Date(email.created_at), "MMM d, yyyy, h:mm a");
    } catch {
      return email.created_at;
    }
  }, [email.created_at]);

  const fromDomain = useMemo(() => {
    if (!email.from_address || !email.from_address.includes("@")) return null;
    return email.from_address.split("@")[1]?.trim().toLowerCase();
  }, [email.from_address]);

  const attachments = Array.isArray(email.attachments) ? email.attachments : [];
  const hasAttachments = attachments.length > 0;

  const senderInfo = formatAddressDisplay(email.from_address);

  // Collapsed state — compact single line
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center gap-3 px-3 sm:px-6 py-3 hover:bg-secondary/30 transition-colors text-left group"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white select-none shadow-xs"
          style={{ backgroundColor: getAvatarColor(email.from_address) }}
        >
          {getInitials(senderInfo.name)}
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground truncate max-w-[140px] sm:max-w-[180px]">
            {senderInfo.name}
          </span>
          <span className="text-xs text-muted-foreground truncate flex-1 hidden sm:inline">
            — {email.body_text?.slice(0, 100) ?? ""}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground flex-shrink-0 font-mono whitespace-nowrap">
          {formatRelativeDate(email.created_at)}
        </span>
      </button>
    );
  }

  // Expanded state — full message
  return (
    <div className="group min-w-0 overflow-visible">
      {/* Message Header */}
      <div className="flex items-center gap-3.5 px-3 sm:px-6 pt-4 pb-2.5 min-w-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white shadow-xs select-none"
          style={{ backgroundColor: getAvatarColor(email.from_address) }}
        >
          {getInitials(senderInfo.name)}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0">
          <div className="flex items-center justify-between gap-2 leading-tight">
            <div className="flex items-baseline gap-1.5 min-w-0 flex-1">
              <span className="text-sm font-bold text-foreground truncate leading-snug">
                {senderInfo.name}
              </span>
              <span className="text-xs text-muted-foreground truncate hidden sm:inline font-normal leading-snug">
                &lt;{senderInfo.address}&gt;
              </span>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[11px] text-muted-foreground font-mono whitespace-nowrap leading-none">
                {formatRelativeDate(email.created_at)}
              </span>

              <button
                onClick={() => setExpanded(false)}
                className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors -my-1"
                title="Collapse message"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* To / Details line with popover dropdown */}
          <div className="relative inline-block leading-none" ref={detailsRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails((prev) => !prev);
              }}
              className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors group/details py-0 px-1 -ml-1 rounded hover:bg-secondary/70 focus:outline-none leading-none"
              title="Show details"
            >
              <span className="text-muted-foreground/75 font-normal">to</span>
              <span className="font-medium text-foreground/85 truncate max-w-[200px] sm:max-w-[320px]">
                {email.to_address}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-muted-foreground/70 transition-transform duration-150 inline-block align-middle ${
                  showDetails ? "rotate-180 text-foreground" : ""
                }`}
              />
            </button>

            {/* Gmail-style Details Dropdown Card */}
            {showDetails && (
              <div
                className="absolute -left-[54px] sm:left-0 top-full mt-1.5 z-50 w-[calc(100vw-24px)] max-w-[360px] sm:w-[420px] sm:max-w-none rounded-xl border border-border/80 bg-card p-3.5 sm:p-4 shadow-sm animate-in fade-in-0 zoom-in-95 text-xs text-foreground select-text"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="grid grid-cols-[64px_1fr] sm:grid-cols-[68px_1fr] gap-x-2.5 sm:gap-x-3 gap-y-2 text-[12px] leading-relaxed">
                  <div className="text-right text-muted-foreground select-none">from:</div>
                  <div className="font-medium text-foreground break-all">
                    {email.from_address}
                  </div>

                  <div className="text-right text-muted-foreground select-none">to:</div>
                  <div className="text-foreground/90 break-all">
                    {email.to_address}
                  </div>

                  {email.cc_address && (
                    <>
                      <div className="text-right text-muted-foreground select-none">cc:</div>
                      <div className="text-foreground/90 break-all">
                        {email.cc_address}
                      </div>
                    </>
                  )}

                  {email.bcc_address && (
                    <>
                      <div className="text-right text-muted-foreground select-none">bcc:</div>
                      <div className="text-foreground/90 break-all">
                        {email.bcc_address}
                      </div>
                    </>
                  )}

                  {formattedFullDate && (
                    <>
                      <div className="text-right text-muted-foreground select-none">date:</div>
                      <div className="text-foreground/90">
                        {formattedFullDate}
                      </div>
                    </>
                  )}

                  {email.subject && (
                    <>
                      <div className="text-right text-muted-foreground select-none">subject:</div>
                      <div className="text-foreground/90 font-medium break-words">
                        {email.subject}
                      </div>
                    </>
                  )}

                  {fromDomain && (
                    <>
                      <div className="text-right text-muted-foreground select-none">mailed-by:</div>
                      <div className="text-foreground/80 font-mono text-[11px] break-all">
                        {fromDomain}
                      </div>
                      <div className="text-right text-muted-foreground select-none">signed-by:</div>
                      <div className="text-foreground/80 font-mono text-[11px] break-all">
                        {fromDomain}
                      </div>
                    </>
                  )}

                  <div className="text-right text-muted-foreground select-none">security:</div>
                  <div className="flex items-center gap-1.5 text-foreground/90">
                    <Lock className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>Standard encryption (TLS)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Body */}
      <div className="px-3 sm:px-6 pb-4 sm:pl-[68px]">
        {email.body_html ? (
          <div className="text-sm leading-relaxed overflow-x-auto max-w-full text-foreground/90 select-text">
            <EmailIframeViewer content={sanitizedHtml} />
          </div>
        ) : (
          <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/90 leading-relaxed m-0">
            {email.body_text ?? ""}
          </pre>
        )}

        {/* Attachments */}
        {hasAttachments && (
          <div className="mt-5 pt-3">
            <div className="flex flex-wrap gap-2">
              {attachments.map((att: any, i: number) => (
                <a
                  key={i}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border/80 hover:border-primary/40 bg-card text-xs font-medium text-foreground transition-all group/att"
                >
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Download className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate max-w-[160px]">
                      {att.filename ?? `Attachment ${i + 1}`}
                    </div>
                    {att.size && (
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {att.size < 1024 * 1024
                          ? `${(att.size / 1024).toFixed(0)} KB`
                          : `${(att.size / (1024 * 1024)).toFixed(1)} MB`}
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Inline Reply Composer
   ────────────────────────────────────────────── */
function InlineReplyComposer({
  mode,
  targetEmail,
  allEmails,
  onClose,
  onSent,
  mailboxId,
}: {
  mode: ReplyMode;
  targetEmail: Email;
  allEmails: Email[];
  onClose: () => void;
  onSent: () => void;
  mailboxId?: string;
}) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showQuoted, setShowQuoted] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Build initial recipients and subject based on mode
  useEffect(() => {
    if (mode === "reply") {
      setTo(targetEmail.from_address);
      setCc("");
    } else if (mode === "replyAll") {
      setTo(targetEmail.from_address);
      // Add other recipients to CC
      const otherRecipients = new Set<string>();
      if (targetEmail.to_address) {
        targetEmail.to_address.split(",").forEach((a) => {
          const addr = a.trim().toLowerCase();
          if (addr && addr !== targetEmail.from_address.toLowerCase()) {
            otherRecipients.add(addr);
          }
        });
      }
      if (targetEmail.cc_address) {
        targetEmail.cc_address.split(",").forEach((a) => {
          const addr = a.trim().toLowerCase();
          if (addr) otherRecipients.add(addr);
        });
      }
      setCc(Array.from(otherRecipients).join(", "));
      if (otherRecipients.size > 0) setShowCc(true);
    } else if (mode === "forward") {
      setTo("");
      setCc("");
    }
  }, [mode, targetEmail]);

  // Focus textarea on mount
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  const subject = (() => {
    const sub = targetEmail.subject ?? "";
    if (mode === "forward") {
      return sub.startsWith("Fwd:") ? sub : `Fwd: ${sub}`;
    }
    return sub.startsWith("Re:") ? sub : `Re: ${sub}`;
  })();

  const quotedHtml = buildQuotedHtml(targetEmail, mode);

  const handleSend = async () => {
    const toAddresses = to
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
    if (toAddresses.length === 0) {
      setError("Please add at least one recipient.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const fullBodyHtml = `<div>${body.replace(/\n/g, "<br/>")}</div>${quotedHtml}`;
      const fullBodyText = body + "\n\n" + buildQuotedContent(targetEmail);

      const ccAddresses = cc
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      const res = await fetch("/api/mail/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mailboxId,
          to: toAddresses,
          cc: ccAddresses.length > 0 ? ccAddresses : undefined,
          subject,
          bodyHtml: fullBodyHtml,
          bodyText: fullBodyText,
          inReplyTo:
            mode !== "forward" ? (targetEmail.message_id ?? undefined) : undefined,
          references:
            mode !== "forward" && targetEmail.message_id
              ? [
                  ...(targetEmail.references_header ?? []),
                  targetEmail.message_id,
                ]
              : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to send email");
      }

      onSent();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const modeLabel =
    mode === "reply" ? "Reply" : mode === "replyAll" ? "Reply All" : "Forward";
  const ModeIcon =
    mode === "reply" ? Reply : mode === "replyAll" ? ReplyAll : Forward;

  return (
    <div className="mx-2 sm:mx-6 mb-6 border border-border rounded-xl bg-card overflow-hidden animate-slide-in-up">
      {/* Composer Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-secondary/30">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ModeIcon className="w-4 h-4 text-primary" />
          {modeLabel}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-secondary text-muted-foreground transition-colors"
          >
            {isExpanded ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* To field */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30">
            <span className="text-xs text-muted-foreground w-6 flex-shrink-0">
              To
            </span>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
              placeholder="Recipients (comma-separated)"
            />
            {!showCc && (
              <button
                onClick={() => setShowCc(true)}
                className="text-[11px] text-muted-foreground hover:text-primary transition-colors font-medium"
              >
                Cc
              </button>
            )}
          </div>

          {/* CC field */}
          {showCc && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30">
              <span className="text-xs text-muted-foreground w-6 flex-shrink-0">
                Cc
              </span>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40"
                placeholder="CC recipients"
              />
            </div>
          )}

          {/* Body */}
          <div className="px-4 pt-3 pb-1">
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder="Write your reply..."
              minHeight="140px"
            />
          </div>

          {/* Quoted content toggle */}
          <div className="px-4 pb-2">
            <button
              onClick={() => setShowQuoted(!showQuoted)}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="inline-block w-4 text-center">
                {showQuoted ? "▼" : "▶"}
              </span>
              <span>
                {showQuoted ? "Hide" : "Show"} quoted text
              </span>
            </button>
            {showQuoted && (
              <div
                className="mt-2 pl-3 border-l-2 border-primary/30 text-xs text-muted-foreground max-h-[200px] overflow-y-auto"
                dangerouslySetInnerHTML={{
                  __html:
                    targetEmail.body_html ||
                    targetEmail.body_text?.replace(/\n/g, "<br/>") ||
                    "",
                }}
              />
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 pb-2">
              <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-1.5">
                {error}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
            <div className="text-[11px] text-muted-foreground">
              Ctrl+Enter to send
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Discard
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !to.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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
        </>
      )}
    </div>
  );
}

import { useEmailDetail } from "@/lib/hooks/use-emails-query";
import { useQueryClient } from "@tanstack/react-query";

/* ──────────────────────────────────────────────
   Main EmailThread Component
   ────────────────────────────────────────────── */
export function EmailThread({
  emails: initialEmails,
  currentEmailId,
  folder,
}: EmailThreadProps) {
  const router = useRouter();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { openCompose } = useMailContext();

  // Check if initialEmails from server already has rich body content
  const serverHasBody = initialEmails.some((e) => Boolean(e.body_html || e.body_text));

  const { data: threadData } = useEmailDetail(
    currentEmailId,
    serverHasBody
      ? {
          email: initialEmails.find((e) => e.id === currentEmailId) ?? initialEmails[0],
          threadEmails: initialEmails,
        }
      : undefined
  );

  const emails = serverHasBody ? initialEmails : (threadData?.threadEmails ?? initialEmails);
  const currentEmail = emails.find((e) => e.id === currentEmailId) ?? emails[0];
  const lastEmail = emails[emails.length - 1];
  const threadScrollRef = useRef<HTMLDivElement>(null);

  const [replyMode, setReplyMode] = useState<ReplyMode>(null);
  const [replyTarget, setReplyTarget] = useState<Email>(lastEmail);

  // Get the default mailbox ID from the last email
  const defaultMailboxId = lastEmail?.mailbox_id;

  const handleArchive = async () => {
    const ids = emails.map((e) => e.id);
    await supabase.from("emails").update({ folder: "archive" }).in("id", ids);
    queryClient.invalidateQueries({ queryKey: ["emails"] });
    queryClient.invalidateQueries({ queryKey: ["email-detail", currentEmailId] });
    router.push(`/mail/${folder}`);
  };

  const handleTrash = async () => {
    const ids = emails.map((e) => e.id);
    await supabase.from("emails").update({ folder: "trash" }).in("id", ids);
    queryClient.invalidateQueries({ queryKey: ["emails"] });
    queryClient.invalidateQueries({ queryKey: ["email-detail", currentEmailId] });
    router.push(`/mail/${folder}`);
  };

  const handleStar = async () => {
    const newStarred = !currentEmail.is_starred;
    queryClient.setQueryData(["email-detail", currentEmailId], (prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        email: { ...prev.email, is_starred: newStarred },
        threadEmails: prev.threadEmails?.map((e: Email) =>
          e.id === currentEmailId ? { ...e, is_starred: newStarred } : e
        ),
      };
    });
    await supabase
      .from("emails")
      .update({ is_starred: newStarred })
      .eq("id", currentEmailId);
  };

  const openInlineReply = useCallback(
    (email: Email, mode: ReplyMode) => {
      setReplyTarget(email);
      setReplyMode(mode);
      // Scroll to bottom after a tick
      setTimeout(() => {
        threadScrollRef.current?.scrollTo({
          top: threadScrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 50);
    },
    []
  );

  const handleReplySent = () => {
    setReplyMode(null);
    router.refresh();
  };

  // Mark as read
  useEffect(() => {
    if (currentEmail && !currentEmail.is_read) {
      supabase
        .from("emails")
        .update({ is_read: true })
        .eq("id", currentEmail.id)
        .then();
    }
  }, [currentEmail, supabase]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* ── Top Toolbar ── */}
      <div className="flex items-center justify-between px-3 sm:px-4 h-12 border-b border-border bg-card flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.push(`/mail/${folder}`)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/60 hover:bg-secondary text-foreground text-xs font-medium transition-colors"
            title="Back to list"
          >
            <ArrowLeft className="w-4 h-4 text-primary" />
            <span>Back</span>
          </button>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={handleArchive}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Archive"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={handleTrash}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-border mx-1" />
          <button
            onClick={handleStar}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-amber-500 transition-colors"
            title={currentEmail.is_starred ? "Unstar" : "Star"}
          >
            <Star
              className={`w-4 h-4 ${
                currentEmail.is_starred
                  ? "fill-amber-500 text-amber-500"
                  : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── Subject Line ── */}
      <div className="px-6 py-4 border-b border-border/50 bg-card flex items-start gap-3">
        <h1 className="text-lg font-bold tracking-tight text-foreground flex-1 leading-snug">
          {currentEmail.subject ?? "(no subject)"}
        </h1>
        {currentEmail.labels && currentEmail.labels.length > 0 && (
          <div className="flex gap-1.5 flex-shrink-0">
            {currentEmail.labels.map((label) => (
              <span
                key={label}
                className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Thread Messages ── */}
      <div
        ref={threadScrollRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="divide-y divide-border/30">
          {emails.map((email, index) => (
            <EmailMessage
              key={email.id}
              email={email}
              isFirst={index === 0}
              isLast={index === emails.length - 1}
              defaultExpanded={
                emails.length <= 3 || index === emails.length - 1
              }
              onReply={() => openInlineReply(email, "reply")}
              onReplyAll={() => openInlineReply(email, "replyAll")}
              onForward={() => openInlineReply(email, "forward")}
            />
          ))}
        </div>

        {/* ── Inline Reply Composer ── */}
        {replyMode && (
          <InlineReplyComposer
            mode={replyMode}
            targetEmail={replyTarget}
            allEmails={emails}
            onClose={() => setReplyMode(null)}
            onSent={handleReplySent}
            mailboxId={defaultMailboxId}
          />
        )}
      </div>

      {/* ── Bottom Quick Action Bar ── */}
      {!replyMode && (
        <div className="px-6 py-3 border-t border-border bg-card flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => openInlineReply(lastEmail, "reply")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Reply className="w-3.5 h-3.5" />
            Reply
          </button>
          <button
            onClick={() => openInlineReply(lastEmail, "replyAll")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-secondary text-xs font-semibold text-foreground transition-colors"
          >
            <ReplyAll className="w-3.5 h-3.5 text-primary" />
            Reply All
          </button>
          <button
            onClick={() => openInlineReply(lastEmail, "forward")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-secondary text-xs font-semibold text-foreground transition-colors"
          >
            <Forward className="w-3.5 h-3.5 text-primary" />
            Forward
          </button>
        </div>
      )}
    </div>
  );
}
