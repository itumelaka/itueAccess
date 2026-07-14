import { LoginHero } from "@/features/brand/login-hero";
import { requireProfile } from "@/features/auth/require-profile";
import { CheckInOutForm } from "@/features/visits/check-in-out-form";
import { StatusCard } from "@/features/visits/status-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { profile } = await requireProfile();
    const { data: openVisit } = await supabase.from("visits").select("check_in_at, locations(name)").eq("profile_id", profile.id).is("check_out_at", null).maybeSingle();
    const active = openVisit ? { locationName: openVisit.locations.name, checkInAt: openVisit.check_in_at } : null;
    return <main className="mx-auto max-w-xl px-6 py-10"><p className="text-sm font-semibold uppercase tracking-widest text-blue-700">ITU eAccess</p><h1 className="mt-2 text-3xl font-bold">Hai, {profile.display_name}</h1><div className="mt-6"><StatusCard visit={active} /></div>{active ? <CheckInOutForm mode="CHECK_OUT" /> : <p className="mt-6 text-slate-600">Imbas QR di pintu bilik untuk merekodkan kemasukan.</p>}<a href="/history" className="mt-8 inline-block font-semibold text-blue-700">Lihat sejarah saya →</a></main>;
  }

  return <LoginHero />;
}
