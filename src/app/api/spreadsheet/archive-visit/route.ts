import { NextResponse } from "next/server";

import { requireProfile } from "@/features/auth/require-profile";
import {
  archiveUserMovement,
  syncArchivePayload,
} from "@/features/spreadsheet/archive-sync";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ArchiveVisitRequest = {
  visitId?: string;
  status?: "MASUK" | "KELUAR";
};

export async function POST(request: Request) {
  try {
    const { profile } = await requireProfile();
    const body = (await request.json()) as ArchiveVisitRequest;

    const status = body.status;
    if (!body.visitId || !status || !["MASUK", "KELUAR"].includes(status)) {
      return NextResponse.json(
        { ok: false, error: "Invalid archive request" },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data: visit, error } = await supabase
      .from("visits")
      .select(
        "id, profile_id, check_in_at, check_out_at, locations(name), profiles!visits_profile_id_fkey(email, display_name, category)",
      )
      .eq("id", body.visitId)
      .eq("profile_id", profile.id)
      .single();

    if (error || !visit) {
      return NextResponse.json(
        { ok: false, error: "Visit not found" },
        { status: 404 },
      );
    }

    const occurredAt =
      status === "KELUAR"
        ? (visit.check_out_at ?? visit.check_in_at)
        : visit.check_in_at;
    const visitProfile = Array.isArray(visit.profiles)
      ? visit.profiles[0]
      : visit.profiles;
    const visitLocation = Array.isArray(visit.locations)
      ? visit.locations[0]
      : visit.locations;

    const payload = archiveUserMovement({
      status,
      occurredAt,
      email: visitProfile?.email ?? profile.email,
      displayName: visitProfile?.display_name ?? profile.display_name,
      category: visitProfile?.category ?? profile.category,
      locationName: visitLocation?.name ?? "",
    });
    const result = await syncArchivePayload(payload);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Archive sync failed",
    });
  }
}
