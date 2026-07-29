import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const verifyTurnstile = vi.fn();
  const createGuestSessionToken = vi.fn(() => "opaque-session-token");
  const hashGuestSessionToken = vi.fn(() => "hashed-session-token");
  const syncArchivePayload = vi.fn().mockResolvedValue({ ok: true });
  const archiveGuestMovement = vi.fn(() => ({
    sheetName: "TETAMU",
    values: [],
  }));
  const previousVisit = vi.fn();
  const visitQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    maybeSingle: previousVisit,
  };
  visitQuery.select.mockReturnValue(visitQuery);
  visitQuery.eq.mockReturnValue(visitQuery);
  const locationSingle = vi.fn();
  const locationQuery = {
    select: vi.fn(),
    eq: vi.fn(),
    single: locationSingle,
  };
  locationQuery.select.mockReturnValue(locationQuery);
  locationQuery.eq.mockReturnValue(locationQuery);
  const rpc = vi.fn();
  const from = vi.fn((table: string) =>
    table === "visits" ? visitQuery : locationQuery,
  );
  const createSupabaseAdminClient = vi.fn(() => ({ from, rpc }));

  return {
    archiveGuestMovement,
    createGuestSessionToken,
    createSupabaseAdminClient,
    from,
    hashGuestSessionToken,
    locationQuery,
    locationSingle,
    previousVisit,
    rpc,
    syncArchivePayload,
    verifyTurnstile,
    visitQuery,
  };
});

vi.mock("@/features/guests/self-service", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/features/guests/self-service")>();
  return {
    ...original,
    createGuestSessionToken: mocks.createGuestSessionToken,
    hashGuestSessionToken: mocks.hashGuestSessionToken,
    verifyTurnstile: mocks.verifyTurnstile,
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

function checkInRequest(body: Record<string, unknown>) {
  return new Request("https://itu-access.example/api/guest/check-in", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "cf-connecting-ip": "203.0.113.10",
    },
    body: JSON.stringify(body),
  });
}

const validBody = {
  requestId: "35000000-0000-4000-8000-000000000001",
  locationCode: "AUDITORIUM",
  name: "Tetamu Satu",
  organization: "Jabatan ITU",
  hostName: "Pn. Aisyah",
  purpose: "Mesyuarat",
  turnstileToken: "verified-token",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.visitQuery.select.mockReturnValue(mocks.visitQuery);
  mocks.visitQuery.eq.mockReturnValue(mocks.visitQuery);
  mocks.locationQuery.select.mockReturnValue(mocks.locationQuery);
  mocks.locationQuery.eq.mockReturnValue(mocks.locationQuery);
  mocks.from.mockImplementation((table: string) =>
    table === "visits" ? mocks.visitQuery : mocks.locationQuery,
  );
  mocks.createSupabaseAdminClient.mockImplementation(() => ({
    from: mocks.from,
    rpc: mocks.rpc,
  }));
});

describe("POST /api/guest/check-in", () => {
  it("rejects invalid details before Turnstile or Supabase is called", async () => {
    const response = await POST(checkInRequest({ locationCode: "A" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Maklumat tetamu belum lengkap.",
    });
    expect(mocks.verifyTurnstile).not.toHaveBeenCalled();
    expect(mocks.createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("fails closed when Turnstile verification is rejected", async () => {
    mocks.verifyTurnstile.mockResolvedValue({ ok: false });

    const response = await POST(checkInRequest(validBody));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Pengesahan keselamatan tidak berjaya.",
    });
    expect(mocks.createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it("returns safe visit data and keeps the checkout token in an HttpOnly cookie", async () => {
    mocks.verifyTurnstile.mockResolvedValue({ ok: true });
    mocks.previousVisit.mockResolvedValue({ data: null });
    mocks.rpc.mockResolvedValue({
      data: {
        id: "visit-1",
        location_id: "location-1",
        guest_name: "Tetamu Satu",
        guest_organization: "Jabatan ITU",
        guest_host_name: "Pn. Aisyah",
        guest_purpose: "Mesyuarat",
        check_in_at: "2026-07-29T00:00:00.000Z",
      },
      error: null,
    });
    mocks.locationSingle.mockResolvedValue({
      data: { name: "Auditorium" },
      error: null,
    });

    const response = await POST(checkInRequest(validBody));
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
    expect(JSON.stringify(body)).not.toContain("opaque-session-token");
    expect(JSON.stringify(body)).not.toContain("hashed-session-token");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(mocks.rpc).toHaveBeenCalledWith("register_guest_self_service", {
      p_location_code: "AUDITORIUM",
      p_name: "Tetamu Satu",
      p_organization: "Jabatan ITU",
      p_host_name: "Pn. Aisyah",
      p_purpose: "Mesyuarat",
      p_token_hash: "hashed-session-token",
      p_request_id: validBody.requestId,
    });
    expect(mocks.syncArchivePayload).toHaveBeenCalledOnce();
  });
});
