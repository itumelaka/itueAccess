import { createHash, randomBytes } from "node:crypto";

import { z } from "zod";

export const GUEST_SESSION_COOKIE = "itu_guest_visit";
export const GUEST_SESSION_MAX_AGE = 24 * 60 * 60;

export const guestSelfServiceInputSchema = z.object({
  requestId: z.string().uuid(),
  locationCode: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,32}$/),
  name: z.string().trim().min(2).max(120),
  organization: z.string().trim().min(2).max(160),
  purpose: z.string().trim().min(3).max(240),
  turnstileToken: z.string().min(1),
});

export type GuestSelfServiceInput = z.infer<typeof guestSelfServiceInputSchema>;

export function createGuestSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashGuestSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function verifyTurnstile(
  token: string,
  remoteIp?: string,
  fetchImpl: typeof fetch = fetch,
  secret = process.env.TURNSTILE_SECRET_KEY,
  idempotencyKey?: string,
) {
  if (!secret) {
    return { ok: false, message: "Turnstile is not configured" } as const;
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  if (remoteIp) body.set("remoteip", remoteIp);
  if (idempotencyKey) body.set("idempotency_key", idempotencyKey);

  try {
    const response = await fetchImpl(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body,
      },
    );
    if (!response.ok) {
      return { ok: false, message: "Turnstile verification failed" } as const;
    }

    const result = (await response.json()) as { success?: boolean };
    return result.success
      ? ({ ok: true } as const)
      : ({ ok: false, message: "Turnstile verification failed" } as const);
  } catch {
    return { ok: false, message: "Turnstile verification failed" } as const;
  }
}
