import { cn, getURL } from "@/lib/utils";

describe("lib/utils", () => {
  describe("cn", () => {
    it("combines class names correctly", () => {
      expect(cn("px-2", "py-1")).toBe("px-2 py-1");
    });

    it("resolves conflicting tailwind classes with twMerge", () => {
      expect(cn("p-2", "p-4")).toBe("p-4");
      expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
    });

    it("handles conditional classes and falsy values", () => {
      expect(cn("btn", false && "hidden", null, undefined, "btn-primary")).toBe(
        "btn btn-primary"
      );
    });
  });

  describe("getURL", () => {
    it("appends paths properly with leading slash", () => {
      const url = getURL("/mail/inbox");
      expect(url).toMatch(/\/mail\/inbox$/);
      expect(url).not.toContain("//mail");
    });

    it("handles paths without a leading slash", () => {
      const url = getURL("mail/sent");
      expect(url).toMatch(/\/mail\/sent$/);
    });

    it("returns root url when path is empty", () => {
      const url = getURL();
      expect(url).not.toMatch(/\/$/);
      expect(url).toMatch(/^https?:\/\//);
    });
  });
});
