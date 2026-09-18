import { shouldAutoStarEmail, TRUSTED_STARRED_DOMAINS } from "@/lib/email-rules";

describe("lib/email-rules", () => {
  describe("shouldAutoStarEmail", () => {
    it("auto-stars emails from explicitly requested domains", () => {
      expect(shouldAutoStarEmail("user@gmail.com")).toBe(true);
      expect(shouldAutoStarEmail("Dilip Kumar <student@nitdelhi.ac.in>")).toBe(true);
      expect(shouldAutoStarEmail("faculty@cs.nitdelhi.ac.in")).toBe(true);
      expect(shouldAutoStarEmail("user@outlook.com")).toBe(true);
      expect(shouldAutoStarEmail("user@outlook.in")).toBe(true);
      expect(shouldAutoStarEmail("privacy@proton.me")).toBe(true);
      expect(shouldAutoStarEmail("secure@protonmail.com")).toBe(true);
      expect(shouldAutoStarEmail("short@pm.me")).toBe(true);
    });

    it("auto-stars emails from trusted public providers", () => {
      expect(shouldAutoStarEmail("user@hotmail.com")).toBe(true);
      expect(shouldAutoStarEmail("user@icloud.com")).toBe(true);
      expect(shouldAutoStarEmail("user@yahoo.com")).toBe(true);
      expect(shouldAutoStarEmail("user@zoho.com")).toBe(true);
    });

    it("does not auto-star marketing or spam domains", () => {
      expect(shouldAutoStarEmail("marketing@comms.aiven.io")).toBe(false);
      expect(shouldAutoStarEmail("news@promotions.store.com")).toBe(false);
      expect(shouldAutoStarEmail("spam@randomdomain.xyz")).toBe(false);
      expect(shouldAutoStarEmail("")).toBe(false);
      expect(shouldAutoStarEmail(null)).toBe(false);
      expect(shouldAutoStarEmail(undefined)).toBe(false);
    });

    it("handles complex sender strings with display names", () => {
      expect(
        shouldAutoStarEmail('"NIT Delhi Admin" <admin@nitdelhi.ac.in>')
      ).toBe(true);
      expect(
        shouldAutoStarEmail('"Personal Gmail" <myfriend@gmail.com>')
      ).toBe(true);
    });
  });

  describe("TRUSTED_STARRED_DOMAINS", () => {
    it("contains all critical domains", () => {
      expect(TRUSTED_STARRED_DOMAINS).toContain("nitdelhi.ac.in");
      expect(TRUSTED_STARRED_DOMAINS).toContain("gmail.com");
      expect(TRUSTED_STARRED_DOMAINS).toContain("outlook.com");
      expect(TRUSTED_STARRED_DOMAINS).toContain("outlook.in");
      expect(TRUSTED_STARRED_DOMAINS).toContain("proton.me");
    });
  });
});
