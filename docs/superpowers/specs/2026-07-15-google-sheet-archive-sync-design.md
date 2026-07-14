# Google Sheet Archive Sync Design

## Context

ITU eAccess is now the live operational system. New scan, check-in, check-out, guest, and admin actions are stored in Supabase so the PWA remains fast and resilient. The legacy Google Spreadsheet remains important as the official archive because the original eAccess workflow started from Google Form responses.

The downloaded workbook `Rekod Keluar Masuk Bilik Dalam ITU (Responses).xlsx` shows this archive structure:

- `Form responses 1`: master Google Form response sheet with 480 rows and columns `Timestamp`, `Email address`, `KATEGORI`, `NAMA STAFF`, `LOKASI STAFF`, `NAMA PELATIH`, `LOKASI PELATIH`, `NAMA TETAMU`, `DARI MANA`, `TUJUAN`.
- `STAFF`: 106 rows with `Timestamp`, `Email address`, `KATEGORI`, `NAMA STAFF`, `LOKASI STAFF`, `STATUS`.
- `STUDENT`: 275 rows with `Timestamp`, `Email address`, `NAMA PELATIH`, `LOKASI PELATIH`, `STATUS`, `TAHUN`, `BULAN`, `JUMLAH PENGGUNAAN`.
- `TETAMU`: 99 rows with `Timestamp`, `Email address`, `NAMA TETAMU`, `DARI MANA`, `TUJUAN`, `STATUS`, `TAHUN`, `BULAN`, `JUMLAH PENGGUNAAN`.

## Decision

Supabase is the source of truth for live operations. Google Spreadsheet is an append-only official archive.

For the first implementation, ITU eAccess will append one row per movement event to the appropriate archive sheet:

- Staff check-in/check-out -> `STAFF`
- Pelatih check-in/check-out -> `STUDENT`
- Guest check-in/check-out -> `TETAMU`

The app will not write to `Form responses 1` initially because that sheet lacks a `STATUS` column. Keeping sync to category-specific sheets avoids changing the legacy master response sheet before the user explicitly approves that change.

## Data Mapping

### STAFF

| Spreadsheet column | eAccess value |
| --- | --- |
| `Timestamp` | movement timestamp in Malaysia time |
| `Email address` | profile email |
| `KATEGORI` | `STAFF` |
| `NAMA STAFF` | profile display name |
| `LOKASI STAFF` | location name |
| `STATUS` | `MASUK` or `KELUAR` |

### STUDENT

| Spreadsheet column | eAccess value |
| --- | --- |
| `Timestamp` | movement timestamp in Malaysia time |
| `Email address` | profile email |
| `NAMA PELATIH` | profile display name |
| `LOKASI PELATIH` | location name |
| `STATUS` | `MASUK` or `KELUAR` |
| `TAHUN` | current year from timestamp |
| `BULAN` | current month number from timestamp |
| `JUMLAH PENGGUNAAN` | blank for phase 1 |

### TETAMU

| Spreadsheet column | eAccess value |
| --- | --- |
| `Timestamp` | movement timestamp in Malaysia time |
| `Email address` | recording admin email for admin-entered guests; blank for future QR self-service guests |
| `NAMA TETAMU` | guest name |
| `DARI MANA` | guest organization |
| `TUJUAN` | guest purpose |
| `STATUS` | `MASUK` or `KELUAR` |
| `TAHUN` | current year from timestamp |
| `BULAN` | current month number from timestamp |
| `JUMLAH PENGGUNAAN` | blank for phase 1 |

## Architecture

The Google Spreadsheet will expose a Google Apps Script Web App endpoint. ITU eAccess will send a signed JSON payload to that endpoint after Supabase confirms the live operation.

Flow:

1. User/admin completes a movement action in ITU eAccess.
2. Supabase stores the movement first.
3. ITU eAccess fetches the enriched visit data needed for spreadsheet mapping.
4. ITU eAccess POSTs a JSON payload to the Apps Script webhook.
5. Apps Script verifies a shared secret token.
6. Apps Script appends the row to `STAFF`, `STUDENT`, or `TETAMU`.
7. If webhook sync fails, the live operation still succeeds; sync failure is logged server-side.

## Security

- The webhook URL and shared secret are server-only environment variables.
- The secret is sent in a request header, not exposed to browser JavaScript.
- The Apps Script rejects requests with a missing or wrong secret.
- The Apps Script appends rows only to known sheet names.

## Error Handling

Phase 1 does not block user actions when Google Sheet sync fails. This preserves the speed and reliability of Supabase-backed operations.

Phase 1 logs failed sync attempts. A later phase can add a durable `spreadsheet_sync_events` table and admin retry UI if the user wants guaranteed retry visibility.

## Scope

Included in phase 1:

- Apps Script webhook source file in the repo for the user to paste/deploy in Google Apps Script.
- Server-only env parsing for webhook URL and secret.
- Mapping helper and tests.
- Sync calls after user check-in/check-out and admin guest check-in/check-out.
- Documentation for Cloudflare environment variables and Apps Script deployment.

Excluded from phase 1:

- Writing to `Form responses 1`.
- Automatic retry queue UI.
- Google OAuth API integration.
- Bulk import of historical spreadsheet rows into Supabase.
- QR self-service guest registration.
