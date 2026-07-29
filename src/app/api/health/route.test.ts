import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const limit = vi.fn();
  const select = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ select }));
  const createSupabaseAdminClient = vi.fn(() => ({ from }));

  return { createSupabaseAdminClient, from, select, limit };
});

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createSupabaseAdminClient,
}));

import { GET } from "./route";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.select.mockImplementation(() => ({ limit: mocks.limit }));
    mocks.from.mockImplementation(() => ({ select: mocks.select }));
    mocks.createSupabaseAdminClient.mockImplementation(() => ({
      from: mocks.from,
    }));
  });

  it("uses the admin client and returns 200 when the database query succeeds", async () => {
    mocks.limit.mockResolvedValue({ error: null });

    const response = await GET();
    const body = await response.json();

    expect(mocks.createSupabaseAdminClient).toHaveBeenCalledOnce();
    expect(mocks.from).toHaveBeenCalledWith("locations");
    expect(mocks.select).toHaveBeenCalledWith("id");
    expect(mocks.limit).toHaveBeenCalledWith(1);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(body).toMatchObject({ app: "ok", database: "ok" });
    expect(body.checkedAt).toEqual(expect.any(String));
  });

  it("returns a sanitised 503 when the database query fails", async () => {
    mocks.limit.mockResolvedValue({
      error: {
        code: "42501",
        message: "permission denied with sensitive database detail",
        details: "internal schema information",
        hint: "secret diagnostic hint",
      },
    });

    const response = await GET();
    const body = await response.json();
    const serialisedBody = JSON.stringify(body);

    expect(response.status).toBe(503);
    expect(body).toMatchObject({ app: "ok", database: "error" });
    expect(body.checkedAt).toEqual(expect.any(String));
    expect(Object.keys(body).sort()).toEqual(["app", "checkedAt", "database"]);
    expect(serialisedBody).not.toContain("42501");
    expect(serialisedBody).not.toContain("permission denied");
    expect(serialisedBody).not.toContain("internal schema");
    expect(serialisedBody).not.toContain("secret diagnostic");
  });
});