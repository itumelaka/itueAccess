# Google Sheet Archive Sync

Dokumen ini menerangkan sync rekod ITU eAccess ke Google Spreadsheet asal.

## Tujuan

ITU eAccess guna Supabase untuk operasi live yang laju. Google Spreadsheet asal kekal sebagai salinan rasmi / arkib responses.

Aliran:

```text
PWA scan / admin daftar tetamu / admin keluar manual
  -> Supabase
  -> Spreadsheet archive sync
  -> Google Apps Script webhook
  -> Google Spreadsheet tab "Form responses 1"
```

## Target sheet sebenar

Webhook Apps Script append semua rekod ke:

```text
Form responses 1
```

Tab lain seperti `STAFF`, `STUDENT`, `TETAMU`, `BILIK SERVER`, `AUDITORIUM` dan sebagainya boleh kekal sebagai tab formula/query/report.

## Struktur kolum Form responses 1

| Kolum | Header |
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

## Mapping data

### STAFF

| Kolum | Isi |
|---|---|
| A | Timestamp |
| B | Email address |
| C | `STAFF` |
| D | Nama staf |
| E | Lokasi |
| K | `MASUK` / `KELUAR` |

### PELATIH

| Kolum | Isi |
|---|---|
| A | Timestamp |
| B | Email address |
| C | `PELATIH` |
| F | Nama pelatih |
| G | Lokasi |
| K | `MASUK` / `KELUAR` |

### TETAMU

| Kolum | Isi |
|---|---|
| A | Timestamp |
| B | Email admin/recorder |
| C | `TETAMU` |
| H | Nama tetamu |
| I | Dari mana / organisasi |
| J | Tujuan |
| K | `MASUK` / `KELUAR` |

## Rekod keluar manual admin

Jika pengguna atau tetamu lupa scan keluar, admin boleh tutup rekod melalui dashboard admin.

Aliran sync:

```text
Admin tekan "Rekod keluar manual"
  -> RPC Supabase admin_check_out_visit
  -> visits.check_out_at dikemaskini
  -> archive sync hantar status KELUAR
  -> Google Spreadsheet Form responses 1
```

Untuk akaun Google login:

- `STAFF` masuk mapping STAFF.
- `PELATIH` masuk mapping PELATIH.
- Akaun admin tanpa kategori akan dianggap `STAFF` oleh archive resolver.

Untuk tetamu:

- Nama, organisasi dan tujuan diambil daripada rekod tetamu asal.
- Email kolum B ialah email admin/recorder.

## Apps Script

Kod penuh disimpan di:

```text
google-apps-script/itu-eaccess-archive-webhook.gs
```

Jika perlu update Apps Script:

1. Buka Google Spreadsheet asal.
2. Pergi `Extensions` -> `Apps Script`.
3. Paste kandungan file tersebut.
4. Save.
5. `Deploy` -> `Manage deployments` -> edit deployment sedia ada.
6. Pilih `New version`.
7. Deploy.

Pastikan deployment:

```text
Execute as: Me
Who has access: Anyone
```

## Secret

Dalam Apps Script `Project Settings` -> `Script properties`:

```text
Property: ITU_EACCESS_SYNC_SECRET
Value: secret panjang sendiri
```

Secret yang sama perlu ada di Cloudflare sebagai:

```text
SPREADSHEET_ARCHIVE_SECRET
```

Jangan commit secret sebenar ke GitHub.

## Cloudflare variables/secrets

Production Worker perlu ada:

```text
SPREADSHEET_ARCHIVE_WEBHOOK_URL
SPREADSHEET_ARCHIVE_SECRET
```

Masukkan melalui Cloudflare dashboard atau Wrangler:

```powershell
pnpm wrangler secret put SPREADSHEET_ARCHIVE_WEBHOOK_URL
pnpm wrangler secret put SPREADSHEET_ARCHIVE_SECRET
```

Selepas ubah secret/variable, redeploy Worker.

## Manual test webhook

Ganti URL dan secret dengan nilai sebenar di komputer sendiri. Jangan commit.

```powershell
$webAppUrl = "PASTE_APPS_SCRIPT_WEB_APP_URL"
$secret = "PASTE_SECRET"
$uri = "$($webAppUrl)?secret=$secret"

$body = @{
  sheetName = "STAFF"
  values = @(
    "15-07-2026 09:10:03",
    "test@itu.local",
    "STAFF TEST RAW",
    "BILIK SERVER",
    "MASUK",
    2026
  )
} | ConvertTo-Json

Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json" -Body $body
```

Expected response:

```text
ok              : True
targetSheet     : Form responses 1
sourceSheetName : STAFF
appendedColumns : 11
```

Kemudian semak row baru di `Form responses 1`.

## Troubleshooting

### Data masuk Supabase tapi tidak masuk Spreadsheet

Semak:

1. Cloudflare secret `SPREADSHEET_ARCHIVE_WEBHOOK_URL`.
2. Cloudflare secret `SPREADSHEET_ARCHIVE_SECRET`.
3. Apps Script deployment masih aktif.
4. Apps Script secret `ITU_EACCESS_SYNC_SECRET`.
5. Webhook manual test berjaya.

### Status masuk kolum salah

Pastikan Apps Script dalam spreadsheet ialah versi terbaru daripada:

```text
google-apps-script/itu-eaccess-archive-webhook.gs
```

Status mesti masuk kolum `K`.

### Tarikh pelik

Aplikasi format timestamp ikut timezone Malaysia (`Asia/Kuala_Lumpur`) sebelum hantar ke spreadsheet.
