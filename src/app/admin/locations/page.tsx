import Image from "next/image";
import { headers } from "next/headers";
import QRCode from "qrcode";

import { createLocation, toggleLocation } from "@/features/admin/admin-actions";
import { requireProfile } from "@/features/auth/require-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminLocationsPage() {
  await requireProfile("ADMIN");
  const supabase = await createSupabaseServerClient();
  const { data: locations } = await supabase.from("locations").select("id, name, code, is_active").order("name");
  const requestHeaders = await headers();
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const rows = await Promise.all((locations ?? []).map(async (location) => ({
    ...location,
    scanUrl: `${protocol}://${host}/scan/${location.code}`,
    qr: await QRCode.toDataURL(`${protocol}://${host}/scan/${location.code}`, { width: 220, margin: 1, color: { dark: "#173B70", light: "#FFFFFF" } }),
  })));

  return <main><header className="admin-page-header"><div><p className="admin-kicker">Konfigurasi</p><h1>Lokasi & kod QR</h1><p>Setiap kod membuka halaman daftar masuk lokasi berkenaan.</p></div></header>
    <section className="admin-panel"><div className="panel-heading"><h2>Tambah lokasi</h2></div><form action={createLocation} className="admin-form admin-form--row"><label>Nama lokasi<input name="name" placeholder="Contoh: Bilik Server" required/></label><label>Kod ringkas <small>(boleh dibiarkan kosong)</small><input name="code" placeholder="BILIK-SERVER"/></label><button className="admin-primary" type="submit">Tambah lokasi</button></form></section>
    <section className="qr-grid">{rows.map((location) => <article className={`qr-card ${location.is_active ? "" : "qr-card--inactive"}`} key={location.id}><div className="qr-card__top"><div><h2>{location.name}</h2><code>{location.code}</code></div><span className={`status status--${location.is_active ? "active" : "suspended"}`}>{location.is_active ? "AKTIF" : "TIDAK AKTIF"}</span></div><Image src={location.qr} width={220} height={220} alt={`Kod QR ${location.name}`} unoptimized/><a href={location.scanUrl}>{location.scanUrl}</a><form action={toggleLocation}><input type="hidden" name="locationId" value={location.id}/><input type="hidden" name="isActive" value={String(location.is_active)}/><button className="admin-secondary" type="submit">{location.is_active ? "Nyahaktifkan" : "Aktifkan semula"}</button></form></article>)}</section>
  </main>;
}
