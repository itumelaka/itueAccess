import Link from "next/link";

import { adminCheckOutVisit } from "@/features/admin/admin-actions";
import { requireProfile } from "@/features/auth/require-profile";
import { summarizeDashboard } from "@/features/admin/dashboard-queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const malaysiaDateTime = new Intl.DateTimeFormat("ms-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  day: "numeric",
  month: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatCheckIn(value: string) {
  return malaysiaDateTime.format(new Date(value));
}

export default async function AdminDashboardPage() {
  const { profile } = await requireProfile("ADMIN");
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000).toISOString();

  const [openResult, activityResult, profilesResult, locationsResult, pendingResult] = await Promise.all([
    supabase.from("visits").select("id, person_type, profile_id, location_id, check_in_at, check_out_at, guest_name, guest_organization, locations(name), profiles!visits_profile_id_fkey(email, display_name, category)").is("check_out_at", null).order("check_in_at", { ascending: false }).limit(500),
    supabase.from("visits").select("id, person_type, profile_id, location_id, check_in_at, check_out_at").gte("check_in_at", thirtyDaysAgo).order("check_in_at", { ascending: false }).limit(1000),
    supabase.from("profiles").select("id, category"),
    supabase.from("locations").select("id, name").eq("is_active", true).order("name"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "PENDING"),
  ]);

  const summary = summarizeDashboard({
    openVisits: openResult.data ?? [],
    activityVisits: activityResult.data ?? [],
    profiles: profilesResult.data ?? [],
    locations: locationsResult.data ?? [],
    now,
  });

  const cards = [
    ["Dalam bilik", summary.inside, "live"],
    ["Staf", summary.staffInside, "blue"],
    ["Pelatih", summary.traineeInside, "yellow"],
    ["Tetamu", summary.guestInside, "red"],
    ["Rekod masuk hari ini", summary.openedToday, "blue"],
    ["Rekod keluar hari ini", summary.closedToday, "live"],
    ["Lebih 12 jam", summary.overdue, summary.overdue ? "red" : "blue"],
    ["Menunggu kelulusan", pendingResult.count ?? 0, (pendingResult.count ?? 0) ? "yellow" : "blue"],
  ] as const;

  return (
    <main>
      <header className="admin-page-header">
        <div><p className="admin-kicker">Dashboard admin</p><h1>Selamat datang, {profile.display_name}</h1><p>Ringkasan langsung akses bilik ITU.</p></div>
        <Link className="admin-primary" href="/admin/guests">+ Daftar tetamu</Link>
      </header>
      <section className="metric-grid" aria-label="Ringkasan akses">
        {cards.map(([label, value, tone]) => <article className={`metric-card metric-card--${tone}`} key={label}><span>{label}</span><strong>{value}</strong></article>)}
      </section>
      <section className="admin-panel">
        <div className="panel-heading"><div><p className="admin-kicker">Penghuni semasa</p><h2>Mengikut lokasi</h2></div><Link href="/admin/history">Lihat sejarah →</Link></div>
        <div className="location-bars">
          {summary.byLocation.length ? summary.byLocation.map((location) => (
            <div className="location-bar" key={location.id}><span>{location.name}</span><div><i style={{ width: `${Math.min(100, location.inside * 14)}%` }} /></div><strong>{location.inside}</strong></div>
          )) : <p>Belum ada lokasi aktif.</p>}
        </div>
      </section>
      <section className="admin-panel">
        <div className="panel-heading">
          <div><p className="admin-kicker">Perlu perhatian</p><h2>Lebih 12 jam</h2></div>
          <span className="count-pill">{summary.overdueOccupants.length} rekod</span>
        </div>
        <div className="admin-list">
          {summary.overdueOccupants.length ? summary.overdueOccupants.map((visit) => (
            <article className="guest-row" key={visit.id}>
              <div>
                <strong>{visit.name}</strong>
                <small>{visit.categoryLabel} · {visit.locationName}</small>
                <span>Masuk: {formatCheckIn(visit.checkInAt)} · {visit.hoursInside.toFixed(1)} jam</span>
              </div>
              <form action={adminCheckOutVisit}>
                <input type="hidden" name="visitId" value={visit.id} />
                <button className="admin-danger" type="submit">Rekod keluar manual</button>
              </form>
            </article>
          )) : <p className="empty-state">Tiada rekod melebihi 12 jam.</p>}
        </div>
      </section>
      <section className="admin-panel">
        <div className="panel-heading">
          <div><p className="admin-kicker">Senarai semasa</p><h2>Masih berada dalam bilik</h2></div>
          <span className="count-pill">{summary.currentOccupants.length} orang</span>
        </div>
        <div className="admin-list">
          {summary.currentOccupants.length ? summary.currentOccupants.map((visit) => (
            <article className="guest-row" key={visit.id}>
              <div>
                <strong>{visit.name}</strong>
                <small>{visit.categoryLabel} · {visit.locationName}</small>
                <span>Masuk: {formatCheckIn(visit.checkInAt)} · {visit.hoursInside.toFixed(1)} jam</span>
              </div>
              <form action={adminCheckOutVisit}>
                <input type="hidden" name="visitId" value={visit.id} />
                <button className="admin-secondary" type="submit">Rekod keluar manual</button>
              </form>
            </article>
          )) : <p className="empty-state">Tiada pengguna atau tetamu sedang berada dalam bilik.</p>}
        </div>
      </section>
    </main>
  );
}
