import { checkOutGuest, registerGuest } from "@/features/admin/admin-actions";
import { requireProfile } from "@/features/auth/require-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminGuestsPage() {
  await requireProfile("ADMIN");
  const supabase = await createSupabaseServerClient();
  const [locationsResult, guestsResult] = await Promise.all([
    supabase.from("locations").select("id, name").eq("is_active", true).order("name"),
    supabase.from("visits").select("id, guest_name, guest_organization, guest_purpose, check_in_at, locations(name)").eq("person_type", "GUEST").is("check_out_at", null).order("check_in_at", { ascending: false }).limit(200),
  ]);

  return <main><header className="admin-page-header"><div><p className="admin-kicker">Kaunter tetamu</p><h1>Rekod tetamu</h1><p>Daftar tetamu masuk dan tutup rekod apabila mereka keluar.</p></div><span className="count-pill">{guestsResult.data?.length ?? 0} masih di dalam</span></header>
    <section className="admin-panel"><div className="panel-heading"><h2>Daftar masuk tetamu</h2></div><form action={registerGuest} className="admin-form guest-form"><label>Nama penuh<input name="name" required/></label><label>Organisasi<input name="organization" required/></label><label>Tujuan lawatan<input name="purpose" required/></label><label>Lokasi<select name="locationId" defaultValue="" required><option value="" disabled>Pilih lokasi</option>{locationsResult.data?.map((location) => <option value={location.id} key={location.id}>{location.name}</option>)}</select></label><button className="admin-primary" type="submit">Daftar masuk</button></form></section>
    <section className="admin-panel"><div className="panel-heading"><h2>Tetamu masih di dalam</h2></div><div className="admin-list">{guestsResult.data?.length ? guestsResult.data.map((guest) => <article className="guest-row" key={guest.id}><div><strong>{guest.guest_name}</strong><small>{guest.guest_organization} · {guest.guest_purpose}</small><span>{guest.locations.name} · masuk {new Date(guest.check_in_at).toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" })}</span></div><form action={checkOutGuest}><input type="hidden" name="visitId" value={guest.id}/><button className="admin-danger" type="submit">Daftar keluar</button></form></article>) : <p className="empty-state">Tiada tetamu aktif.</p>}</div></section>
  </main>;
}
