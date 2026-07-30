"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Plus,
  ArrowLeft,
  Check,
} from "lucide-react";
import Link from "next/link";

interface MailboxesManagerProps {
  mailboxes: {
    id: string;
    address: string;
    display_name: string | null;
    is_active: boolean | null;
    created_at: string | null;
    domain_id: string;
    org_id: string;
    domains: { domain_name: string; send_enabled: boolean | null } | null;
  }[];
  domains: { id: string; domain_name: string }[];
}

export function MailboxesManager({
  mailboxes: initialMailboxes,
  domains,
}: MailboxesManagerProps) {
  const [mailboxes, setMailboxes] = useState(initialMailboxes);

  // Sync state if initialMailboxes changes
  useEffect(() => {
    setMailboxes(initialMailboxes);
  }, [initialMailboxes]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [localPart, setLocalPart] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedDomainId, setSelectedDomainId] = useState(domains[0]?.id ?? "");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const selectedDomain = domains.find((d) => d.id === selectedDomainId);

  const addMailbox = async () => {
    if (!localPart.trim() || !selectedDomainId) return;
    setAdding(true);
    setError(null);

    const address = `${localPart.trim().toLowerCase()}@${selectedDomain?.domain_name ?? ""}`;

    try {
      const res = await fetch("/api/mailboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          displayName: displayName.trim() || undefined,
          domainId: selectedDomainId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setMailboxes((prev) => [
        { ...data.mailbox, domains: selectedDomain ? { domain_name: selectedDomain.domain_name, send_enabled: null } : null },
        ...prev,
      ]);
      setLocalPart("");
      setDisplayName("");
      setShowAddForm(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/mail/settings"
          className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Mailboxes</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage email addresses.
          </p>
        </div>
        <div className="flex-1" />
        {domains.length > 0 && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            Add Mailbox
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="glass rounded-xl p-6 mb-6 animate-slide-in-up">
          <h3 className="font-semibold mb-4">Create a new mailbox</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Email address
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={localPart}
                  onChange={(e) => setLocalPart(e.target.value)}
                  placeholder="hello"
                  className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary/50 transition-colors"
                  autoFocus
                />
                <span className="text-sm text-muted-foreground">@</span>
                <select
                  value={selectedDomainId}
                  onChange={(e) => setSelectedDomainId(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary/50 transition-colors"
                >
                  {domains.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.domain_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Display name (optional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary/50 transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={addMailbox}
                disabled={adding || !localPart.trim()}
                className="px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {adding ? "Creating..." : "Create Mailbox"}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setLocalPart("");
                  setDisplayName("");
                  setError(null);
                }}
                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mailbox list */}
      {domains.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold mb-2">Add a domain first</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You need to add and verify a domain before creating mailboxes.
          </p>
          <Link
            href="/mail/settings/domains"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90"
          >
            Go to Domains
          </Link>
        </div>
      ) : mailboxes.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold mb-2">No mailboxes yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first email address.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Add Mailbox
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {mailboxes.map((mb) => (
            <div key={mb.id} className="glass rounded-xl px-6 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                {mb.address[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate">{mb.address}</h3>
                {mb.display_name && (
                  <p className="text-xs text-muted-foreground">{mb.display_name}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {mb.is_active ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-medium">
                    <Check className="w-3 h-3" /> Active
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-medium">
                    Inactive
                  </span>
                )}
                {mb.domains?.domain_name && (
                  <span className="text-[10px] text-muted-foreground">
                    {mb.domains.domain_name}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
