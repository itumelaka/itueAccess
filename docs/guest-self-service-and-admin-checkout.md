# Guest Self-Service and Admin User Checkout

## Features

### Admin user checkout

- Active admins can close an open `USER` visit from the admin dashboard.
- A reason of at least five characters is required.
- The database writes an `ADMIN_CHECK_OUT_USER` entry to `audit_logs`.
- Repeated requests are idempotent through `check_out_request_id`.
- A successful checkout is archived as a separate `KELUAR` row in `STAFF` or `STUDENT`.

### Guest self-service

- Each active location has a separate guest QR URL at `/guest/<LOCATION_CODE>`.
- Guests enter their name, organization and visit purpose without creating an account.
- Cloudflare Turnstile is verified on the server before Supabase is called.
- The server generates a random checkout token. Only its SHA-256 hash is stored.
- The raw token is kept in an HTTP-only, same-site cookie for 24 hours.
- The browser reuses a UUID for check-in retries, and the server refreshes the
  checkout token instead of creating another visit.
- A checkout retry with the same cookie returns the completed visit without
  creating a second `KELUAR` event.
- Guest `MASUK` and `KELUAR` events are archived to `TETAMU`.
- Admin guest checkout remains available as a fallback.

## Required Cloudflare variables

Add these Worker variables before enabling the guest QR publicly:

```text
NEXT_PUBLIC_TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Keep `TURNSTILE_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` secret. Do not prefix
them with `NEXT_PUBLIC_`.

## Database deployment

Apply migrations in filename order:

1. `202607280004_self_service_source.sql`
2. `202607280005_admin_and_guest_self_service.sql`

Run the database test suite before deploying the application.

## Operational checks

1. Force checkout one test user and confirm one audit-log record plus one
   spreadsheet `KELUAR` row.
2. Scan a guest QR, complete Turnstile and check in.
3. Confirm a `SELF_SERVICE` guest visit and a spreadsheet `MASUK` row.
4. Check out from the same browser and confirm `check_out_at` plus a spreadsheet
   `KELUAR` row.
5. Confirm an expired or unknown token cannot close another visit.
