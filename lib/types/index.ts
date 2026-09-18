import type { Database, Tables, TablesInsert, TablesUpdate } from "./database";

// ──────────────────────────────────────────────
// Row types (convenience aliases)
// ──────────────────────────────────────────────
export type Organization = Tables<"organizations">;
export type Domain = Tables<"domains">;
export type Mailbox = Tables<"mailboxes">;
export type MailboxAlias = Tables<"mailbox_aliases">;
export type ForwardingRule = Tables<"forwarding_rules">;
export type Autoresponder = Tables<"autoresponders">;
export type Signature = Tables<"signatures">;
export type Email = Tables<"emails">;
export type EmailListItem = Omit<
  Email,
  "body_html" | "body_text" | "raw_headers" | "received_at" | "references_header" | "sent_at"
> & {
  body_html?: string | null;
  body_text?: string | null;
  raw_headers?: any;
  received_at?: string | null;
  references_header?: string[] | null;
  sent_at?: string | null;
};
export type EmailSend = Tables<"email_sends">;
export type OrgSendQuota = Tables<"org_send_quotas">;

// ──────────────────────────────────────────────
// Insert types
// ──────────────────────────────────────────────
export type EmailInsert = TablesInsert<"emails">;
export type DomainInsert = TablesInsert<"domains">;
export type MailboxInsert = TablesInsert<"mailboxes">;

// ──────────────────────────────────────────────
// Update types
// ──────────────────────────────────────────────
export type EmailUpdate = TablesUpdate<"emails">;
export type DomainUpdate = TablesUpdate<"domains">;

// ──────────────────────────────────────────────
// Composite / UI types
// ──────────────────────────────────────────────
export type MailboxWithDomain = Mailbox & {
  domains: Domain;
};

export type EmailThread = {
  threadId: string; // The root message_id
  subject: string;
  emails: Email[];
  lastMessageAt: string;
  isRead: boolean;
  isStarred: boolean;
};

export type ComposePayload = {
  mailboxId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  inReplyTo?: string;
  references?: string[];
  attachments?: File[];
};

export type FolderType =
  | "inbox"
  | "sent"
  | "drafts"
  | "trash"
  | "archive"
  | "starred";

export type DnsStatus = "pending" | "valid" | "invalid";

export type DomainVerificationResult = {
  mx_status: DnsStatus;
  spf_status: DnsStatus;
  dkim_status: DnsStatus;
  dmarc_status: DnsStatus;
  send_enabled: boolean;
};

// Re-export database types
export type { Database, Tables, TablesInsert, TablesUpdate };
