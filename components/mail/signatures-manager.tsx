"use client";

import { useState, useEffect } from "react";
import { PenTool, Check, Plus, Trash2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Mailbox, Signature } from "@/lib/types";
import Link from "next/link";

interface SignaturesManagerProps {
  mailboxes: Mailbox[];
}

export function SignaturesManager({ mailboxes }: SignaturesManagerProps) {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [selectedMailboxId, setSelectedMailboxId] = useState<string>(
    mailboxes[0]?.id ?? ""
  );
  const [htmlBody, setHtmlBody] = useState("");
  const [isDefault, setIsDefault] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadSignatures() {
      if (!selectedMailboxId) return;
      const { data } = await supabase
        .from("signatures")
        .select("*")
        .eq("mailbox_id", selectedMailboxId);

      if (data && data.length > 0) {
        setSignatures(data as Signature[]);
        setHtmlBody(data[0].html_body ?? "");
        setIsDefault(!!data[0].is_default);
      } else {
        setHtmlBody("");
        setIsDefault(true);
      }
    }
    loadSignatures();
  }, [selectedMailboxId, supabase]);

  const handleSave = async () => {
    if (!selectedMailboxId) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      const existing = signatures.find((s) => s.mailbox_id === selectedMailboxId);

      if (existing) {
        await supabase
          .from("signatures")
          .update({
            html_body: htmlBody,
            is_default: isDefault,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("signatures").insert({
          mailbox_id: selectedMailboxId,
          html_body: htmlBody,
          is_default: isDefault,
        });
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (e) {
      console.error("Save signature error", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass rounded-xl p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <PenTool className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold">Signatures</h2>
          <p className="text-xs text-muted-foreground">
            Configure custom HTML signatures per mailbox address.
          </p>
        </div>
      </div>

      {/* Select Mailbox */}
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">
            Select Mailbox
          </label>
          <select
            value={selectedMailboxId}
            onChange={(e) => setSelectedMailboxId(e.target.value)}
            className="w-full max-w-xs px-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none font-mono"
          >
            {mailboxes.map((mb) => (
              <option key={mb.id} value={mb.id}>
                {mb.address}
              </option>
            ))}
          </select>
        </div>

        {/* HTML Body Editor */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground block mb-1">
            HTML Signature Body
          </label>
          <textarea
            value={htmlBody}
            onChange={(e) => setHtmlBody(e.target.value)}
            placeholder="<p>Best regards,<br/><b>Your Name</b></p>"
            className="w-full min-h-[120px] p-3 rounded-lg bg-secondary/30 border border-border text-sm font-mono outline-none resize-y"
          />
        </div>

        {/* Signature Live Preview */}
        {htmlBody && (
          <div className="p-4 rounded-lg bg-card border border-border/50">
            <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-2">
              Live Preview
            </span>
            <div
              className="text-sm font-sans text-foreground"
              dangerouslySetInnerHTML={{ __html: htmlBody }}
            />
          </div>
        )}

        {/* Save button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#8B1E2D] text-white text-xs font-bold hover:bg-[#6E1522] transition-colors disabled:opacity-50"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                Saved!
              </>
            ) : saving ? (
              "Saving..."
            ) : (
              "Save Signature"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
