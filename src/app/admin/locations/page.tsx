import Image from "next/image";
import { headers } from "next/headers";
import QRCode from "qrcode";

import { createLocation, toggleLocation } from "@/features/admin/admin-actions";
import { requireProfile } from "@/features/auth/require-profile";
import {
  MAIN_GUEST_QR_FILE_NAME,
  locationQrPath,
  qrDownloadFileName,
} from "@/features/locations/qr-download";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const qrOptions = {
  width: 220,
  margin: 1,
  color: { dark: "#173B70", light: "#FFFFFF" },
};

export default async function AdminLocationsPage() {
  await requireProfile("ADMIN");
  const supabase = await createSupabaseServerClient();
  const { data: locations } = await supabase
    .from("locations")
    .select("id, name, code, is_active")
    .order("name");
  const requestHeaders = await headers();
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const publicOrigin = `${protocol}://${host}`;
  const mainGuestUrl = `${publicOrigin}/guest`;
  const mainGuestQr = await QRCode.toDataURL(mainGuestUrl, {
    ...qrOptions,
    color: { dark: "#9A0020", light: "#FFFFFF" },
  });
  const rows = await Promise.all(
    (locations ?? []).map(async (location) => {
      const scanPath = locationQrPath(location.code, "user");
      const guestPath = locationQrPath(location.code, "guest");
      const scanUrl = `${publicOrigin}${scanPath}`;
      const guestUrl = `${publicOrigin}${guestPath}`;

      return {
        ...location,
        scanUrl,
        qr: await QRCode.toDataURL(scanUrl, qrOptions),
        qrDownloadUrl: `/api/qr/${encodeURIComponent(location.code)}?name=${encodeURIComponent(location.name)}`,
        qrFileName: qrDownloadFileName(location.name, location.code, "user"),
        guestUrl,
        guestQr: await QRCode.toDataURL(guestUrl, {
          ...qrOptions,
          color: { dark: "#9A0020", light: "#FFFFFF" },
        }),
        guestQrDownloadUrl: `/api/qr/${encodeURIComponent(location.code)}?audience=guest&name=${encodeURIComponent(location.name)}`,
        guestQrFileName: qrDownloadFileName(
          location.name,
          location.code,
          "guest",
        ),
      };
    }),
  );

  return (
    <main>
      <header className="admin-page-header">
        <div>
          <p className="admin-kicker">Konfigurasi</p>
          <h1>Lokasi & kod QR</h1>
          <p>Setiap lokasi mempunyai QR pengguna dan QR self-service tetamu.</p>
        </div>
      </header>

      <section className="admin-panel qr-main-card" aria-labelledby="main-guest-qr-title">
        <div className="qr-main-card__copy">
          <p className="admin-kicker">Disyorkan untuk pintu utama</p>
          <h2 id="main-guest-qr-title">QR Pendaftaran Tetamu ITU</h2>
          <p>
            Gunakan QR utama ini di pintu masuk. Tetamu akan memilih destinasi
            sebelum mendaftar masuk.
          </p>
          <a
            className="admin-primary"
            href="/api/qr/guest-registration"
            download={MAIN_GUEST_QR_FILE_NAME}
          >
            Muat turun QR Tetamu Utama
          </a>
        </div>
        <div className="qr-main-card__visual">
          <Image
            src={mainGuestQr}
            width={220}
            height={220}
            alt="Kod QR pendaftaran tetamu ITU"
            unoptimized
          />
          <a className="qr-card__url" href={mainGuestUrl}>
            {mainGuestUrl}
          </a>
        </div>
      </section>

      <section className="admin-panel">
        <div className="panel-heading">
          <h2>Tambah lokasi</h2>
        </div>
        <form action={createLocation} className="admin-form admin-form--row">
          <label>
            Nama lokasi
            <input name="name" placeholder="Contoh: Bilik Server" required />
          </label>
          <label>
            Kod ringkas <small>(boleh dibiarkan kosong)</small>
            <input name="code" placeholder="BILIK-SERVER" />
          </label>
          <button className="admin-primary" type="submit">
            Tambah lokasi
          </button>
        </form>
      </section>

      <section className="qr-grid" aria-label="QR lokasi pilihan">
        {rows.map((location) => (
          <article
            className={`qr-card ${location.is_active ? "" : "qr-card--inactive"}`}
            key={location.id}
          >
            <div className="qr-card__top">
              <div>
                <h2>{location.name}</h2>
                <code>{location.code}</code>
              </div>
              <span
                className={`status status--${location.is_active ? "active" : "suspended"}`}
              >
                {location.is_active ? "AKTIF" : "TIDAK AKTIF"}
              </span>
            </div>
            <div className="qr-card__codes">
              <div>
                <strong>Pengguna</strong>
                <Image
                  src={location.qr}
                  width={220}
                  height={220}
                  alt={`Kod QR pengguna ${location.name}`}
                  unoptimized
                />
                <a className="qr-card__url" href={location.scanUrl}>
                  {location.scanUrl}
                </a>
                <a
                  className="admin-primary"
                  href={location.qrDownloadUrl}
                  download={location.qrFileName}
                >
                  Muat turun QR pengguna
                </a>
              </div>
              <div>
                <strong>Tetamu lokasi</strong>
                <Image
                  src={location.guestQr}
                  width={220}
                  height={220}
                  alt={`Kod QR tetamu ${location.name}`}
                  unoptimized
                />
                <a className="qr-card__url" href={location.guestUrl}>
                  {location.guestUrl}
                </a>
                <a
                  className="admin-primary"
                  href={location.guestQrDownloadUrl}
                  download={location.guestQrFileName}
                >
                  Muat turun QR tetamu
                </a>
              </div>
            </div>
            <div className="qr-card__actions">
              <form action={toggleLocation}>
                <input type="hidden" name="locationId" value={location.id} />
                <input
                  type="hidden"
                  name="isActive"
                  value={String(location.is_active)}
                />
                <button className="admin-secondary" type="submit">
                  {location.is_active ? "Nyahaktifkan" : "Aktifkan semula"}
                </button>
              </form>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}