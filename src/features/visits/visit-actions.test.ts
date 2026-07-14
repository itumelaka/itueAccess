import { describe, expect, it, vi } from "vitest";

import { checkIn, checkOut } from "./visit-actions";

describe("checkIn", () => {
  it("sends the location and retained request ID to the RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { id: "visit-1", check_in_at: "2026-07-14T12:00:00Z" },
      error: null,
    });

    const archiveVisit = vi.fn().mockResolvedValue(undefined);

    const result = await checkIn(
      "BILIK-SERVER",
      "10000000-0000-4000-8000-000000000001",
      rpc,
      archiveVisit,
    );

    expect(rpc).toHaveBeenCalledWith("check_in", {
      p_location_code: "BILIK-SERVER",
      p_request_id: "10000000-0000-4000-8000-000000000001",
    });
    expect(archiveVisit).toHaveBeenCalledWith({
      visitId: "visit-1",
      status: "MASUK",
    });
    expect(result).toEqual({ ok: true, visitId: "visit-1", occurredAt: "2026-07-14T12:00:00Z" });
  });

  it("maps an existing open visit to a Malay message", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "An open visit already exists" } });

    await expect(checkIn("AUDITORIUM", crypto.randomUUID(), rpc)).resolves.toEqual({
      ok: false,
      code: "OPEN_VISIT",
      message: "Anda masih mempunyai rekod lawatan yang belum ditutup.",
    });
  });
});

describe("checkOut", () => {
  it("archives the successful checkout without changing the response", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        id: "visit-1",
        check_in_at: "2026-07-14T12:00:00Z",
        check_out_at: "2026-07-14T13:00:00Z",
      },
      error: null,
    });
    const archiveVisit = vi.fn().mockResolvedValue(undefined);

    const result = await checkOut(
      "10000000-0000-4000-8000-000000000002",
      rpc,
      archiveVisit,
    );

    expect(rpc).toHaveBeenCalledWith("check_out", {
      p_request_id: "10000000-0000-4000-8000-000000000002",
    });
    expect(archiveVisit).toHaveBeenCalledWith({
      visitId: "visit-1",
      status: "KELUAR",
    });
    expect(result).toEqual({
      ok: true,
      visitId: "visit-1",
      occurredAt: "2026-07-14T13:00:00Z",
    });
  });
});
