import { notFound } from "next/navigation";

import { requireProfile } from "@/features/auth/require-profile";
import { CheckInOutForm } from "@/features/visits/check-in-out-form";
import { StatusCard } from "@/features/visits/status-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ScanPage({ params }: { params: Promise<{ locationCode: string }> }) {
  const { profile } = await requireProfile();
  const code = decodeURIComponent((await params).locationCode).trim().toUpperCase();
  if (!/^[A-Z0-9-]{3,32}$/.test(code)) notFound();

  const supabase = await createSupabaseServerClient();
  const [{ data: location }, { data: openVisit }] = await Promise.all([
    supabase.from("locations").select("id, name, code").eq("code", code).eq("is_active", true).maybeSingle(),
    supabase.from("visits").select("check_in_at, locations(name)").eq("profile_id", profile.id).is("check_out_at", null).maybeSingle(),
  ]);
  if (!location) notFound();

  const active = openVisit ? { locationName: openVisit.locations.name, checkInAt: openVisit.check_in_at } : null;
  return <main className="mx-auto max-w-xl px-6 py-10"><h1 className="text-3xl font-bold">{location.name}</h1><div className="mt-6"><StatusCard visit={active} /></div><CheckInOutForm mode={active ? "CHECK_OUT" : "CHECK_IN"} locationCode={location.code} locationName={location.name} /></main>;
}
