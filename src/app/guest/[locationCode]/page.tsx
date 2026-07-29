import Image from "next/image";
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
      <div className="guest-self-service__shell">
        <header className="guest-self-service__header">
          <div className="guest-self-service__brand" aria-label="ITU eAccess">
            <Image
              src="/brand/itu-eaccess-mark.svg"
              width={56}
              height={56}
              alt=""
              priority
            />
            <span>
              itu_<strong>eAccess</strong>
            </span>
          </div>
          <p className="guest-self-service__eyebrow">Daftar pelawat</p>
          <h1>Selamat datang</h1>
          <p className="guest-self-service__lead">
            Daftar kehadiran sebelum masuk dan gunakan halaman yang sama apabila
            anda keluar.
          </p>
          <div className="guest-self-service__location">
            <span>Lokasi lawatan</span>
            <strong>{location.name}</strong>
          </div>
        </header>
        <GuestSelfServiceForm
          locationCode={location.code}
          locationName={location.name}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
        />
        <footer className="guest-self-service__footer">
          Rekod ini digunakan untuk keselamatan dan pengurusan akses ITU.
        </footer>
      </div>
    </main>
  );
}