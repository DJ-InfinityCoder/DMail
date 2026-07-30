import Link from "next/link";
import { ThemeToggle } from "@/components/theme-switcher";
import { PwaInstallButton } from "@/components/pwa-install-button";
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
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-[#8B1E2D] selection:text-white">
      {/* Navigation */}
      <nav className="w-full border-b border-border/40 bg-background/95 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-4 sm:px-6 h-16">
          <div className="flex items-center gap-2.5">
            <img src="/icon.png" alt="DMail Logo" className="w-7 h-7 object-contain" />
            <span className="text-xl font-bold tracking-tight text-[#8B1E2D]">
              DMail
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <PwaInstallButton variant="ghost" size="sm" showText={false} />
            <ThemeToggle variant="ghost" size="icon" />
            <Link
              href="/auth/login"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/login"
              className="text-sm px-4 py-2 rounded-lg bg-[#8B1E2D] text-white font-medium hover:bg-[#6E1522] transition-colors"
            >
              Access Portal
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#8B1E2D]/20 bg-[#8B1E2D]/5 text-xs font-medium text-[#8B1E2D] mb-6">
          <Sparkles className="w-3.5 h-3.5 text-[#8B1E2D]" />
          <span>Custom Domain Email System</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] mb-6 text-foreground">
          Your domain. <br />
          <span className="text-[#8B1E2D]">Your private inbox.</span> <br />
          Zero complex config.
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
          High-performance email platform for custom domains.
          Instant delivery with Resend API and Cloudflare Edge email routing.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg bg-[#8B1E2D] text-white font-medium hover:bg-[#6E1522] transition-colors text-sm"
          >
            Launch DMail
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="#features"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border bg-card hover:bg-secondary transition-colors text-sm font-medium"
          >
            Explore System
          </Link>
        </div>

        {/* Clean Mock Inbox Preview */}
        <div className="mt-14 max-w-4xl mx-auto">
          <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            {/* Window bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/40">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#8B1E2D]/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <div className="px-3 py-0.5 rounded bg-secondary text-xs font-mono text-muted-foreground">
                me@yourdomain.com
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </div>
            </div>

            {/* Mock inbox rows */}
            <div className="divide-y divide-border/30 text-left">
              {[
                { from: "Academic Office", subject: "Official Campus Notification & Updates", time: "Just now", unread: true },
                { from: "Cloudflare Router", subject: "Catch-All MX Active for yourdomain.com", time: "10m ago", unread: true },
                { from: "Resend Engine", subject: "Outbound Transactional Delivery Verified", time: "1h ago", unread: false },
                { from: "System Security", subject: "PostgreSQL Isolation & Row Security Active", time: "3h ago", unread: false },
              ].map((email, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 px-5 py-3 transition-colors ${email.unread ? "bg-[#8B1E2D]/[0.03]" : "hover:bg-secondary/40"}`}
                >
                  <div className={`w-2 h-2 rounded-full ${email.unread ? "bg-[#8B1E2D]" : "bg-transparent"}`} />
                  <span className={`text-sm w-44 truncate ${email.unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {email.from}
                  </span>
                  <span className={`text-sm flex-1 truncate ${email.unread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {email.subject}
                  </span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                    {email.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20 border-t border-border/40">
        <div className="text-center mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Built for Speed & Reliability
          </h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Powered by modern cloud infrastructure and strict access control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: Globe,
              title: "Custom Domain Mailboxes",
              desc: "Create and route multiple custom domain email addresses under a unified interface.",
            },
            {
              icon: Zap,
              title: "Resend Engine",
              desc: "Outbound emails delivered instantly through Resend API with top-tier IP reputation.",
            },
            {
              icon: Shield,
              title: "Cloudflare Inbound",
              desc: "Receives raw emails with Cloudflare Workers email routing and stores them safely in Supabase.",
            },
            {
              icon: Keyboard,
              title: "Keyboard-Driven UX",
              desc: "Navigate, compose, search, and manage your inbox with lightning fast keyboard shortcuts.",
            },
            {
              icon: MessageSquare,
              title: "Smart Threading",
              desc: "Automatic grouping by Message-ID, In-Reply-To, and References headers.",
            },
            {
              icon: Lock,
              title: "Restricted Access Control",
              desc: "Middleware authenticated and locked strictly to authorized credentials.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="rounded-xl p-5 border border-border bg-card hover:border-[#8B1E2D]/40 transition-colors shadow-sm"
            >
              <div className="w-10 h-10 rounded-lg bg-[#8B1E2D]/10 flex items-center justify-center mb-4 text-[#8B1E2D]">
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-base mb-1.5 text-foreground">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 bg-card">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">DMail</span>
          <span>Powered by Resend, Cloudflare & Supabase</span>
        </div>
      </footer>
    </main>
  );
}

