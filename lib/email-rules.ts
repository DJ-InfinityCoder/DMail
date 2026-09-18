/**
 * List of trusted public email services and verified institutional domains.
 * Emails received from these domains are automatically starred by default.
 */
export const TRUSTED_STARRED_DOMAINS = [
  // Institutional & requested domains:
  "nitdelhi.ac.in", // National Institute of Technology Delhi
  "gmail.com",      // Google Mail
  "googlemail.com", // Google Mail (UK/EU)
  "outlook.com",    // Microsoft Outlook
  "outlook.in",     // Microsoft Outlook India
  "proton.me",      // Proton Mail
  "protonmail.com", // Proton Mail
  "pm.me",          // Proton Mail short domain


  // Microsoft Webmail Services:
  "hotmail.com",
  "hotmail.in",
  "live.com",
  "msn.com",

  // Apple Mail Services:
  "icloud.com",
  "me.com",
  "mac.com",

  // Yahoo & Zoho Webmail:
  "yahoo.com",
  "yahoo.in",
  "yahoo.co.in",
  "ymail.com",
  "zoho.com",
  "zoho.in",
  "aol.com",
] as const;

export type TrustedStarredDomain = (typeof TRUSTED_STARRED_DOMAINS)[number];

/**
 * Determines whether an incoming email should be automatically marked as starred.
 * Supports names with angle brackets (e.g. "Dilip <dev@nitdelhi.ac.in>")
 * and institutional subdomains (e.g. "cs.nitdelhi.ac.in").
 */
export function shouldAutoStarEmail(fromAddress: string | null | undefined): boolean {
  if (!fromAddress) return false;

  const match = fromAddress.match(/<([^>]+)>/);
  const email = (match ? match[1] : fromAddress).trim().toLowerCase();

  const atIndex = email.lastIndexOf("@");
  if (atIndex === -1) return false;

  const domain = email.slice(atIndex + 1).trim();
  if (!domain) return false;

  return TRUSTED_STARRED_DOMAINS.some(
    (trusted) => domain === trusted || domain.endsWith(`.${trusted}`)
  );
}
