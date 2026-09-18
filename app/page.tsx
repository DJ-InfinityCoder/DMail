"use client";

import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-switcher";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { DemoComposeModal } from "@/components/mail/demo-compose-modal";
import {
  Mail,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  Keyboard,
  MessageSquare,
  Lock,
  Sparkles,
  CheckCircle2,
  Inbox,
  Send,
  Star,
  Archive,
  ChevronDown,
  Layers,
  Cpu,
  Database,
  Terminal,
  Server,
  FileCode,
  Check,
  ExternalLink,
  Sliders,
  ShieldCheck,
  RefreshCw,
  Clock,
  Sparkle,
  Eye,
  CornerUpLeft,
  Reply,
  ReplyAll,
  Forward,
  Plus,
  Trash2,
  ArrowLeft,
  Copy,
  Search,
  FileEdit,
  X,
} from "lucide-react";

interface SampleEmail {
  id: string;
  fromName: string;
  fromAddress: string;
  toAddress: string;
  subject: string;
  time: string;
  unread: boolean;
  starred: boolean;
  folder: "inbox" | "archive" | "trash" | "sent" | "drafts";
  avatarBg: string;
  preview: string;
  body: string;
  dateFull: string;
  domain: string;
}

const INITIAL_SAMPLE_EMAILS: SampleEmail[] = [
  {
    id: "1",
    fromName: "Aura Neo4j",
    fromAddress: "aura@neo4j.com",
    toAddress: "contact@dilip.website",
    subject: "New Neo4j capabilities for AI at scale",
    time: "10:54 PM",
    unread: true,
    starred: true,
    folder: "inbox",
    avatarBg: "#0f766e",
    preview: "Work with your data where it already lives. Neo4j Virtual Graph delivers zero-copy graph capabilities...",
    body: `Hello,\n\nAs AI workloads scale, managing knowledge graphs without complexity is critical. Neo4j has just released several new capabilities built specifically for that.\n\nWork with your data where it already lives:\n• Neo4j Virtual Graph brings zero-copy graph capabilities to data across your existing systems.\n• Native vector search integrated with multi-hop graph traversals.\n• General availability is rolling out across all cloud regions.\n\nBest regards,\nThe Neo4j Aura Team`,
    dateFull: "Sep 17, 2026, 10:54 PM",
    domain: "neo4j.com",
  },
  {
    id: "2",
    fromName: "Cloudflare Routing",
    fromAddress: "routing@cloudflare.com",
    toAddress: "contact@dilip.website",
    subject: "Catch-All MX Active: dilip.website is verified",
    time: "8:30 PM",
    unread: true,
    starred: true,
    folder: "inbox",
    avatarBg: "#ea580c",
    preview: "DNS verification successful. All inbound email routes for dilip.website are now streaming to dmail-receiver...",
    body: `Hi there,\n\nYour domain dilip.website has completed DNS verification for Cloudflare Email Routing.\n\nConfigured Records:\n✓ MX record pointed to route1.mx.cloudflare.net (Priority 50)\n✓ SPF record: v=spf1 include:_spf.mx.cloudflare.net ~all\n✓ Worker: workers/dmail-receiver active\n\nIncoming emails will now be parsed at edge and delivered directly to your Supabase PostgreSQL store.\n\nCloudflare Routing Team`,
    dateFull: "Sep 17, 2026, 8:30 PM",
    domain: "cloudflare.com",
  },
  {
    id: "3",
    fromName: "Academic Dean",
    fromAddress: "academics@nitdelhi.ac.in",
    toAddress: "contact@dilip.website",
    subject: "Official Notice: Autumn Semester Research Schedule",
    time: "Yesterday",
    unread: false,
    starred: true,
    folder: "inbox",
    avatarBg: "#8B1E2D",
    preview: "Please review the updated schedule for research paper submissions and departmental evaluations...",
    body: `Dear Researcher,\n\nPlease find the updated timeline for the upcoming semester evaluations and lab presentations.\n\nImportant Deadlines:\n• Synopsis Submission: Oct 15, 2026\n• Progress Evaluation: Nov 02, 2026\n\nNote: This email was automatically marked as Starred by DMail's trusted institutional domain rules (nitdelhi.ac.in).\n\nRegards,\nAcademic Section, NIT Delhi`,
    dateFull: "Sep 16, 2026, 3:15 PM",
    domain: "nitdelhi.ac.in",
  },
  {
    id: "4",
    fromName: "Supabase Platform",
    fromAddress: "alerts@supabase.io",
    toAddress: "contact@dilip.website",
    subject: "Database Security Alert: RLS Active & Policies Enforced",
    time: "Sep 14",
    unread: false,
    starred: false,
    folder: "inbox",
    avatarBg: "#15803d",
    preview: "Weekly report: 100% of tables have Row Level Security enabled. All mailbox queries isolated to owner org...",
    body: `Security Audit Summary for your DMail instance:\n\n• Row Level Security: ACTIVE on 'emails', 'mailboxes', and 'domains'\n• Realtime Changes: WebSockets connected and pushing notifications\n• Storage Buckets: Private attachment uploads restricted to authorized users\n\nNo vulnerabilities detected.\n\nSupabase Security Bot`,
    dateFull: "Sep 14, 2026, 11:20 AM",
    domain: "supabase.io",
  },
  {
    id: "5",
    fromName: "Stripe Billing",
    fromAddress: "invoices@stripe.com",
    toAddress: "contact@dilip.website",
    subject: "Receipt for Custom Domain Pro Plan (#INV-2026-09)",
    time: "Sep 10",
    unread: false,
    starred: false,
    folder: "archive",
    avatarBg: "#6366f1",
    preview: "Your payment of $12.00 has been processed successfully. Download your receipt and view billing details...",
    body: `Hi Dilip,\n\nThank you for your business. Your payment for the Custom Domain Pro subscription has been processed.\n\nInvoice ID: INV-2026-09-8821\nAmount Paid: $12.00 USD\nPayment Method: Visa ending in 4242\nStatus: Paid\n\nYou can manage your payment methods anytime in your billing portal.\n\nThe Stripe Team`,
    dateFull: "Sep 10, 2026, 9:00 AM",
    domain: "stripe.com",
  },
  {
    id: "6",
    fromName: "GitHub Team",
    fromAddress: "notifications@github.com",
    toAddress: "contact@dilip.website",
    subject: "[Security] Automated vulnerability audit completed: 0 alerts",
    time: "Sep 08",
    unread: false,
    starred: true,
    folder: "archive",
    avatarBg: "#334155",
    preview: "Dependabot security update completed. All 42 dependencies in DMail repository are up-to-date...",
    body: `Hi @dilip,\n\nDependabot scanned your repository DJ-InfinityCoder/DMail.\n\n• Vulnerabilities found: 0\n• Up-to-date packages: 42/42\n• Next scheduled scan: Next Monday\n\nKeep up the great security hygiene!\n\nGitHub Security Services`,
    dateFull: "Sep 08, 2026, 2:40 PM",
    domain: "github.com",
  },
  {
    id: "7",
    fromName: "Dilip (You)",
    fromAddress: "contact@dilip.website",
    toAddress: "partner@fintech.io",
    subject: "Re: Partnership integration & API webhooks",
    time: "Sep 05",
    unread: false,
    starred: false,
    folder: "sent",
    avatarBg: "#8B1E2D",
    preview: "Hi Alex, I've configured our Cloudflare Email Routing worker to stream all verification webhooks directly...",
    body: `Hi Alex,\n\nI've configured our Cloudflare Email Routing worker to stream all verification webhooks directly to your staging environment.\n\nPlease verify the test payload and let me know if any header modifications are needed.\n\nBest,\nDilip\nFounder, DMail`,
    dateFull: "Sep 05, 2026, 4:15 PM",
    domain: "dilip.website",
  },
  {
    id: "8",
    fromName: "Draft Message",
    fromAddress: "contact@dilip.website",
    toAddress: "advisors@seedfund.vc",
    subject: "Q4 Growth Update: Custom Domain Webmail Adoption",
    time: "Draft",
    unread: false,
    starred: false,
    folder: "drafts",
    avatarBg: "#64748b",
    preview: "Draft: Reached 1,200 active custom domain inboxes on DMail with 99.98% delivery rate across Cloudflare edge...",
    body: `Hi Everyone,\n\nQuick draft of our monthly update:\n• Inboxes active: 1,200+\n• Median edge latency: 84ms\n• Zero complex Linux mail server setup\n\n(Still drafting financial breakdown section...)`,
    dateFull: "Saved today, 3:12 PM",
    domain: "dilip.website",
  },
  {
    id: "9",
    fromName: "Spam Filter",
    fromAddress: "promo@random-offers-now.xyz",
    toAddress: "contact@dilip.website",
    subject: "Win a free server cluster in the cloud!",
    time: "Aug 28",
    unread: false,
    starred: false,
    folder: "trash",
    avatarBg: "#94a3b8",
    preview: "Filtered by DMail Spam Rules: This message was moved to Trash due to unverified sender domain...",
    body: `Filtered by DMail Spam Rules: This message was moved to Trash due to poor SPF/DKIM reputation from unverified sender.\n\nOriginal Content: Claim your server voucher today.`,
    dateFull: "Aug 28, 2026, 1:00 AM",
    domain: "random-offers-now.xyz",
  },
];

