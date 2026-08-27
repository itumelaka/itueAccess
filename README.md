# ITU eAccess

PWA rekod keluar masuk bilik/lokasi ITU dengan Google login, dashboard admin, QR lokasi, Supabase sebagai operasi live, Cloudflare Workers sebagai hosting, dan Google Spreadsheet sebagai arkib rasmi.

## Status semasa

- PWA live: `https://itu-access.itumelaka.workers.dev`
- Workflow QR production disahkan pada 27 Ogos 2026 melalui commit `9b5e466`.
- Login Google melalui Supabase Auth.
- Admin utama: akaun Google ITU Melaka.
- Data operasi live disimpan dalam Supabase.
- Salinan rekod rasmi dihantar ke Google Spreadsheet asal melalui Google Apps Script webhook.
- Deployment production dibuat melalui Cloudflare Workers & Pages dari branch `main`.

## Fungsi utama

- Pengguna login Google.
- Akaun baru masuk status `PENDING`.
- Admin boleh luluskan, tolak, gantung, aktifkan dan jadikan admin.
- Admin boleh betulkan nama penuh dan kategori pengguna.
- Kategori pengguna Google login: `STAFF` atau `PELATIH`.
- Tetamu boleh scan satu Main Guest QR, pilih destinasi dan daftar masuk sendiri.
- Setiap kad lokasi memaparkan satu User QR sedia ada untuk rekod masuk/keluar pengguna.
- Dashboard admin memaparkan ringkasan semasa, pengguna, lokasi, tetamu dan sejarah.
- Dashboard admin memaparkan senarai penghuni semasa dan rekod lebih 12 jam.
- Admin boleh rekod keluar manual jika pengguna/tetamu lupa scan keluar.
- PWA boleh dipasang tanpa Play Store.

## Workflow QR production

- Admin → Locations memaparkan satu Main Guest QR di bahagian atas halaman.
- Main Guest QR menyasarkan `/guest`; tetamu memilih destinasi semasa pendaftaran.
- Setiap kad lokasi hanya memaparkan User QR yang menyasarkan `/scan/[locationCode]`.
- QR Guest merah khusus lokasi tidak lagi dipaparkan dalam UI admin.
- Route dan API guest-lokasi sedia ada masih dikekalkan untuk backward compatibility.
- User QR hitam yang telah dicetak kekal sah kerana `locationCode` dan payload `/scan/[locationCode]` tidak berubah.
- Semua QR yang dipaparkan mempunyai muat turun SVG HD tanpa had resolusi cetakan:
  - Main Guest: `itu-eaccess-guest-main.svg`
  - User lokasi: `itu-eaccess-user-[locationCode].svg`

Production verification pada 27 Ogos 2026 mengesahkan kedua-dua SVG boleh dimuat turun, dibuka dan discan. Main Guest QR membuka `/guest`, pemilihan destinasi berfungsi, dan User QR lokasi membuka `/scan/[locationCode]`. Kad lokasi tidak lagi menunjukkan Guest QR merah. Halaman admin kekal stabil semasa pemeriksaan berulang; Cloudflare Error 1102 sementara yang pernah dilihat tidak berulang dalam verification akhir, tetapi punca sejarahnya belum dikenal pasti atau disahkan telah diperbaiki.

## Stack

- Next.js
- React
- Supabase
- Cloudflare Workers / OpenNext
- Google Apps Script
- Google Spreadsheet
- pnpm

## Struktur penting

```text
src/app/                    Route aplikasi
src/features/admin/          Dashboard admin dan server actions admin
src/features/visits/         Logik scan QR dan rekod keluar/masuk
src/features/spreadsheet/    Sync arkib ke Google Spreadsheet
supabase/migrations/         Struktur database dan fungsi SQL
google-apps-script/          Kod webhook Apps Script untuk spreadsheet
docs/                        Dokumentasi projek dan runbook
public/                      Asset PWA, logo dan service worker
```

## Local development

Repo kerja utama disyorkan:

```powershell
cd "D:\Projects\itu-access"
pnpm install
pnpm dev
```

Semak sebelum push:

```powershell
pnpm typecheck
pnpm lint
pnpm test:run
```

Untuk test subset yang selalu kita guna:

```powershell
pnpm test:run src/features/admin/admin-actions.test.ts src/features/admin/admin-inputs.test.ts src/features/spreadsheet/archive-sync.test.ts src/features/visits/visit-actions.test.ts
```

Untuk perubahan dashboard admin:

```powershell
pnpm test:run src/features/admin/dashboard-queries.test.ts src/features/admin/admin-actions.test.ts
```

## Environment variables

`.env.local` diperlukan untuk local:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_FALLBACK_FORM_URL=
SPREADSHEET_ARCHIVE_WEBHOOK_URL=
SPREADSHEET_ARCHIVE_SECRET=
```

Jangan commit `.env.local` atau secret sebenar.

Cloudflare production perlu ada variables/secrets:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_FALLBACK_FORM_URL`
- `SPREADSHEET_ARCHIVE_WEBHOOK_URL`
- `SPREADSHEET_ARCHIVE_SECRET`

## Deploy production

Deployment paling stabil sekarang:

1. Push ke GitHub branch `main`.
2. Buka Cloudflare Workers & Pages project `itu-access`.
3. Trigger build/deploy dari dashboard Cloudflare jika auto build tidak jalan.

Local deploy dari Windows pernah terkena isu permission OpenNext. Jika mahu local deploy, lebih baik guna WSL kemudian.

## Dokumentasi lanjut

- [Project overview](docs/project-overview.md)
- [Google Sheet archive sync](docs/google-sheet-archive-sync.md)
- [Admin operations runbook](docs/runbooks/admin-operations.md)
- [Backup restore runbook](docs/runbooks/backup-restore.md)
