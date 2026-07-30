/**
 * DMail Receiver — Cloudflare Email Routing Worker
 *
 * Receives raw MIME emails from Cloudflare Email Routing catch-all,
 * parses them with postal-mime, resolves the target mailbox via
 * Supabase RPC, uploads attachments, and inserts the email record.
 */

import PostalMime from "postal-mime";
import { createClient } from "@supabase/supabase-js";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface EmailMessage {
  readonly from: string;
  readonly to: string;
  readonly headers: Headers;
  readonly raw: ReadableStream;
  readonly rawSize: number;
  setReject(reason: string): void;
  forward(rcptTo: string, headers?: Headers): Promise<void>;
}

export default {
  async email(message: EmailMessage, env: Env): Promise<void> {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    try {
      // 1. Read and parse the raw MIME message
      const rawEmail = await streamToArrayBuffer(message.raw);
      const parser = new PostalMime();
      const parsed = await parser.parse(rawEmail);

      // 2. Extract threading headers
      const messageId = parsed.messageId || null;
      const inReplyTo = parsed.inReplyTo || null;
      const references = parsed.references
        ? parsed.references.split(/\s+/).filter(Boolean)
        : null;

      // 3. Resolve target mailbox via Supabase RPC
      const toAddress = message.to.toLowerCase();
      const { data: mailboxData, error: rpcError } = await supabase.rpc(
        "resolve_mailbox",
        { target_address: toAddress }
      );

      if (rpcError || !mailboxData || mailboxData.length === 0) {
        console.error(
          `[dmail-receiver] No mailbox found for ${toAddress}:`,
          rpcError
        );
        message.setReject("550 Mailbox not found");
        return;
      }

      const mailbox = mailboxData[0];

      // 4. Upload attachments to Supabase Storage
      const attachmentUrls: {
        filename: string;
        url: string;
        contentType: string;
        size: number;
      }[] = [];

      if (parsed.attachments && parsed.attachments.length > 0) {
        for (const att of parsed.attachments) {
          const filename = att.filename || `attachment_${Date.now()}`;
          const storagePath = `${mailbox.org_id}/${mailbox.mailbox_id}/${Date.now()}_${filename}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("dmail-attachments")
            .upload(storagePath, att.content, {
              contentType: att.mimeType || "application/octet-stream",
              upsert: false,
            });

          if (uploadError) {
            console.error(`[dmail-receiver] Attachment upload failed:`, uploadError);
            continue;
          }

          const {
            data: { publicUrl },
          } = supabase.storage
            .from("dmail-attachments")
            .getPublicUrl(storagePath);

          const contentAny = att.content as any;
          const size = contentAny?.byteLength ?? contentAny?.length ?? 0;

          attachmentUrls.push({
            filename,
            url: publicUrl,
            contentType: att.mimeType || "application/octet-stream",
            size,
          });
        }
      }

      // 5. Extract addresses
      const fromAddress = parsed.from?.name
        ? `${parsed.from.name} <${parsed.from.address || message.from}>`
        : parsed.from?.address || message.from || "unknown@unknown";
      const ccAddresses = parsed.cc
        ?.map((c: any) => (c.name ? `${c.name} <${c.address}>` : c.address))
        .filter(Boolean)
        .join(", ") || null;

      // 6. Insert email record
      const { error: insertError } = await supabase.from("emails").insert({
        org_id: mailbox.org_id,
        mailbox_id: mailbox.mailbox_id,
        message_id: messageId,
        in_reply_to: inReplyTo,
        references_header: references,
        from_address: fromAddress,
        to_address: toAddress,
        cc_address: ccAddresses,
        subject: parsed.subject || null,
        body_text: parsed.text || null,
        body_html: parsed.html || null,
        attachments: attachmentUrls.length > 0 ? attachmentUrls : [],
        folder: "inbox",
        is_read: false,
        is_starred: false,
        received_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error(`[dmail-receiver] Failed to insert email:`, insertError);
        message.setReject("451 Temporary failure");
        return;
      }

      console.log(
        `[dmail-receiver] Email from ${fromAddress} to ${toAddress} stored successfully`
      );
    } catch (err) {
      console.error(`[dmail-receiver] Unhandled error:`, err);
      message.setReject("451 Internal error");
    }
  },
};

async function streamToArrayBuffer(
  stream: ReadableStream
): Promise<ArrayBuffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    totalLength += value.byteLength;
  }

  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return result.buffer;
}
