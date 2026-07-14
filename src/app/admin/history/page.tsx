import { requireProfile } from "@/features/auth/require-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function dateRange(from?: string, to?: string) {
  const end = to && !Number.isNaN(Date.parse(to)) ? new Date(`${to}T23:59:59+08:00`) : new Date();
  const requested = from && !Number.isNaN(Date.parse(from)) ? new Date(`${from}T00:00:00+08:00`) : new Date(end.getTime() - 30 * 86_400_000);
  const earliest = new Date(end.getTime() - 90 * 86_400_000);
  return { start: requested < earliest ? earliest : requested, end };
}

function fieldDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kuala_Lumpur", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export default async function AdminHistoryPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; location?: string; type?: string }> }) {
  await requireProfile("ADMIN");
  const params = await searchParams;
  const { start, end } = dateRange(params.from, params.to);
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("visits").select("id, person_type, guest_name, check_in_at, check_out_at, locations(name), profiles!visits_profile_id_fkey(display_name)").gte("check_in_at", start.toISOString()).lte("check_in_at", end.toISOString()).order("check_in_at", { ascending: false }).limit(500);
  if (params.location) query = query.eq("location_id", params.location);
  if (params.type === "USER" || params.type === "GUEST") query = query.eq("person_type", params.type);
  const [visitsResult, locationsResult] = await Promise.all([query, supabase.from("locations").select("id, name").order("name")]);

  return <main><header className="admin-page-header"><div><p className="admin-kicker">Audit operasi</p><h1>Sejarah akses</h1><p>Carian dihadkan kepada maksimum 90 hari dan 500 rekod.</p></div></header>
    <section className="admin-panel"><form className="filter-form"><label>Dari<input type="date" name="from" defaultValue={fieldDate(start)}/></label><label>Hingga<input type="date" name="to" defaultValue={fieldDate(end)}/></label><label>Lokasi<select name="location" defaultValue={params.location ?? ""}><option value="">Semua lokasi</option>{locationsResult.data?.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label><label>Jenis<select name="type" defaultValue={params.type ?? ""}><option value="">Semua</option><option value="USER">Pengguna</option><option value="GUEST">Tetamu</option></select></label><button className="admin-primary" type="submit">Tapis</button></form></section>
    <section className="admin-panel table-wrap"><table className="admin-table"><thead><tr><th>Nama</th><th>Jenis</th><th>Lokasi</th><th>Masuk</th><th>Keluar</th></tr></thead><tbody>{visitsResult.data?.map((visit) => <tr key={visit.id}><td>{visit.person_type === "GUEST" ? visit.guest_name : visit.profiles?.display_name}</td><td>{visit.person_type === "GUEST" ? "Tetamu" : "Pengguna"}</td><td>{visit.locations.name}</td><td>{new Date(visit.check_in_at).toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" })}</td><td>{visit.check_out_at ? new Date(visit.check_out_at).toLocaleString("ms-MY", { timeZone: "Asia/Kuala_Lumpur" }) : <span className="status status--active">Di dalam</span>}</td></tr>)}</tbody></table>{!visitsResult.data?.length && <p className="empty-state">Tiada rekod untuk penapis ini.</p>}</section>
  </main>;
}
