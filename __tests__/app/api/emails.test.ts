/**
 * @jest-environment node
 */
import { GET } from "@/app/api/emails/route";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("GET /api/emails", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 Unauthorized if user is not authenticated", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
        }),
      },
    });

    const req = new NextRequest("http://localhost:3000/api/emails");
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toEqual({ error: "Unauthorized" });
  });

  it("returns 404 if user has no organization", async () => {
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
        }),
      },
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/emails");
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ error: "No organization found" });
  });

  it("returns emails list when authenticated and org exists", async () => {
    const mockEmails = [
      { id: "email-1", subject: "Welcome to DMail", is_starred: false },
    ];

    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      then: (resolve: (val: unknown) => void) =>
        resolve({ data: mockEmails, error: null }),
    };

    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: "user-123" } },
        }),
      },
      from: jest.fn((table: string) => {
        if (table === "organizations") {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest
              .fn()
              .mockResolvedValue({ data: { id: "org-456" }, error: null }),
          };
        }
        return mockQueryBuilder;
      }),
    });

    const req = new NextRequest("http://localhost:3000/api/emails?folder=inbox");
    const response = await GET(req);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ emails: mockEmails });
  });
});
