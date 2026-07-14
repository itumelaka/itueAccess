import { approveUser, promoteUser, setUserStatus } from "@/features/admin/admin-actions";
import { requireProfile } from "@/features/auth/require-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AdminUsersPage() {
  const { profile: currentAdmin } = await requireProfile("ADMIN");
  const supabase = await createSupabaseServerClient();
  const { data: profiles } = await supabase.from("profiles").select("id, display_name, email, category, role, status, created_at").order("created_at", { ascending: false }).limit(300);
  const pending = profiles?.filter((profile) => profile.status === "PENDING") ?? [];
  const approved = profiles?.filter((profile) => profile.status !== "PENDING") ?? [];

  return <main><header className="admin-page-header"><div><p className="admin-kicker">Kawalan akses</p><h1>Pengguna</h1><p>Luluskan akaun baharu dan urus status pengguna.</p></div><span className="count-pill">{pending.length} menunggu</span></header>
    <section className="admin-panel"><div className="panel-heading"><h2>Menunggu kelulusan</h2></div><div className="admin-list">
      {pending.length ? pending.map((profile) => <article className="user-row" key={profile.id}><div><strong>{profile.display_name}</strong><small>{profile.email}</small></div><form action={approveUser} className="inline-form"><input type="hidden" name="profileId" value={profile.id}/><select name="category" defaultValue="" required><option value="" disabled>Pilih kategori</option><option value="STAFF">Staf</option><option value="PELATIH">Pelatih</option></select><button className="admin-primary" type="submit">Luluskan</button></form></article>) : <p className="empty-state">Tiada akaun menunggu kelulusan.</p>}
    </div></section>
    <section className="admin-panel"><div className="panel-heading"><h2>Pengguna berdaftar</h2></div><div className="admin-list">
      {approved.map((profile) => <article className="user-row user-row--stack" key={profile.id}><div><strong>{profile.display_name}</strong><small>{profile.email}</small><div className="tag-row"><span>{profile.category ?? "Tiada kategori"}</span><span>{profile.role}</span><span className={`status status--${profile.status.toLowerCase()}`}>{profile.status}</span></div></div>
        {profile.id !== currentAdmin.id && <div className="user-actions"><form action={setUserStatus}><input type="hidden" name="profileId" value={profile.id}/><input type="hidden" name="status" value={profile.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED"}/><button className="admin-secondary" type="submit">{profile.status === "SUSPENDED" ? "Aktifkan" : "Gantung"}</button></form>
        {profile.role === "USER" && <details><summary>Jadikan admin</summary><form action={promoteUser} className="confirm-form"><input type="hidden" name="profileId" value={profile.id}/><label>Taip e-mel untuk sahkan<input name="confirmation" type="email" placeholder={profile.email} required/></label><button className="admin-danger" type="submit">Sahkan kenaikan peranan</button></form></details>}</div>}
      </article>)}
    </div></section>
  </main>;
}
