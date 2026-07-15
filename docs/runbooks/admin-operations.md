# ITU eAccess Admin Operations Runbook

Dokumen ini menerangkan kerja harian admin untuk memantau rekod keluar masuk ITU eAccess.

## Dashboard admin

Route:

```text
/admin
```

Dashboard admin memaparkan:

- kad ringkasan semasa;
- penghuni semasa mengikut lokasi;
- senarai rekod lebih 12 jam;
- senarai semua rekod yang masih belum keluar.

## Panel `Masih berada dalam bilik`

Panel ini menyenaraikan semua rekod lawatan yang masih terbuka.

Maksud rekod terbuka:

```text
check_in_at ada
check_out_at masih kosong
```

Maklumat dipaparkan:

- nama;
- kategori;
- lokasi;
- masa masuk;
- jumlah jam berada di lokasi.

Jika tiada rekod terbuka, panel memaparkan:

```text
Tiada pengguna atau tetamu sedang berada dalam bilik.
```

## Panel `Lebih 12 jam`

Panel ini memaparkan rekod terbuka yang sudah lebih 12 jam.

Tujuan:

- kesan pengguna yang lupa scan keluar;
- bantu admin semak rekod luar biasa;
- elakkan dashboard menunjukkan orang masih berada dalam bilik terlalu lama.

Jika tiada rekod lebih 12 jam, panel memaparkan:

```text
Tiada rekod melebihi 12 jam.
```

## Rekod keluar manual

Gunakan butang:

```text
Rekod keluar manual
```

Hanya admin boleh gunakan tindakan ini.

Kesan tindakan:

1. Rekod lawatan terbuka ditutup di Supabase.
2. Masa keluar direkodkan menggunakan masa semasa server.
3. Rekod `KELUAR` dihantar ke Google Spreadsheet archive.
4. Dashboard admin dikemaskini.

Gunakan tindakan ini apabila:

- pengguna lupa scan keluar;
- tetamu sudah keluar tetapi rekod masih terbuka;
- admin sudah sahkan orang tersebut memang sudah tiada di lokasi.

Elakkan guna tindakan ini jika status sebenar belum pasti.

## Cara test selepas deploy

1. Login sebagai admin.
2. Buka `/admin`.
3. Pastikan panel `Lebih 12 jam` dan `Masih berada dalam bilik` muncul.
4. Buat satu scan masuk test melalui paparan pengguna.
5. Refresh `/admin`.
6. Pastikan rekod muncul di panel `Masih berada dalam bilik`.
7. Tekan `Rekod keluar manual`.
8. Pastikan rekod hilang daripada senarai semasa.
9. Semak Google Spreadsheet menerima row `KELUAR`.

## SQL/RPC berkaitan

Function Supabase:

```text
public.admin_check_out_visit(p_visit_id uuid, p_request_id uuid)
```

Migration:

```text
supabase/migrations/20260715093000_admin_check_out_visit.sql
```

Jika function ini belum wujud di Supabase production, butang keluar manual akan gagal walaupun UI sudah deploy.

## Verification sebelum push

```powershell
pnpm typecheck
pnpm test:run src/features/admin/dashboard-queries.test.ts src/features/admin/admin-actions.test.ts
```
