import { notFound } from "next/navigation";

import { GuestSelfServiceForm } from "@/features/guests/guest-self-service-form";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function GuestSelfServicePage({
  params,
}: {
  params: Promise<{ locationCode: string }>;
}) {
  const code = decodeURIComponent((await params).locationCode)
    .trim()
    .toUpperCase();
  if (!/^[A-Z0-9-]{3,32}$/.test(code)) notFound();

  const supabase = createSupabaseAdminClient();
  const { data: location } = await supabase
    .from("locations")
    .select("name, code")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();
  if (!location) notFound();

  return (
    <main className="guest-self-service">
      <header>
        <p>ITU eAccess</p>
        <h1>Selamat datang</h1>
        <span>Daftar kehadiran anda sebelum memasuki lokasi.</span>
      </header>
      <GuestSelfServiceForm
        locationCode={location.code}
        locationName={location.name}
        turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
      />
    </main>
  );
}
