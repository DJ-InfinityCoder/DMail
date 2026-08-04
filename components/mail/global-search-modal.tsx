"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Mail, User, Paperclip, Calendar, ArrowRight, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Email } from "@/lib/types";

interface GlobalSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
}

const filterOperators = [
  { label: "is:unread", value: "is:unread", icon: Mail },
  { label: "has:attachment", value: "has:attachment", icon: Paperclip },
  { label: "from:", value: "from:", icon: User },
  { label: "to:", value: "to:", icon: User },
];

export function GlobalSearchModal({ open, onOpenChange, orgId }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Email[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Load recent searches from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("dmail_recent_searches");
        if (saved) setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load recent searches", e);
      }
    }
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults([]);
    }
  }, [open]);

  // Debounced search query execution against Supabase
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        let q = supabase
          .from("emails")
          .select("*")
          .eq("org_id", orgId)
          .order("received_at", { ascending: false })
          .limit(15);

        const cleanQuery = query.toLowerCase();

        if (cleanQuery.includes("is:unread")) {
          q = q.eq("is_read", false);
        }

        // Standard text search on subject or body
        const searchText = cleanQuery.replace(/is:unread|has:attachment|from:\S+|to:\S+/gi, "").trim();
        if (searchText) {
          q = q.or(`subject.ilike.%${searchText}%,body_text.ilike.%${searchText}%,from_address.ilike.%${searchText}%`);
        }

        const { data, error } = await q;
        if (!error && data) {
          setResults(data as Email[]);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, orgId, supabase]);

  const saveSearchToHistory = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("dmail_recent_searches", JSON.stringify(updated));
    }
  };

  const handleSelectEmail = (email: Email) => {
    if (query.trim()) saveSearchToHistory(query.trim());
    onOpenChange(false);
    router.push(`/mail/${email.folder ?? "inbox"}/${email.id}`);
  };

  const addOperator = (op: string) => {
    setQuery((prev) => (prev ? `${prev} ${op}` : op));
    inputRef.current?.focus();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl mx-4 glass-card shadow-2xl overflow-hidden animate-slide-in-up z-10 flex flex-col max-h-[80vh]">
        {/* Search Bar Input */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border/50 bg-card">
          <Search className="w-5 h-5 text-[#8B1E2D] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            placeholder="Search emails, contacts, or subject (e.g. is:unread invoices)..."
          />
          {loading && (
            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin flex-shrink-0" />
          )}
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Operators Bar */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-secondary/30 border-b border-border/30 overflow-x-auto scrollbar-none">
          <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">
            Filter:
          </span>
          {filterOperators.map((op) => (
            <button
              key={op.value}
              onClick={() => addOperator(op.value)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-xs font-mono text-foreground/90 transition-colors whitespace-nowrap"
            >
              <op.icon className="w-3 h-3 text-[#8B1E2D]" />
              <span>{op.label}</span>
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/30">
          {!query && recentSearches.length > 0 && (
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-2">
                <History className="w-3.5 h-3.5 text-[#8B1E2D]" />
                <span>Recent Searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1 rounded-lg bg-secondary/60 hover:bg-secondary text-xs text-foreground/90 transition-colors font-mono"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && results.length === 0 && !loading && (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-sm font-medium">No emails matching "{query}"</p>
              <p className="text-xs text-muted-foreground/75 mt-1">
                Try searching for a different keyword or operator.
              </p>
            </div>
          )}

          {results.map((email) => (
            <div
              key={email.id}
              onClick={() => handleSelectEmail(email)}
              className="flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 cursor-pointer transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#8B1E2D]/10 text-[#8B1E2D] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {email.from_address.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className="text-xs font-bold text-foreground truncate">
                    {email.from_address}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {email.folder}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-foreground/90 truncate">
                  {email.subject ?? "(no subject)"}
                </h4>
                <p className="text-[11px] text-muted-foreground truncate">
                  {email.body_text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 border-t border-border/40 bg-card/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Navigate results & press Enter to open</span>
          <span className="font-mono kbd">ESC to close</span>
        </div>
      </div>
    </div>
  );
}
