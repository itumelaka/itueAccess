import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const getCookie = vi.fn();
  const hashGuestSessionToken = vi.fn(() => "hashed-session-token");
  const rpc = vi.fn();
  const createSupabaseAdminClient = vi.fn(() => ({ rpc }));
  const syncArchivePayload = vi.fn().mockResolvedValue({ ok: true });
  const archiveGuestMovement = vi.fn(() => ({
    sheetName: "TETAMU",
    values: [],
  }));

  return {
    archiveGuestMovement,
    createSupabaseAdminClient,
    getCookie,
    hashGuestSessionToken,
    rpc,
    syncArchivePayload,
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: mocks.getCookie }),
}));

vi.mock("@/features/guests/self-service", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/features/guests/self-service")>();
  return {
    ...original,
    hashGuestSessionToken: mocks.hashGuestSessionToken,
  };
});

vi.mock("@/features/spreadsheet/archive-sync", () => ({
  archiveGuestMovement: mocks.archiveGuestMovement,
  syncArchivePayload: mocks.syncArchivePayload,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createSupabaseAdminClient,
}));

import { POST } from "./route";

const visit = {
  id: "visit-1",
  check_in_at: "2026-07-29T00:00:00.000Z",
  check_out_at: "2026-07-29T01:00:00.000Z",
  guest_name: "Tetamu Satu",
  guest_organization: "Jabatan ITU",
  guest_purpose: "Mesyuarat",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.createSupabaseAdminClient.mockImplementation(() => ({
    rpc: mocks.rpc,
  }));
});

describe("POST /api/guest/check-out", () => {
  it("rejects checkout when the HttpOnly guest session cookie is absent", async () => {
    mocks.getCookie.mockReturnValue(undefined);

    const response = await POST();

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Sesi tetamu tidak ditemui.",
    });
    expect(mocks.createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("checks out, archives once and clears the guest session cookie", async () => {
    mocks.getCookie.mockReturnValue({ value: "opaque-cookie-token" });
    mocks.rpc.mockImplementation(
      async (
        _name: string,
        args: { p_request_id: string; p_token_hash: string },
      ) => ({
        data: {
          ...visit,
          check_out_request_id: args.p_request_id,
        },
        error: null,
      }),
    );

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(JSON.stringify(body)).not.toContain("opaque-cookie-token");
    expect(mocks.rpc).toHaveBeenCalledWith("check_out_guest_self_service", {
      p_token_hash: "hashed-session-token",
      p_request_id: expect.any(String),
    });
    expect(mocks.syncArchivePayload).toHaveBeenCalledOnce();
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("does not duplicate the archive event for an idempotent checkout retry", async () => {
    mocks.getCookie.mockReturnValue({ value: "opaque-cookie-token" });
    mocks.rpc.mockResolvedValue({
      data: {
        ...visit,
        check_out_request_id: "an-earlier-request-id",
      },
      error: null,
    });

    const response = await POST();

    expect(response.status).toBe(200);
    expect(mocks.syncArchivePayload).not.toHaveBeenCalled();
  });
});
