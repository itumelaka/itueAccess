import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const getCookie = vi.fn();
  const maybeSingle = vi.fn();
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  const createSupabaseAdminClient = vi.fn(() => ({ from }));

  return {
    createSupabaseAdminClient,
    eq,
    from,
    getCookie,
    maybeSingle,
    select,
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: mocks.getCookie }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createSupabaseAdminClient,
}));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.eq.mockImplementation(() => ({ maybeSingle: mocks.maybeSingle }));
  mocks.select.mockImplementation(() => ({ eq: mocks.eq }));
  mocks.from.mockImplementation(() => ({ select: mocks.select }));
  mocks.createSupabaseAdminClient.mockImplementation(() => ({
    from: mocks.from,
  }));
});

describe("GET /api/guest/session", () => {
  it("returns an empty session without creating an admin client when no cookie exists", async () => {
    mocks.getCookie.mockReturnValue(undefined);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, visit: null });
    expect(mocks.createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("returns only safe active-visit fields for a valid session", async () => {
    mocks.getCookie.mockReturnValue({ value: "opaque-cookie-token" });
    mocks.maybeSingle.mockResolvedValue({
      data: {
        expires_at: "2099-07-29T00:00:00.000Z",
        visits: {
          id: "visit-1",
          guest_name: "Tetamu Satu",
          check_in_at: "2026-07-29T00:00:00.000Z",
          check_out_at: null,
          locations: { name: "Auditorium" },
        },
      },
      error: null,
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      visit: {
        id: "visit-1",
        name: "Tetamu Satu",
        locationName: "Auditorium",
        checkInAt: "2026-07-29T00:00:00.000Z",
      },
    });
    expect(JSON.stringify(body)).not.toContain("opaque-cookie-token");
    expect(JSON.stringify(body)).not.toContain("token_hash");
    expect(mocks.from).toHaveBeenCalledWith("guest_self_service_tokens");
  });

  it("treats expired or completed sessions as empty", async () => {
    mocks.getCookie.mockReturnValue({ value: "expired-token" });
    mocks.maybeSingle.mockResolvedValue({
      data: {
        expires_at: "2020-01-01T00:00:00.000Z",
        visits: {
          id: "visit-2",
          guest_name: "Tetamu Lama",
          check_in_at: "2020-01-01T00:00:00.000Z",
          check_out_at: null,
          locations: { name: "Auditorium" },
        },
      },
      error: null,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, visit: null });
  });
});
