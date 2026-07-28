import { describe, expect, it, vi } from "vitest";

import {
  createGuestSessionToken,
  guestSelfServiceInputSchema,
  hashGuestSessionToken,
  verifyTurnstile,
} from "./self-service";

describe("guest self service", () => {
  it("validates and normalizes guest input", () => {
    expect(
      guestSelfServiceInputSchema.parse({
        requestId: "35000000-0000-4000-8000-000000000001",
        locationCode: " auditorium ",
        name: " Tetamu Satu ",
        organization: " Jabatan ",
        purpose: " Mesyuarat ",
        turnstileToken: "verified",
      }),
    ).toEqual({
      requestId: "35000000-0000-4000-8000-000000000001",
      locationCode: "AUDITORIUM",
      name: "Tetamu Satu",
      organization: "Jabatan",
      purpose: "Mesyuarat",
      turnstileToken: "verified",
    });
  });

  it("creates an opaque token and stores only its hash", () => {
    const token = createGuestSessionToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(hashGuestSessionToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashGuestSessionToken(token)).not.toBe(token);
  });

  it("accepts a successful Turnstile verification", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });

    await expect(
      verifyTurnstile(
        "token",
        "203.0.113.10",
        fetchImpl,
        "secret",
        "35000000-0000-4000-8000-000000000001",
      ),
    ).resolves.toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledOnce();
    expect(fetchImpl.mock.calls[0]?.[1]?.body.toString()).toContain(
      "idempotency_key=35000000-0000-4000-8000-000000000001",
    );
  });

  it("fails closed when Turnstile is not configured", async () => {
    const fetchImpl = vi.fn();
    await expect(
      verifyTurnstile("token", undefined, fetchImpl, ""),
    ).resolves.toEqual({
      ok: false,
      message: "Turnstile is not configured",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
