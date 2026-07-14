import { afterEach, describe, expect, it, vi } from "vitest";

import {
  archiveGuestMovement,
  archiveUserMovement,
  syncArchivePayload,
} from "./archive-sync";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("archiveUserMovement", () => {
  it("maps staff movement to STAFF sheet headers", () => {
    expect(
      archiveUserMovement({
        status: "MASUK",
        occurredAt: "2026-07-15T01:30:00.000Z",
        email: "staff@example.com",
        displayName: "Staff One",
        category: "STAFF",
        locationName: "BILIK SERVER",
      }),
    ).toEqual({
      sheetName: "STAFF",
      values: [
        "15-07-2026 09:30:00",
        "staff@example.com",
        "STAFF",
        "Staff One",
        "BILIK SERVER",
        "MASUK",
      ],
    });
  });

  it("maps pelatih movement to STUDENT sheet headers", () => {
    expect(
      archiveUserMovement({
        status: "KELUAR",
        occurredAt: "2026-07-15T01:30:00.000Z",
        email: "pelatih@example.com",
        displayName: "Pelatih One",
        category: "PELATIH",
        locationName: "AUDITORIUM",
      }),
    ).toEqual({
      sheetName: "STUDENT",
      values: [
        "15-07-2026 09:30:00",
        "pelatih@example.com",
        "Pelatih One",
        "AUDITORIUM",
        "KELUAR",
        2026,
        7,
        "",
      ],
    });
  });
});

describe("archiveGuestMovement", () => {
  it("maps guest movement to TETAMU sheet headers", () => {
    expect(
      archiveGuestMovement({
        status: "MASUK",
        occurredAt: "2026-07-15T01:30:00.000Z",
        recorderEmail: "admin@example.com",
        guestName: "Tetamu One",
        organization: "Jabatan",
        purpose: "Mesyuarat",
      }),
    ).toEqual({
      sheetName: "TETAMU",
      values: [
        "15-07-2026 09:30:00",
        "admin@example.com",
        "Tetamu One",
        "Jabatan",
        "Mesyuarat",
        "MASUK",
        2026,
        7,
        "",
      ],
    });
  });
});

describe("syncArchivePayload", () => {
  it("skips safely when env is missing", async () => {
    const fetchImpl = vi.fn();

    await expect(
      syncArchivePayload({ sheetName: "STAFF", values: [] }, fetchImpl),
    ).resolves.toEqual({
      ok: false,
      message: "Spreadsheet archive sync is not configured",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts payload to the configured Apps Script webhook", async () => {
    vi.stubEnv("SPREADSHEET_ARCHIVE_WEBHOOK_URL", "https://script.example/exec");
    vi.stubEnv("SPREADSHEET_ARCHIVE_SECRET", "secret");
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    await expect(
      syncArchivePayload(
        { sheetName: "STAFF", values: ["x"] },
        fetchImpl as unknown as typeof fetch,
      ),
    ).resolves.toEqual({ ok: true });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://script.example/exec?secret=secret",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sheetName: "STAFF", values: ["x"] }),
      },
    );
  });
});
