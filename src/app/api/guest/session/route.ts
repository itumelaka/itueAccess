import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  GUEST_SESSION_COOKIE,
  hashGuestSessionToken,
} from "@/features/guests/self-service";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(GUEST_SESSION_COOKIE)?.value;
    if (!token) return NextResponse.json({ ok: true, visit: null });

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("guest_self_service_tokens")
      .select(
        "expires_at, visits!inner(id, guest_name, check_in_at, check_out_at, locations(name))",
      )
      .eq("token_hash", hashGuestSessionToken(token))
      .maybeSingle();

    const visit = Array.isArray(data?.visits) ? data.visits[0] : data?.visits;
    if (
      error ||
      !data ||
      !visit ||
      visit.check_out_at ||
      new Date(data.expires_at) <= new Date()
    ) {
      return NextResponse.json({ ok: true, visit: null });
    }

    const location = Array.isArray(visit.locations)
      ? visit.locations[0]
      : visit.locations;
    return NextResponse.json({
      ok: true,
      visit: {
        id: visit.id,
        name: visit.guest_name,
        locationName: location?.name ?? "",
        checkInAt: visit.check_in_at,
      },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Perkhidmatan tetamu tidak tersedia." },
      { status: 500 },
    );
  }
}
