"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Plus,
  ArrowLeft,
  Check,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

interface MailboxItem {
  id: string;
  address: string;
  display_name: string | null;
  is_active: boolean | null;
  created_at: string | null;
  domain_id: string;
  org_id: string;
  domains: { domain_name: string; send_enabled: boolean | null } | null;
}

interface MailboxesManagerProps {
  mailboxes: MailboxItem[];
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

  const [mailboxToDelete, setMailboxToDelete] = useState<MailboxItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const router = useRouter();

  const selectedDomain = domains.find((d) => d.id === selectedDomainId) || domains[0];

  const handleLocalPartChange = (val: string) => {
    if (val.includes("@")) {
      const parts = val.split("@");
      const userPart = parts[0].trim();
      const domainPart = parts[1]?.trim().toLowerCase();
      setLocalPart(userPart);

      if (domainPart) {
        const matchedDomain = domains.find(
          (d) => d.domain_name.toLowerCase() === domainPart
        );
        if (matchedDomain) {
          setSelectedDomainId(matchedDomain.id);
        }
      }
    } else {
      setLocalPart(val);
    }
  };

  const addMailbox = async () => {
    const cleanLocal = localPart.trim().split("@")[0].toLowerCase();
    if (!cleanLocal) {
      setError("Please enter a valid email username");
      return;
    }
    if (!selectedDomain) {
      setError("Please select a domain");
      return;
    }

    setAdding(true);
    setError(null);

    const address = `${cleanLocal}@${selectedDomain.domain_name}`;

    try {
      const res = await fetch("/api/mailboxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          displayName: displayName.trim() || undefined,
          domainId: selectedDomain.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create mailbox");
      }

      setMailboxes((prev) => [
        {
          ...data.mailbox,
          domains: { domain_name: selectedDomain.domain_name, send_enabled: null },
        },
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

  const deleteMailbox = async (id: string) => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/mailboxes?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete mailbox");
      }

      setMailboxes((prev) => prev.filter((m) => m.id !== id));
      setMailboxToDelete(null);
      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete mailbox");
    } finally {
      setIsDeleting(false);
    }
  };

  const cleanPrefix = localPart.trim().split("@")[0] || "username";
  const previewAddress = `${cleanPrefix}@${selectedDomain?.domain_name ?? "yourdomain.com"}`;

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
            onClick={() => {
              setShowAddForm(true);
              setError(null);
            }}
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
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Email address
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={localPart}
                  onChange={(e) => handleLocalPartChange(e.target.value)}
                  placeholder="username"
                  className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary/50 transition-colors"
                  autoFocus
                />
                <span className="text-sm text-muted-foreground">@</span>
                <select
                  value={selectedDomain?.id ?? ""}
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

            {/* Address Preview */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 border border-border/40 text-xs">
              <span className="text-muted-foreground">Preview:</span>
              <span className="font-mono text-primary font-medium">{previewAddress}</span>
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

            <div className="flex gap-3 pt-1">
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
            <div key={mb.id} className="glass rounded-xl px-6 py-4 flex items-center gap-4 group hover:border-primary/30 transition-all">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                {mb.address[0]?.toUpperCase() || "M"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate font-mono">{mb.address}</h3>
                {mb.display_name && (
                  <p className="text-xs text-muted-foreground">{mb.display_name}</p>
                )}
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
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
                  <span className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
                    {mb.domains.domain_name}
                  </span>
                )}
                <button
                  onClick={() => {
                    setDeleteError(null);
                    setMailboxToDelete(mb);
                  }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Delete mailbox"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {mailboxToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="glass rounded-xl p-6 max-w-md w-full border border-border shadow-lg space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-destructive">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Delete Mailbox</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-foreground font-mono">
                {mailboxToDelete.address}
              </span>
              ? This action cannot be undone and will delete all emails and configuration associated with this mailbox.
            </p>

            {deleteError && (
              <p className="text-xs text-destructive bg-destructive/10 p-2 rounded-lg">
                {deleteError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setMailboxToDelete(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary/50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => deleteMailbox(mailboxToDelete.id)}
                className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Mailbox"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
