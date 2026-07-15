import { afterEach, describe, expect, it, vi } from "vitest";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import {
  buildPendingApprovalNotificationPayload,
  syncPendingApprovalNotification,
} from "./pending-approval-notification";

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: vi.fn(() => {
    throw new Error("Cloudflare context is not available");
  }),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(getCloudflareContext).mockReset();
  vi.mocked(getCloudflareContext).mockImplementation(() => {
    throw new Error("Cloudflare context is not available");
  });
});

describe("buildPendingApprovalNotificationPayload", () => {
  it("builds the Apps Script payload for a pending profile", () => {
    expect(
      buildPendingApprovalNotificationPayload({
        adminUrl: "https://itu-access.example/admin/users",
        createdAt: "2026-07-15T04:00:00.000Z",
        displayName: "Pengguna Test",
        email: "test@example.com",
      }),
    ).toEqual({
      action: "notifyPendingUser",
      adminUrl: "https://itu-access.example/admin/users",
      createdAt: "15-07-2026 12:00:00",
      displayName: "Pengguna Test",
      email: "test@example.com",
    });
  });
});

describe("syncPendingApprovalNotification", () => {
  it("skips safely when webhook env is missing", async () => {
    const fetchImpl = vi.fn();

    await expect(
      syncPendingApprovalNotification({
        adminUrl: "https://itu-access.example/admin/users",
        createdAt: "2026-07-15T04:00:00.000Z",
        displayName: "Pengguna Test",
        email: "test@example.com",
      }, fetchImpl),
    ).resolves.toEqual({
      ok: false,
      message: "Pending approval notification is not configured",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts notification payload to the configured Apps Script webhook", async () => {
    vi.stubEnv("SPREADSHEET_ARCHIVE_WEBHOOK_URL", "https://script.example/exec");
    vi.stubEnv("SPREADSHEET_ARCHIVE_SECRET", "secret");
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    await expect(
      syncPendingApprovalNotification({
        adminUrl: "https://itu-access.example/admin/users",
        createdAt: "2026-07-15T04:00:00.000Z",
        displayName: "Pengguna Test",
        email: "test@example.com",
      }, fetchImpl as unknown as typeof fetch),
    ).resolves.toEqual({ ok: true });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://script.example/exec?secret=secret",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "notifyPendingUser",
          adminUrl: "https://itu-access.example/admin/users",
          createdAt: "15-07-2026 12:00:00",
          displayName: "Pengguna Test",
          email: "test@example.com",
        }),
      },
    );
  });
});
