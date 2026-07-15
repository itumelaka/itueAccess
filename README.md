# ITU eAccess

PWA rekod keluar masuk bilik/lokasi ITU dengan Google login, dashboard admin, QR lokasi, Supabase sebagai operasi live, Cloudflare Workers sebagai hosting, dan Google Spreadsheet sebagai arkib rasmi.

## Status semasa

- PWA live: `https://itu-access.itumelaka.workers.dev`
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
- Tetamu didaftarkan oleh admin di kaunter.
- QR lokasi merekodkan masuk/keluar.
- Dashboard admin memaparkan ringkasan semasa, pengguna, lokasi, tetamu dan sejarah.
- PWA boleh dipasang tanpa Play Store.

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
- [Backup restore runbook](docs/runbooks/backup-restore.md)
