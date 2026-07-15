import { LoginHero } from "@/features/brand/login-hero";
import { requireProfile } from "@/features/auth/require-profile";
import { UserHome } from "@/features/visits/user-home";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { profile } = await requireProfile();
    const { data: openVisit } = await supabase.from("visits").select("check_in_at, locations(name)").eq("profile_id", profile.id).is("check_out_at", null).maybeSingle();
    const active = openVisit ? { locationName: openVisit.locations.name, checkInAt: openVisit.check_in_at } : null;
    return <UserHome active={active} displayName={profile.display_name} role={profile.role} />;
  }

  return <LoginHero />;
}
