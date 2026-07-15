# ITU eAccess Project Overview

Dokumen ini ialah snapshot status projek setakat 15 Julai 2026.

## Matlamat

Gantikan proses Google Form/Spreadsheet manual dengan PWA yang lebih laju, tetapi masih kekalkan Google Spreadsheet sebagai salinan rasmi/arkib.

Prinsip semasa:

```text
Supabase = operasi live
Google Spreadsheet = arkib rasmi / salinan responses
Cloudflare Workers = hosting production
```

## Aliran pengguna

### Pengguna staf/pelatih

1. Pengguna buka PWA.
2. Login dengan Google.
3. Jika akaun belum diluluskan, pengguna masuk page `Akaun menunggu kelulusan`.
4. Admin buka dashboard pengguna.
5. Admin isi/betulkan nama penuh, pilih kategori `Staf` atau `Pelatih`, kemudian luluskan.
6. Pengguna scan QR lokasi.
7. Sistem rekod masuk/keluar dalam Supabase.
8. Sistem hantar salinan rekod ke Google Spreadsheet.

### Tetamu

1. Tetamu datang ke kaunter.
2. Admin daftar tetamu melalui dashboard `Tetamu`.
3. Sistem rekod tetamu masuk.
4. Bila tetamu keluar, admin tutup rekod keluar dari dashboard.
5. Rekod tetamu juga dihantar ke Google Spreadsheet.

Nota: Tetamu tidak guna login Google buat masa ini.

## Aliran data

```text
PWA
  -> Supabase Auth
  -> Supabase Database
  -> Spreadsheet sync service
  -> Google Apps Script webhook
  -> Google Spreadsheet / Form responses 1
```

Jika sync spreadsheet gagal, operasi Supabase masih kekal sebagai rekod live. Google Spreadsheet boleh disemak kemudian melalui log/debug.

## Peranan

### ADMIN

- Akses dashboard admin.
- Lulus/tolak akaun baru.
- Tukar kategori pengguna.
- Gantung/aktifkan pengguna.
- Jadikan pengguna lain admin.
- Urus lokasi dan QR.
- Daftar dan keluarkan tetamu.
- Lihat sejarah.

### USER

- Scan QR untuk masuk/keluar.
- Lihat status semasa.
- Lihat sejarah sendiri.

## Status akaun

- `PENDING` — baru login, belum diluluskan.
- `ACTIVE` — boleh guna sistem.
- `SUSPENDED` — digantung atau ditolak.

## Kategori pengguna

- `STAFF`
- `PELATIH`
- `null` / tiada kategori

Kategori `TETAMU` tidak digunakan untuk akaun Google login. Tetamu dikendalikan melalui kaunter.

## Route penting

- `/` — paparan pengguna.
- `/install` — panduan install PWA.
- `/pending` — akaun menunggu kelulusan.
- `/suspended` — akaun digantung.
- `/history` — sejarah pengguna.
- `/scan/[locationCode]` — QR lokasi.
- `/admin` — dashboard admin.
- `/admin/users` — urus pengguna.
- `/admin/locations` — lokasi dan QR.
- `/admin/guests` — kaunter tetamu.
- `/admin/history` — sejarah admin.

## Google Spreadsheet archive

Target sebenar ialah tab:

```text
Form responses 1
```

Kolum raw:

| Kolum | Maksud |
|---|---|
| A | Timestamp |
| B | Email address |
| C | KATEGORI |
| D | NAMA STAFF |
| E | LOKASI STAFF |
| F | NAMA PELATIH |
| G | LOKASI PELATIH |
| H | NAMA TETAMU |
| I | DARI MANA |
| J | TUJUAN |
| K | STATUS |

Tab seperti `STAFF`, `STUDENT`, `TETAMU`, dan tab lokasi boleh kekal sebagai query/report tab yang tarik data daripada `Form responses 1`.

## Deployment

Production deploy:

```text
GitHub main -> Cloudflare Workers & Pages build -> itu-access.itumelaka.workers.dev
```

Build command:

```text
npx opennextjs-cloudflare build
```

Deploy command:

```text
npx wrangler deploy
```

Jika Cloudflare kata Git disconnected atau auto deploy tidak jalan, buat manual deploy/build dari dashboard Cloudflare.

## Pemeriksaan sebelum push

```powershell
pnpm typecheck
pnpm lint
pnpm test:run
```

Subset pantas:

```powershell
pnpm test:run src/features/admin/admin-actions.test.ts src/features/admin/admin-inputs.test.ts src/features/spreadsheet/archive-sync.test.ts src/features/visits/visit-actions.test.ts
```

## Roadmap cadangan

1. Kemaskan paparan mobile dashboard admin.
2. Tambah carian dan filter sejarah.
3. Tambah laporan ringkas ikut tarikh/lokasi/kategori.
4. Tambah notifikasi atau badge jelas untuk pending approval.
5. Kemaskan print/export QR lokasi.
6. Tambah backup/restore berkala Supabase.
7. Pertimbangkan custom domain jika perlu.
