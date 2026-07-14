# Google Sheet Archive Sync Setup

Dokumen ini untuk fasa kecil pertama: deploy Google Apps Script webhook dan test manual append row ke spreadsheet responses lama.

## Tujuan

ITU eAccess akan kekal guna Supabase sebagai operasi live. Google Spreadsheet responses lama akan jadi salinan rasmi / arkib. Webhook ini menerima payload daripada ITU eAccess dan append row ke sheet:

- `STAFF`
- `STUDENT`
- `TETAMU`

## 1. Buka Apps Script dari spreadsheet asal

1. Buka Google Spreadsheet responses asal.
2. Pergi menu `Extensions`.
3. Pilih `Apps Script`.
4. Padam code contoh yang ada.
5. Paste semua kandungan dari:

```text
google-apps-script/itu-eaccess-archive-webhook.gs
```

## 2. Set secret token

Dalam Apps Script:

1. Pergi `Project Settings`.
2. Cari `Script properties`.
3. Klik `Add script property`.
4. Isi:

```text
Property: ITU_EACCESS_SYNC_SECRET
Value: letak-secret-panjang-sendiri
```

Contoh value jangan guna dalam production:

```text
itu-eaccess-test-secret-123
```

Untuk production nanti, guna secret panjang yang susah diteka.

## 3. Deploy sebagai Web App

1. Klik `Deploy`.
2. Pilih `New deployment`.
3. Tekan ikon gear / pilih type.
4. Pilih `Web app`.
5. Set:

```text
Execute as: Me
Who has access: Anyone
```

6. Klik `Deploy`.
7. Authorize ikut akaun Google yang pegang spreadsheet.
8. Copy `Web app URL`.

URL biasanya bermula dengan:

```text
https://script.google.com/macros/s/...
```

## 4. Test manual append row

Ganti dua nilai ini dulu:

```text
WEB_APP_URL = URL Web App Apps Script
SECRET = secret yang sama dalam Script Properties
```

### Test STAFF

Run di PowerShell:

```powershell
$url = "WEB_APP_URL?secret=SECRET"
$body = @{
  sheetName = "STAFF"
  values = @(
    "15-07-2026 10:00:00",
    "test.staff@example.com",
    "STAFF",
    "TEST STAFF",
    "BILIK SERVER",
    "MASUK"
  )
} | ConvertTo-Json
Invoke-RestMethod -Uri $url -Method Post -ContentType "application/json" -Body $body
```

Expected response:

```json
{"ok":true,"sheetName":"STAFF","appendedColumns":6}
```

Check sheet `STAFF`. Sepatutnya ada row baru di bawah.

### Test STUDENT / PELATIH

```powershell
$url = "WEB_APP_URL?secret=SECRET"
$body = @{
  sheetName = "STUDENT"
  values = @(
    "15-07-2026 10:05:00",
    "test.pelatih@example.com",
    "TEST PELATIH",
    "AUDITORIUM",
    "MASUK",
    2026,
    7,
    ""
  )
} | ConvertTo-Json
Invoke-RestMethod -Uri $url -Method Post -ContentType "application/json" -Body $body
```

Expected response:

```json
{"ok":true,"sheetName":"STUDENT","appendedColumns":8}
```

### Test TETAMU

```powershell
$url = "WEB_APP_URL?secret=SECRET"
$body = @{
  sheetName = "TETAMU"
  values = @(
    "15-07-2026 10:10:00",
    "admin@example.com",
    "TEST TETAMU",
    "TEST ORGANISASI",
    "TEST TUJUAN",
    "MASUK",
    2026,
    7,
    ""
  )
} | ConvertTo-Json
Invoke-RestMethod -Uri $url -Method Post -ContentType "application/json" -Body $body
```

Expected response:

```json
{"ok":true,"sheetName":"TETAMU","appendedColumns":9}
```

## 5. Test secret salah

Run:

```powershell
$url = "WEB_APP_URL?secret=SALAH"
$body = @{ sheetName = "STAFF"; values = @("test") } | ConvertTo-Json
Invoke-RestMethod -Uri $url -Method Post -ContentType "application/json" -Body $body
```

Expected response:

```json
{"ok":false,"error":"Unauthorized"}
```

## 6. Lepas test berjaya

Baru kita sambung fasa eAccess:

1. Tambah `SPREADSHEET_ARCHIVE_WEBHOOK_URL` dalam Cloudflare.
2. Tambah `SPREADSHEET_ARCHIVE_SECRET` dalam Cloudflare.
3. Coding eAccess untuk call webhook selepas Supabase berjaya simpan rekod.

Jangan commit atau letak real secret dalam GitHub.

## 7. Production deployment order

1. Deploy Apps Script Web App dan copy URL.
2. Add Cloudflare Worker environment variables:
   - `SPREADSHEET_ARCHIVE_WEBHOOK_URL`
   - `SPREADSHEET_ARCHIVE_SECRET`
3. Redeploy ITU eAccess dari GitHub/Cloudflare.
4. Test satu rekod staf/pelatih dan confirm row append ke `STAFF` atau `STUDENT`.
5. Test satu rekod tetamu dan confirm row append ke `TETAMU`.
