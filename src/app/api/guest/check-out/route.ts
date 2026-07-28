import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  GUEST_SESSION_COOKIE,
  hashGuestSessionToken,
} from "@/features/guests/self-service";
import {
  archiveGuestMovement,
  syncArchivePayload,
} from "@/features/spreadsheet/archive-sync";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(GUEST_SESSION_COOKIE)?.value;
    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Sesi tetamu tidak ditemui." },
        { status: 404 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const requestId = randomUUID();
    const { data: visit, error } = await supabase.rpc(
      "check_out_guest_self_service",
      {
        p_token_hash: hashGuestSessionToken(token),
        p_request_id: requestId,
      },
    );
    if (error || !visit) {
      return NextResponse.json(
        { ok: false, error: "Daftar keluar tidak berjaya." },
        { status: 400 },
      );
    }

    if (visit.check_out_request_id === requestId) {
      await syncArchivePayload(
        archiveGuestMovement({
          status: "KELUAR",
          occurredAt: visit.check_out_at ?? visit.check_in_at,
          recorderEmail: "",
          guestName: visit.guest_name,
          organization: visit.guest_organization,
          purpose: visit.guest_purpose,
        }),
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(GUEST_SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Perkhidmatan tetamu tidak tersedia." },
      { status: 500 },
    );
  }
}
