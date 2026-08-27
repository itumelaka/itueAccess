# ITU eAccess Project Overview

Dokumen ini ialah snapshot status projek setakat 27 Ogos 2026.

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

1. Tetamu scan Main Guest QR di pintu masuk.
2. Main Guest QR membuka `/guest`.
3. Tetamu memilih destinasi, mengisi maklumat lawatan dan melengkapkan Turnstile.
4. Sistem merekod tetamu masuk melalui guest self-service.
5. Bila tetamu keluar, checkout self-service atau checkout admin boleh digunakan.
6. Rekod tetamu juga dihantar ke Google Spreadsheet.

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
- Pantau pengguna/tetamu yang masih berada dalam bilik.
- Semak rekod yang melebihi 12 jam.
- Rekod keluar manual untuk pengguna/tetamu yang lupa scan keluar.
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
- `/guest` — pendaftaran tetamu utama dengan pemilihan destinasi.
- `/guest/[locationCode]` — route guest-lokasi backward-compatible; tidak dipaparkan sebagai QR pada kad lokasi admin.
- `/admin` — dashboard admin.
- `/admin/users` — urus pengguna.
- `/admin/locations` — lokasi dan QR.
- `/admin/guests` — kaunter tetamu.
- `/admin/history` — sejarah admin.

## Workflow QR production

Workflow berikut telah disahkan pada production `https://itu-access.itumelaka.workers.dev` pada 27 Ogos 2026 untuk implementation commit `9b5e466`:

- Admin → Locations memaparkan satu Main Guest QR di bahagian atas.
- Main Guest QR menyasarkan `/guest`, dan tetamu memilih destinasi dalam flow pendaftaran.
- Setiap kad lokasi memaparkan satu User QR sahaja, menggunakan payload sedia ada `/scan/[locationCode]`.
- Guest QR merah khusus lokasi tidak lagi dipaparkan pada kad lokasi.
- Route dan API guest-lokasi kekal tersedia untuk backward compatibility.
- User QR hitam yang telah dicetak kekal sah; tiada `locationCode` atau payload User QR berubah.
- Semua QR yang kelihatan menyediakan muat turun SVG HD:
  - `itu-eaccess-guest-main.svg`
  - `itu-eaccess-user-[locationCode].svg`

Verification production mengesahkan Main Guest SVG dan satu User SVG lokasi boleh dimuat turun, dibuka dan discan; destinasi `/guest`, pemilihan destinasi, serta `/scan/[locationCode]` semuanya berfungsi. Kad lokasi tidak memaparkan Guest QR merah dan halaman admin stabil semasa pemeriksaan berulang. Cloudflare Error 1102 sementara yang pernah diperhatikan tidak berulang dalam verification akhir. Punca sejarah Error 1102 tidak dikenal pasti dan tidak boleh dianggap telah diperbaiki.

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

## Dashboard admin

Dashboard admin mengandungi tiga aras pemantauan:

1. Kad ringkasan — jumlah dalam bilik, staf, pelatih, tetamu, rekod masuk/keluar hari ini, rekod lebih 12 jam dan akaun menunggu kelulusan.
2. Penghuni semasa mengikut lokasi — bar ringkas untuk melihat lokasi mana yang sedang digunakan.
3. Senarai operasi — panel `Lebih 12 jam` dan `Masih berada dalam bilik`.

Panel `Masih berada dalam bilik` menyenaraikan rekod lawatan yang belum ada `check_out_at`.

Panel `Lebih 12 jam` ialah subset kepada senarai semasa yang sudah melepasi had 12 jam. Ini membantu admin mengesan pengguna yang mungkin lupa scan keluar.

Kedua-dua panel menyediakan butang `Rekod keluar manual`. Tindakan ini:

1. Menutup rekod lawatan terbuka di Supabase melalui RPC `admin_check_out_visit`.
2. Menghantar salinan `KELUAR` ke Google Spreadsheet archive.
3. Refresh dashboard admin, sejarah dan kaunter tetamu.

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

Subset dashboard admin:

```powershell
pnpm test:run src/features/admin/dashboard-queries.test.ts src/features/admin/admin-actions.test.ts
```

## Roadmap cadangan

1. Kemaskan paparan mobile dashboard admin jika senarai operasi semakin panjang.
2. Tambah carian dan filter sejarah.
3. Tambah laporan ringkas ikut tarikh/lokasi/kategori.
4. Tambah notifikasi atau badge jelas untuk pending approval.
5. Pantau penggunaan dan kualiti cetakan SVG HD QR production.
6. Tambah backup/restore berkala Supabase.
7. Pertimbangkan custom domain jika perlu.
