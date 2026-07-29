import Image from "next/image";
import type { ReactNode } from "react";

export function GuestSelfServiceLayout({
  children,
  locationName,
}: {
  children: ReactNode;
  locationName?: string;
}) {
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
            <strong>{locationName ?? "Pilih dalam borang"}</strong>
          </div>
        </header>
        {children}
        <footer className="guest-self-service__footer">
          Rekod ini digunakan untuk keselamatan dan pengurusan akses ITU.
        </footer>
      </div>
    </main>
  );
}