import { GuestSelfServiceForm } from "@/features/guests/guest-self-service-form";
import { GuestSelfServiceLayout } from "@/features/guests/guest-self-service-layout";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function GuestRegistrationPage() {
  const supabase = createSupabaseAdminClient();
  const { data: locations, error } = await supabase
    .from("locations")
    .select("name, code")
    .eq("is_active", true)
    .order("name");

  let content;
  if (error) {
    content = (
      <section className="guest-self-service__card" role="alert">
        <p className="guest-self-service__kicker">Sambungan terganggu</p>
        <h2>Lokasi belum dapat dimuatkan</h2>
        <p>Sila muat semula halaman atau cuba lagi sebentar lagi.</p>
      </section>
    );
  } else if (!locations?.length) {
    content = (
      <section className="guest-self-service__card">
        <p className="guest-self-service__kicker">Pendaftaran belum tersedia</p>
        <h2>Tiada lokasi aktif</h2>
        <p>Sila hubungi pegawai ITU untuk bantuan pendaftaran.</p>
      </section>
    );
  } else {
    content = (
      <GuestSelfServiceForm
        locations={locations}
        turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
      />
    );
  }

  return <GuestSelfServiceLayout>{content}</GuestSelfServiceLayout>;
}