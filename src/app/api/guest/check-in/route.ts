import { NextResponse } from "next/server";

import {
  GUEST_SESSION_COOKIE,
  GUEST_SESSION_MAX_AGE,
  createGuestSessionToken,
  guestSelfServiceInputSchema,
  hashGuestSessionToken,
  verifyTurnstile,
} from "@/features/guests/self-service";
import {
  archiveGuestMovement,
  syncArchivePayload,
} from "@/features/spreadsheet/archive-sync";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const parsed = guestSelfServiceInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Maklumat tetamu belum lengkap." },
        { status: 400 },
      );
    }

    const turnstile = await verifyTurnstile(
      parsed.data.turnstileToken,
      request.headers.get("cf-connecting-ip") ?? undefined,
      fetch,
      process.env.TURNSTILE_SECRET_KEY,
      parsed.data.requestId,
    );
    if (!turnstile.ok) {
      return NextResponse.json(
        { ok: false, error: "Pengesahan keselamatan tidak berjaya." },
        { status: 403 },
      );
    }

    const token = createGuestSessionToken();
    const tokenHash = hashGuestSessionToken(token);
    const supabase = createSupabaseAdminClient();
    const { data: previousVisit } = await supabase
      .from("visits")
      .select("id")
      .eq("check_in_request_id", parsed.data.requestId)
      .eq("person_type", "GUEST")
      .eq("source", "SELF_SERVICE")
      .maybeSingle();
    const { data: visit, error } = await supabase.rpc(
      "register_guest_self_service",
      {
        p_location_code: parsed.data.locationCode,
        p_name: parsed.data.name,
        p_organization: parsed.data.organization,
        p_host_name: parsed.data.hostName,
        p_purpose: parsed.data.purpose,
        p_token_hash: tokenHash,
        p_request_id: parsed.data.requestId,
      },
    );

    if (error || !visit) {
      return NextResponse.json(
        { ok: false, error: "Daftar masuk tidak berjaya." },
        { status: 400 },
      );
    }

    const { data: location } = await supabase
      .from("locations")
      .select("name")
      .eq("id", visit.location_id)
      .single();

    if (!previousVisit) {
      await syncArchivePayload(
        archiveGuestMovement({
          status: "MASUK",
          occurredAt: visit.check_in_at,
          recorderEmail: "",
          guestName: visit.guest_name,
          organization: visit.guest_organization,
          purpose: visit.guest_purpose,
        }),
      );
    }

    const response = NextResponse.json({
      ok: true,
      visit: {
        id: visit.id,
        name: visit.guest_name,
        locationName: location?.name ?? "",
        checkInAt: visit.check_in_at,
      },
    });
    response.cookies.set(GUEST_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: GUEST_SESSION_MAX_AGE,
    });
    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Perkhidmatan tetamu tidak tersedia." },
      { status: 500 },
    );
  }
}