export default function Home() {
  const [emails, setEmails] = useState<SampleEmail[]>(INITIAL_SAMPLE_EMAILS);
  const [activeFolder, setActiveFolder] = useState<string>("inbox");
  const [selectedEmailId, setSelectedEmailId] = useState<string>("1");
  const [showDetails, setShowDetails] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "reader">("list");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 2500);
  };

  const folderCounts: Record<string, number> = {
    inbox: emails.filter((e) => e.folder === "inbox").length,
    starred: emails.filter((e) => e.starred && e.folder !== "trash").length,
    drafts: emails.filter((e) => e.folder === "drafts").length,
    sent: emails.filter((e) => e.folder === "sent").length,
    archive: emails.filter((e) => e.folder === "archive").length,
    trash: emails.filter((e) => e.folder === "trash").length,
  };

  const filteredEmails = emails.filter((email) => {
    const matchesFolder =
      activeFolder === "starred"
        ? email.starred && email.folder !== "trash"
        : email.folder === activeFolder;

    if (!matchesFolder) return false;

    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase().trim();
    return (
      email.subject.toLowerCase().includes(q) ||
      email.fromName.toLowerCase().includes(q) ||
      email.fromAddress.toLowerCase().includes(q) ||
      email.preview.toLowerCase().includes(q) ||
      email.body.toLowerCase().includes(q) ||
      email.domain.toLowerCase().includes(q)
    );
  });

  const selectedEmail =
    filteredEmails.find((e) => e.id === selectedEmailId) ||
    filteredEmails[0] ||
    null;

  const handleSelectFolder = (folderId: string) => {
    setActiveFolder(folderId);
    setShowDetails(false);
    setIsReplying(false);
    setIsComposing(false);
    setMobileView("list");
    const inFolder = emails.filter((e) => {
      if (folderId === "starred") return e.starred && e.folder !== "trash";
      return e.folder === folderId;
    });
    if (inFolder.length > 0) {
      setSelectedEmailId(inFolder[0].id);
    } else {
      setSelectedEmailId("");
    }
  };

  const handleSelectEmail = (email: SampleEmail) => {
    setSelectedEmailId(email.id);
    setShowDetails(false);
    setIsReplying(false);
    setIsComposing(false);
    setMobileView("reader");
    if (email.unread) {
      setEmails((prev) =>
        prev.map((e) => (e.id === email.id ? { ...e, unread: false } : e))
      );
    }
  };

  const handleToggleStar = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEmails((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextState = !item.starred;
          showFeedback(nextState ? "Starred message" : "Unstarred message");
          return { ...item, starred: nextState };
        }
        return item;
      })
    );
  };

  const handleArchive = (id: string) => {
    setEmails((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextFolder = item.folder === "archive" ? "inbox" : "archive";
          showFeedback(
            nextFolder === "archive"
              ? "Moved to Archive"
              : "Moved back to Inbox"
          );
          return { ...item, folder: nextFolder };
        }
        return item;
      })
    );
  };

  const handleDelete = (id: string) => {
    setEmails((prev) => {
      const target = prev.find((e) => e.id === id);
      if (target?.folder === "trash") {
        showFeedback("Email permanently deleted");
        return prev.filter((item) => item.id !== id);
      }
      showFeedback("Moved to Trash");
      return prev.map((item) =>
        item.id === id ? { ...item, folder: "trash" } : item
      );
    });
    if (filteredEmails.length <= 1) {
      setMobileView("list");
    }
  };

  const handleSendSimulation = (data: {
    to: string[];
    cc: string[];
    bcc: string[];
    subject: string;
    bodyHtml: string;
    attachments: string[];
  }) => {
    const plainText = data.bodyHtml
      .replace(/<br\s*[\/]?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]*>?/gm, "")
      .trim();

    const newSent: SampleEmail = {
      id: String(Date.now()),
      fromName: "You (Dilip)",
      fromAddress: "contact@dilip.website",
      toAddress: data.to.join(", ") || "client@company.com",
      subject: data.subject || "(No subject)",
      time: "Just now",
      unread: false,
      starred: false,
      folder: "sent",
      avatarBg: "#8B1E2D",
      preview: (plainText || "Sent from DMail Workspace").slice(0, 85),
      body: plainText || "Sent from DMail Workspace via Cloudflare Email Routing.",
      dateFull: "Just now",
      domain: "dilip.website",
    };
    setEmails((prev) => [newSent, ...prev]);
    setIsComposing(false);
    setActiveFolder("sent");
    setSelectedEmailId(newSent.id);
    setMobileView("reader");
    showFeedback(`Simulation: Sent email to ${data.to.join(", ")} 🚀 (Demo Mode)`);
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    const newReply: SampleEmail = {
      id: String(Date.now()),
      fromName: "You (Dilip)",
      fromAddress: "contact@dilip.website",
      toAddress: selectedEmail.fromAddress,
      subject: `Re: ${selectedEmail.subject}`,
      time: "Just now",
      unread: false,
      starred: false,
      folder: "sent",
      avatarBg: "#8B1E2D",
      preview: replyText.slice(0, 80),
      body: replyText,
      dateFull: "Just now",
      domain: "dilip.website",
    };
    setEmails((prev) => [newReply, ...prev]);
    setReplyText("");
    setIsReplying(false);
    showFeedback("Reply sent via SMTP!");
  };

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground font-sans antialiased overflow-x-hidden">
      {/* ── Sticky Navbar ── */}
      <nav className="w-full border-b border-border/80 bg-background/85 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 h-16 relative">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <img
                src="/icon.png"
                alt="DMail Logo"
                className="w-7 h-7 object-contain group-hover:scale-105 transition-transform"
              />
              <span className="text-xl font-bold tracking-tight text-foreground flex items-center">
                <span className="text-primary">D</span>Mail
              </span>
            </Link>
          </div>

          {/* Nav Links — Centered absolutely in the navbar */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground absolute left-1/2 -translate-x-1/2">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-foreground transition-colors">
              Live Sandbox
            </a>
            <a href="#workflow" className="hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#tech-stack" className="hover:text-foreground transition-colors">
              Architecture
            </a>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <PwaInstallButton variant="ghost" size="icon" showText={false} />
            <ThemeToggle variant="ghost" size="icon" />

              <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all"
            >
              <span>Launch Webmail</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section: Command Center ── */}
      <section className="relative pt-16 sm:pt-24 pb-16 px-4 sm:px-6 max-w-7xl mx-auto text-center">
        {/* Ambient background glow */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-r from-primary/15 via-rose-500/10 to-amber-500/10 blur-3xl pointer-events-none -z-10" />

        {/* Status pill badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-xs font-semibold text-primary mb-6 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Next.js &bull; Cloudflare Email Routing &bull; Supabase</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground leading-[1.1] mb-6 max-w-4xl mx-auto">
          Take Full Control of Your{" "}
          <span className="font-tangerine font-bold text-5xl sm:text-7xl lg:text-8xl bg-gradient-to-r from-[#8B1E2D] via-rose-600 to-red-500 dark:from-rose-400 dark:via-rose-500 dark:to-red-400 bg-clip-text text-transparent inline-block tracking-normal">
            Custom Domains Emails.
          </span>
        </h1>

        <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-9 leading-relaxed font-normal">
          Fast, secure, and modern webmail powered by Cloudflare Email Routing and Next.js.
          Deploy your own high-performance private email command center with zero complex mail server setup.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
          <Link
            href="/auth/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all text-sm"
          >
            <span>Go to Webmail</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="#demo"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-border bg-card/80 hover:bg-secondary transition-colors text-sm font-medium text-foreground backdrop-blur-sm"
          >
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span>Try Interactive Sandbox</span>
          </a>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left text-xs sm:text-sm text-muted-foreground pt-4 border-t border-border/50">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Zero Third-Party Ads or Tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>&lt;100ms Cloudflare Edge Ingestion</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>PostgreSQL Row-Level Security</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Sandboxed Iframe Rendering</span>
          </div>
        </div>
      </section>

      {/* ── Interactive Live Demo / Sandbox Mode ── */}
      <section id="demo" className="py-16 px-4 sm:px-6 max-w-6xl mx-auto scroll-mt-20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <Terminal className="w-3.5 h-3.5 text-primary" />
            <span>Interactive Live Sandbox</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Experience the Modern Webmail Interface
          </h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto mt-1">
            Click on any email below to test live split-pane reading, details inspection, and layout responsiveness without signing in.
          </p>
        </div>

        {/* Realistic Webmail Workspace Preview */}
        <DemoComposeModal
          open={isComposing}
          onClose={() => setIsComposing(false)}
          onSendSimulation={handleSendSimulation}
        />

        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden relative flex flex-col h-[520px] sm:h-[540px] md:h-[580px] max-h-[520px] sm:max-h-[540px] md:max-h-[580px]">
          {actionNotice && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-foreground text-background text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in-0 slide-in-from-top-2 duration-150">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{actionNotice}</span>
            </div>
          )}

          {/* Mock Window Top Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 bg-muted/40 text-xs flex-shrink-0 h-11">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-semibold text-foreground hidden sm:inline">DMail Workspace</span>
            </div>

            {/* Active Mailbox Pill */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border/60 text-xs font-mono">
              <Globe className="w-3 h-3 text-primary" />
              <span className="text-foreground font-medium">contact@dilip.website</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold">
                Verified MX
              </span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="hidden sm:inline text-[11px] font-medium">Storage: 4.2 MB / 1 GB</span>
            </div>
          </div>

          {/* Interactive Split Workspace Mock */}
          <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 h-full bg-background text-foreground overflow-hidden">
            {/* 1. Sidebar Mock (Left on desktop) */}
            <div className="hidden md:flex md:col-span-3 border-r border-border/80 bg-card flex-col p-2.5 gap-1.5 h-full min-h-0 overflow-hidden">
              {/* Brand Header */}
              <div className="px-2 h-10 flex items-center justify-between border-b border-border/60 min-w-0">
                <div className="flex items-center gap-2">
                  <img src="/icon.png" alt="DMail Logo" className="w-5 h-5 object-contain" />
                  <span className="text-sm font-bold tracking-tight text-foreground flex items-center">
                    <span className="text-primary">D</span>Mail
                  </span>
                </div>
                <span className="text-[9px] font-semibold tracking-wide px-1.5 py-0.2 rounded bg-secondary text-muted-foreground">
                  Workspace
                </span>
              </div>

              {/* Compose Button */}
              <div className="py-1 flex-shrink-0">
                <button
                  onClick={() => {
                    setIsComposing(true);
                    setIsReplying(false);
                  }}
                  className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isComposing
                      ? "bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/30"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Compose</span>
                </button>
              </div>

              {/* Folders Navigation */}
              <div className="space-y-0.5 flex-1 min-h-0 overflow-y-auto">
                {[
                  { id: "inbox", label: "Inbox", icon: Inbox },
                  { id: "starred", label: "Starred", icon: Star },
                  { id: "drafts", label: "Drafts", icon: FileEdit },
                  { id: "sent", label: "Sent", icon: Send },
                  { id: "archive", label: "Archive", icon: Archive },
                  { id: "trash", label: "Trash", icon: Trash2 },
                ].map((folder) => {
                  const isActive = activeFolder === folder.id && !isComposing;
                  const count = folderCounts[folder.id] ?? 0;
                  return (
                    <button
                      key={folder.id}
                      onClick={() => handleSelectFolder(folder.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        isActive
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-foreground/80 hover:bg-secondary hover:text-foreground font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <folder.icon
                          className={`w-3.5 h-3.5 ${
                            isActive ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <span>{folder.label}</span>
                      </div>
                      {count > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold min-w-[18px] text-center ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Mailboxes Section */}
              <div className="mt-auto pt-2 border-t border-border/50 flex-shrink-0">
                <div className="px-1 mb-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  Mailboxes
                </div>
                <button
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      navigator.clipboard.writeText("contact@dilip.website");
                      showFeedback("Copied contact@dilip.website");
                    }
                  }}
                  className="w-full px-2 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary/80 border border-border/50 flex items-center justify-between text-xs transition-colors cursor-pointer text-left"
                  title="Click to copy email address"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-[11px] font-mono font-medium truncate text-foreground">contact@dilip.website</span>
                  </div>
                  <Copy className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* 2. Email List Mock (Center) */}
            <div
              className={`${
                mobileView === "reader" ? "hidden md:flex" : "flex"
              } md:col-span-4 border-r border-border/80 flex-col bg-card/40 h-full min-h-0 overflow-hidden flex-1 md:flex-initial`}
            >
              {/* Mobile Quick Folder Bar */}
              <div className="flex md:hidden items-center gap-1 p-1.5 border-b border-border/60 bg-muted/30 overflow-x-auto text-xs scrollbar-none flex-shrink-0">
                <button
                  onClick={() => {
                    setIsComposing(true);
                    setIsReplying(false);
                    setMobileView("reader");
                  }}
                  className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary text-primary-foreground flex items-center gap-1 flex-shrink-0 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Compose</span>
                </button>
                {[
                  { id: "inbox", label: "Inbox" },
                  { id: "starred", label: "Starred" },
                  { id: "archive", label: "Archive" },
                  { id: "sent", label: "Sent" },
                  { id: "drafts", label: "Drafts" },
                  { id: "trash", label: "Trash" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleSelectFolder(f.id)}
                    className={`px-2 py-0.5 rounded-md text-[11px] whitespace-nowrap transition-colors cursor-pointer flex-shrink-0 ${
                      activeFolder === f.id
                        ? "bg-primary text-primary-foreground font-bold"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f.label} ({folderCounts[f.id] || 0})
                  </button>
                ))}
              </div>

              <div className="h-11 px-3 border-b border-border/60 flex items-center justify-between bg-card text-xs flex-shrink-0 gap-2">
                {isSearchOpen ? (
                  <div className="flex-1 flex items-center gap-1.5 bg-secondary/50 rounded-lg px-2.5 py-1 border border-border/70 animate-in fade-in-0 duration-150">
                    <Search className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <input
                      type="text"
                      placeholder={`Search in ${activeFolder}...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none min-w-0"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                        title="Clear query"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setIsSearchOpen(false);
                      }}
                      className="text-[10px] font-semibold text-muted-foreground hover:text-foreground px-1 py-0.5 rounded hover:bg-secondary cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-foreground capitalize truncate">{activeFolder}</span>
                      {searchQuery ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">
                          {filteredEmails.length} matching
                        </span>
                      ) : filteredEmails.filter((e) => e.unread).length > 0 ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">
                          {filteredEmails.filter((e) => e.unread).length} unread
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-secondary text-muted-foreground">
                          {filteredEmails.length} {filteredEmails.length === 1 ? "email" : "emails"}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSearchOpen(true)}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                      title="Search emails"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[10px] font-medium">Search</span>
                    </button>
                  </>
                )}
              </div>

              <div className="p-1 space-y-0.5 overflow-y-auto flex-1 min-h-0">
                {filteredEmails.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                    <div className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center mb-2 text-muted-foreground">
                      {searchQuery ? (
                        <Search className="w-4 h-4 text-primary" />
                      ) : activeFolder === "starred" ? (
                        <Star className="w-4 h-4 text-amber-500" />
                      ) : activeFolder === "archive" ? (
                        <Archive className="w-4 h-4 text-primary" />
                      ) : activeFolder === "trash" ? (
                        <Trash2 className="w-4 h-4 text-destructive" />
                      ) : (
                        <Inbox className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-foreground">
                      {searchQuery ? `No emails matching "${searchQuery}"` : `No emails in ${activeFolder}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[220px]">
                      {searchQuery ? "Try searching for a different keyword, sender, or domain." : "This folder is currently empty."}
                    </p>
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="mt-2.5 px-3 py-1 rounded-md bg-secondary text-foreground text-[11px] font-semibold hover:bg-secondary/80 transition-colors cursor-pointer"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                ) : (
                  filteredEmails.map((email) => {
                    const isSelected = selectedEmail?.id === email.id && !isComposing;
                    return (
                      <div
                        key={email.id}
                        onClick={() => handleSelectEmail(email)}
                        className={`
                          flex items-start gap-2.5 px-3 py-2 mx-0.5 rounded-xl
                          cursor-pointer transition-all duration-150 relative select-none border text-left
                          ${
                            isSelected
                              ? "bg-primary/[0.08] dark:bg-primary/[0.14] border-primary/30"
                              : email.unread
                              ? "bg-card hover:bg-secondary/60 border-border/50"
                              : "bg-card/30 hover:bg-secondary/40 border-transparent text-muted-foreground/90"
                          }
                        `}
                      >
                        {/* Active email left indicator pill */}
                        {isSelected && (
                          <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full" />
                        )}

                        {/* Avatar with Initials */}
                        <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                            style={{ backgroundColor: email.avatarBg }}
                          >
                            {email.fromName.slice(0, 2).toUpperCase()}
                          </div>
                        </div>

                        {/* Middle: Content Column */}
                        <div className="flex-1 min-w-0 pr-0.5">
                          {/* Sender & Date Line */}
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {email.unread && (
                                <span
                                  className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 animate-pulse"
                                  title="Unread"
                                />
                              )}
                              <span
                                className={`text-xs truncate leading-snug ${
                                  email.unread
                                    ? "font-bold text-foreground"
                                    : "font-semibold text-foreground/85"
                                }`}
                              >
                                {email.fromName}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-mono whitespace-nowrap flex-shrink-0 ${
                                email.unread ? "font-bold text-primary" : "text-muted-foreground/70"
                              }`}
                            >
                              {email.time}
                            </span>
                          </div>

                          {/* Subject Line */}
                          <h4
                            className={`text-xs truncate leading-snug mb-0.5 ${
                              email.unread
                                ? "font-bold text-foreground"
                                : "font-medium text-foreground/80"
                            }`}
                          >
                            {email.subject}
                          </h4>

                          {/* Snippet Line */}
                          <p className="text-[10px] text-muted-foreground/65 truncate leading-tight font-normal">
                            {email.preview}
                          </p>
                        </div>

                        {/* Star Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleStar(email.id, e)}
                          className="p-1 rounded hover:bg-secondary/80 transition-colors flex-shrink-0 mt-0.5 cursor-pointer"
                          title={email.starred ? "Unstar" : "Star"}
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${
                              email.starred
                                ? "fill-amber-500 text-amber-500"
                                : "text-muted-foreground/30 hover:text-amber-500"
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. Email Thread Reader Mock (Right) */}
            <div
              className={`${
                mobileView === "list" ? "hidden md:flex" : "flex"
              } md:col-span-5 flex-col bg-card h-full min-h-0 overflow-hidden flex-1`}
            >
              {!selectedEmail ? (
                /* Empty Reader State */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                  <Inbox className="w-8 h-8 opacity-30 mb-2" />
                  <p className="text-xs font-medium text-foreground">No email selected</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {searchQuery ? "No matching emails found." : "Select an email from the list to view its contents."}
                  </p>
                </div>
              ) : (
                /* Thread Reader Content */
                <>
                  {/* Action Toolbar */}
                  <div className="h-11 px-4 border-b border-border/70 flex items-center justify-between bg-card flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setMobileView("list");
                          if (activeFolder !== "inbox" && typeof window !== "undefined" && window.innerWidth >= 768) {
                            handleSelectFolder("inbox");
                            showFeedback("Returned to Inbox");
                          }
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/80 hover:bg-secondary text-foreground text-[11px] font-semibold transition-colors cursor-pointer"
                        title="Back to email list"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 text-primary" />
                        <span>Back</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleArchive(selectedEmail.id)}
                        className={`p-1.5 rounded-md hover:bg-secondary transition-colors cursor-pointer ${
                          selectedEmail.folder === "archive"
                            ? "text-primary font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        title={selectedEmail.folder === "archive" ? "Move back to Inbox" : "Archive"}
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(selectedEmail.id)}
                        className={`p-1.5 rounded-md hover:bg-secondary transition-colors cursor-pointer ${
                          selectedEmail.folder === "trash"
                            ? "text-destructive"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        title={selectedEmail.folder === "trash" ? "Delete Permanently" : "Move to Trash"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="w-px h-3.5 bg-border mx-1" />
                      <button
                        onClick={() => handleToggleStar(selectedEmail.id)}
                        className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title={selectedEmail.starred ? "Unstar" : "Star"}
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            selectedEmail.starred
                              ? "fill-amber-500 text-amber-500"
                              : "text-muted-foreground hover:text-amber-500"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Subject Line Header */}
                  <div className="px-4 py-3 border-b border-border/50 bg-card flex items-start gap-2.5">
                    <h3 className="text-sm font-bold tracking-tight text-foreground flex-1 leading-snug">
                      {selectedEmail.subject}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {selectedEmail.starred && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-semibold flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-amber-500" />
                          <span>Starred</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-semibold capitalize">
                        {selectedEmail.folder}
                      </span>
                    </div>
                  </div>

                  {/* Message Header */}
                  <div className="px-4 pt-3 pb-2 border-b border-border/40">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 select-none"
                        style={{ backgroundColor: selectedEmail.avatarBg }}
                      >
                        {selectedEmail.fromName.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-center gap-0 leading-none">
                        <div className="flex items-center justify-between gap-1 leading-tight">
                          <div className="flex items-baseline gap-1 min-w-0 flex-1">
                            <span className="text-xs font-bold text-foreground truncate leading-snug">
                              {selectedEmail.fromName}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate hidden sm:inline font-normal leading-snug">
                              &lt;{selectedEmail.fromAddress}&gt;
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap leading-none">
                            {selectedEmail.time}
                          </span>
                        </div>

                        {/* To / Details line with popover dropdown */}
                        <div className="relative inline-block leading-none mt-0.5">
                          <button
                            type="button"
                            onClick={() => setShowDetails(!showDetails)}
                            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors group/details py-0 px-1 -ml-1 rounded hover:bg-secondary/70 focus:outline-none leading-none cursor-pointer"
                            title="Show details"
                          >
                            <span className="text-muted-foreground/75 font-normal">to</span>
                            <span className="font-medium text-foreground/85 truncate max-w-[180px]">
                              {selectedEmail.toAddress}
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
                              className="absolute left-0 top-full mt-1 z-50 w-72 sm:w-80 rounded-xl border border-border/80 bg-card p-3 shadow-sm animate-in fade-in-0 zoom-in-95 text-[11px] text-foreground select-text"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="grid grid-cols-[54px_1fr] gap-x-2 gap-y-1 text-[11px] leading-relaxed">
                                <div className="text-right text-muted-foreground select-none">from:</div>
                                <div className="font-medium text-foreground break-all">{selectedEmail.fromAddress}</div>

                                <div className="text-right text-muted-foreground select-none">to:</div>
                                <div className="text-foreground/90 break-all">{selectedEmail.toAddress}</div>

                                <div className="text-right text-muted-foreground select-none">date:</div>
                                <div className="text-foreground/90">{selectedEmail.dateFull}</div>

                                <div className="text-right text-muted-foreground select-none">subject:</div>
                                <div className="text-foreground/90 font-medium break-words">{selectedEmail.subject}</div>

                                <div className="text-right text-muted-foreground select-none">security:</div>
                                <div className="flex items-center gap-1 text-foreground/90 font-medium">
                                  <Lock className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                                  <span>Standard encryption (TLS)</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="p-4 flex-1 min-h-0 overflow-y-auto text-xs text-foreground/90 whitespace-pre-line leading-relaxed font-sans bg-card">
                    {selectedEmail.body}
                  </div>

                  {/* Inline Reply Composer */}
                  {isReplying && (
                    <div className="p-3 border-t border-border bg-secondary/30 flex flex-col gap-2 flex-shrink-0 animate-in fade-in-0 slide-in-from-bottom-2 duration-150">
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>
                          Replying as <strong className="text-foreground">contact@dilip.website</strong> to{" "}
                          <strong className="text-foreground">{selectedEmail.fromAddress}</strong>
                        </span>
                        <button
                          onClick={() => setIsReplying(false)}
                          className="hover:text-foreground p-0.5 rounded cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply from contact@dilip.website..."
                        className="w-full text-xs p-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-h-[55px] max-h-[70px] resize-none"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setIsReplying(false)}
                          className="px-3 py-1 rounded-md text-xs font-medium hover:bg-secondary text-muted-foreground transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSendReply}
                          className="px-3.5 py-1 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                        >
                          Send Reply
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bottom Quick Reply Action Bar */}
                  <div className="px-4 py-3 border-t border-border bg-card flex items-center gap-2 flex-shrink-0 mt-auto">
                    <button
                      onClick={() => setIsReplying(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                    <button
                      onClick={() => setIsReplying(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-medium text-foreground transition-colors cursor-pointer"
                    >
                      <ReplyAll className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Reply All</span>
                    </button>
                    <button
                      onClick={() => setIsReplying(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-xs font-medium text-foreground transition-colors cursor-pointer"
                    >
                      <Forward className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Forward</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Feature Highlights ── */}
      <section id="features" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-border/50">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Core Capabilities</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-4">
            Everything You Need to Own Your Email
          </h2>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto">
            Engineered with enterprise security, edge ingestion speed, and clean typography.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Globe,
              title: "Instant Custom Domains",
              desc: "Attach your personal or organizational domains in seconds. Configure MX, SPF, DKIM, and DMARC with automatic validation and provision unlimited virtual mailboxes.",
            },
            {
              icon: Sliders,
              title: "Modern Split-Pane Reader",
              desc: "Experience fluid master-detail email browsing with resizable panes, remembered split preferences, and swift arrow/shortcut navigation.",
            },
            {
              icon: ShieldCheck,
              title: "Sandboxed Iframe Viewer",
              desc: "Render complex HTML newsletters safely. Isolated DOM calculation completely prevents malicious script execution and infinite height loops.",
            },
            {
              icon: Zap,
              title: "Cloudflare Edge Pipeline",
              desc: "Inbound emails stream directly into Cloudflare Email Routing Workers (workers/dmail-receiver), parsing MIME and storing records with sub-100ms latency.",
            },
            {
              icon: Lock,
              title: "PostgreSQL & RLS Security",
              desc: "Row-Level Security enforces strict data boundaries. Your messages, attachments, and credentials are authenticated directly against your Supabase database.",
            },
            {
              icon: Star,
              title: "Trusted Domain Auto-Starring",
              desc: "Intelligent built-in rules prioritize mail from trusted academic institutions (nitdelhi.ac.in), Google, Microsoft, and ProtonMail automatically.",
            },
          ].map((feature, i) => (
            <div
              key={feature.title}
              className="rounded-2xl p-6 border border-border bg-card/80 hover:border-primary/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 text-primary group-hover:scale-110 transition-transform">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Setup & Integration Workflow ── */}
      <section id="workflow" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-border/50">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            <span>Simple 3-Step Setup</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-4">
            Zero Server Headaches. Up in Minutes.
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            No Linux mail servers to patch, no spam blacklists to fight. Seamless edge routing does the heavy lifting.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {[
            {
              step: "01",
              title: "Add Your Domain",
              desc: "Point your custom domain DNS records (MX & TXT) to Cloudflare Email Routing. Verify domain ownership in your dashboard with one click.",
              badge: "DNS Setup",
            },
            {
              step: "02",
              title: "Configure Edge Worker",
              desc: "Deploy the included lightweight Cloudflare Worker (workers/dmail-receiver). It parses raw MIME payloads and securely streams them to Supabase.",
              badge: "Serverless Ingest",
            },
            {
              step: "03",
              title: "Manage & Send Mail",
              desc: "Log into the DMail webmail client. Send transactional or personal messages with SMTP/Nodemailer, receive real-time push updates, and search seamlessly.",
              badge: "Webmail Live",
            },
          ].map((step, i) => (
            <div
              key={step.step}
              className="relative rounded-2xl p-7 border border-border bg-card flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-black text-primary/30 font-mono">{step.step}</span>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-secondary text-muted-foreground">
                    {step.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/40 flex items-center gap-2 text-xs font-medium text-primary">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Fully Automated Pipeline</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Performance & Tech Stack Grid ── */}
      <section id="tech-stack" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto border-t border-border/50">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-secondary text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            <span>Engineered for Performance</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-3">
            Modern Cloud Architecture
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Powered by best-in-class open web technologies for uncompromised reliability and developer freedom.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { name: "Next.js 15", category: "Framework", desc: "React 19 App Router & SSR" },
            { name: "Supabase", category: "Database & Auth", desc: "PostgreSQL 15 with RLS" },
            { name: "Cloudflare", category: "Inbound Routing", desc: "Edge Workers & DNS" },
            { name: "Tailwind CSS", category: "Design Tokens", desc: "Dark & Light Mode" },
            { name: "Nodemailer", category: "Outbound Mail", desc: "Reliable SMTP Delivery" },
            { name: "PWA / Offline", category: "Progressive Web App", desc: "Offline Cache & Sync" },
          ].map((tech, i) => (
            <div
              key={tech.name}
              className="rounded-xl p-4 border border-border bg-card/60 text-center hover:border-primary/40 transition-colors"
            >
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider block mb-1">
                {tech.category}
              </span>
              <h4 className="font-bold text-sm text-foreground mb-1">{tech.name}</h4>
              <span className="text-[11px] text-muted-foreground block leading-tight">{tech.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final Call To Action ── */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <div className="rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/15 via-card to-card p-8 sm:p-14 shadow-sm relative overflow-hidden">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-4 tracking-tight">
              Ready to Own Your{" "}
              <span className="font-tangerine text-5xl sm:text-6xl font-bold text-primary dark:text-rose-400 inline-block px-1 tracking-normal">
                Custom Domain Mailbox?
              </span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-8 leading-relaxed">
              Experience the fast, private, and customizable webmail client built for your workflow.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all text-sm"
              >
                <span>Launch DMail Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/auth/sign-up"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl border border-border bg-secondary/80 hover:bg-secondary transition-colors text-sm font-medium text-foreground"
              >
                <span>Create Free Account</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/60 bg-card py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <img src="/icon.png" alt="DMail Logo" className="w-6 h-6 object-contain" />
            <span className="font-bold text-foreground text-sm">DMail</span>
            <span>&bull;</span>
            <span>Private Custom Domain Webmail Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#demo" className="hover:text-foreground transition-colors">
              Sandbox
            </a>
            <a href="#workflow" className="hover:text-foreground transition-colors">
              Setup
            </a>
            <Link href="/auth/login" className="hover:text-foreground transition-colors">
              Sign In
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-foreground font-medium">All Systems Operational</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
