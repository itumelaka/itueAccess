import Link from "next/link";

const links = [
  ["/admin", "Ringkasan"],
  ["/admin/users", "Pengguna"],
  ["/admin/locations", "Lokasi & QR"],
  ["/admin/guests", "Tetamu"],
  ["/admin/history", "Sejarah"],
] as const;

export function AdminNav() {
  return (
    <nav className="admin-nav" aria-label="Navigasi admin">
      <Link className="admin-brand" href="/admin">ITU <strong>eAccess</strong></Link>
      <div className="admin-nav__links">
        {links.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
      </div>
      <Link className="admin-nav__exit" href="/history">Paparan pengguna</Link>
    </nav>
  );
}
