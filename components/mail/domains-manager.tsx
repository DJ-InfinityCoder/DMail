"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Plus,
  RefreshCw,
  Check,
  X,
  Clock,
  Copy,
  ArrowLeft,
} from "lucide-react";
import type { Domain } from "@/lib/types";
import Link from "next/link";

interface DomainsManagerProps {
  domains: Domain[];
  orgId: string;
}

function StatusBadge({ status, label }: { status: string | null; label?: string }) {
  const prefix = label ? `${label}: ` : "";
  if (status === "valid") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-medium">
        <Check className="w-3 h-3" /> {prefix}Valid
      </span>
    );
  }
  if (status === "invalid") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 text-[10px] font-medium">
        <X className="w-3 h-3" /> {prefix}Invalid
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-medium">
      <Clock className="w-3 h-3" /> {prefix}Pending
    </span>
  );
}

function DnsRecordCard({
  type,
  host,
  value,
  priority,
  purpose,
  status,
}: {
  type: string;
  host: string;
  value: string;
  priority?: number;
  purpose: string;
  status?: string | null;
}) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (field: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="glass rounded-xl p-5 text-sm space-y-3">
      <div className="flex items-center justify-between border-b border-border/20 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs uppercase px-2 py-0.5 rounded bg-primary/20 text-primary">
            {type}
          </span>
          <span className="font-semibold text-foreground text-xs">{purpose}</span>
        </div>
        {status !== undefined && <StatusBadge status={status} />}
      </div>

      <div className="space-y-2 text-xs">
        {/* Name / Host */}
        <div className="flex items-center justify-between bg-secondary/30 p-2 rounded-lg">
          <div>
            <span className="text-muted-foreground block text-[10px]">Name / Host</span>
            <code className="text-foreground font-mono font-medium">{host}</code>
          </div>
          <button
            onClick={() => copyToClipboard("host", host)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Copy Host"
          >
            {copiedField === "host" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Value */}
        <div className="flex items-center justify-between bg-secondary/30 p-2 rounded-lg">
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-muted-foreground block text-[10px]">Target / Value</span>
            <code className="text-foreground font-mono font-medium break-all">{value}</code>
          </div>
          <button
            onClick={() => copyToClipboard("value", value)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            title="Copy Value"
          >
            {copiedField === "value" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Priority if applicable */}
        {priority !== undefined && (
          <div className="flex items-center justify-between bg-secondary/30 p-2 rounded-lg">
            <div>
              <span className="text-muted-foreground block text-[10px]">Priority</span>
              <code className="text-foreground font-mono font-medium">{priority}</code>
            </div>
            <button
              onClick={() => copyToClipboard("priority", priority.toString())}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              title="Copy Priority"
            >
              {copiedField === "priority" ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function DomainsManager({ domains: initialDomains, orgId }: DomainsManagerProps) {
  const [domains, setDomains] = useState(initialDomains);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [expandedDomain, setExpandedDomain] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const addDomain = async () => {
    if (!newDomain.trim()) return;
    setAdding(true);
    setError(null);

    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainName: newDomain.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setDomains((prev) => [data.domain, ...prev]);
      setNewDomain("");
      setShowAddForm(false);
      setExpandedDomain(data.domain.id);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const verifyDomain = useCallback(async (domainId: string) => {
    setVerifying(domainId);
    try {
      const res = await fetch("/api/domains/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setDomains((prev) =>
        prev.map((d) =>
          d.id === domainId
            ? {
                ...d,
                mx_status: data.mx_status,
                spf_status: data.spf_status,
                dkim_status: data.dkim_status,
                dmarc_status: data.dmarc_status,
                send_enabled: data.send_enabled,
                is_verified: data.is_verified,
                last_dns_check_at: new Date().toISOString(),
              }
            : d
        )
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVerifying(null);
    }
  }, []);

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
          <h1 className="text-2xl font-bold">Domains</h1>
          <p className="text-sm text-muted-foreground">
            Add and verify custom domains for email.
          </p>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Domain
        </button>
      </div>

      {/* Add domain form */}
      {showAddForm && (
        <div className="glass rounded-xl p-6 mb-6 animate-slide-in-up">
          <h3 className="font-semibold mb-4">Add a new domain</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDomain()}
              placeholder="example.com"
              className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-primary/50 transition-colors"
              autoFocus
            />
            <button
              onClick={addDomain}
              disabled={adding || !newDomain.trim()}
              className="px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {adding ? "Adding..." : "Add"}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewDomain("");
                setError(null);
              }}
              className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary/50 transition-colors"
            >
              Cancel
            </button>
          </div>
          {error && (
            <p className="text-xs text-destructive mt-2">{error}</p>
          )}
        </div>
      )}

      {/* Domain list */}
      {domains.length === 0 ? (
        <div className="glass rounded-xl p-12 text-center">
          <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold mb-2">No domains yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your first custom domain to start sending and receiving emails.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-white text-sm font-medium hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            Add Domain
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {domains.map((domain) => (
            <div key={domain.id} className="glass rounded-xl overflow-hidden">
              {/* Domain row */}
              <div
                className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={() =>
                  setExpandedDomain(
                    expandedDomain === domain.id ? null : domain.id
                  )
                }
              >
                <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{domain.domain_name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>DNS Status:</span>
                    <StatusBadge
                      status={domain.is_verified ? "valid" : "pending"}
                      label="Overall"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {domain.send_enabled && (
                    <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-semibold">
                      Sending Enabled
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      verifyDomain(domain.id);
                    }}
                    disabled={verifying === domain.id}
                    className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    title="Verify DNS"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${
                        verifying === domain.id ? "animate-spin" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Expanded: DNS instructions */}
              {expandedDomain === domain.id && (
                <div className="px-6 pb-6 pt-4 border-t border-border/20 animate-slide-in-up space-y-6">
                  {/* Step-by-step guide */}
                  <div className="bg-secondary/20 rounded-xl p-4 border border-border/30">
                    <h4 className="text-sm font-semibold mb-2 text-foreground">
                      📋 Professional Step-by-Step Domain Setup Guide
                    </h4>
                    <ol className="list-decimal list-inside space-y-1.5 text-xs text-muted-foreground">
                      <li>Log in to <strong>Cloudflare DNS</strong> (for Inbound Emails).</li>
                      <li>Add the <strong>Cloudflare Email Routing MX & TXT records</strong> shown below.</li>
                      <li>Log in to your <strong>Resend Dashboard</strong> (for Outbound Emails).</li>
                      <li>Add <code className="text-foreground font-mono">{domain.domain_name}</code> under Resend Domains, copy the <strong>DKIM TXT record</strong>, and paste it into Cloudflare DNS.</li>
                      <li>Combined SPF value for Cloudflare + Resend: <code className="text-foreground font-mono">v=spf1 include:_spf.mx.cloudflare.net include:amazonses.com ~all</code></li>
                    </ol>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-foreground">
                      Required DNS Records & Status
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <DnsRecordCard
                        type="MX"
                        purpose="Inbound Mail (Cloudflare)"
                        host="@ (or root)"
                        value="isaac.mx.cloudflare.net"
                        priority={10}
                        status={domain.mx_status}
                      />
                      <DnsRecordCard
                        type="TXT"
                        purpose="Combined SPF (Cloudflare + Resend)"
                        host="@ (or root)"
                        value="v=spf1 include:_spf.mx.cloudflare.net include:amazonses.com ~all"
                        status={domain.spf_status}
                      />
                      <DnsRecordCard
                        type="TXT"
                        purpose="DMARC Security Policy"
                        host={`_dmarc.${domain.domain_name}`}
                        value={`v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain.domain_name}`}
                        status={domain.dmarc_status}
                      />
                      <DnsRecordCard
                        type="TXT"
                        purpose="Resend Outbound DKIM"
                        host={`resend._domainkey.${domain.domain_name}`}
                        value="Get from Resend Dashboard -> Domains"
                        status="valid"
                      />
                      <DnsRecordCard
                        type="TXT"
                        purpose="Domain Verification Token"
                        host="@ (or root)"
                        value={`dmail-verify=${domain.verification_token}`}
                        status={domain.is_verified ? "valid" : "pending"}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/20">
                    💡 <strong>Tip:</strong> If your DNS provider asks for "Host" or "Name", enter <code className="text-foreground font-mono">@</code> for the root domain or leave it blank depending on your provider.
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
