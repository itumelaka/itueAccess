# Google Sheet Archive Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Append new ITU eAccess movement events from Supabase-backed operations to the legacy Google Spreadsheet archive sheets `STAFF`, `STUDENT`, and `TETAMU`.

**Architecture:** Supabase remains the live source of truth. After each successful movement action, server-side code maps the enriched visit record to a spreadsheet archive payload and POSTs it to a Google Apps Script webhook protected by a shared secret. Sync failures do not block check-in/check-out.

**Tech Stack:** Next.js 16 server actions, Supabase RPC and table queries, Google Apps Script Web App, TypeScript, Vitest, Cloudflare Workers environment variables.

## Global Constraints

- Supabase remains the live operational database.
- Google Spreadsheet is an append-only archive, not the live dependency.
- Phase 1 writes only to `STAFF`, `STUDENT`, and `TETAMU`.
- Phase 1 does not write to `Form responses 1`.
- Webhook URL and secret must be server-only and must not be exposed via `NEXT_PUBLIC_*`.
- Sync failure must not cause the user's live check-in/check-out action to fail.
- No paid API is required.

---

## File Structure

- Create `google-apps-script/itu-eaccess-archive-webhook.gs` to hold the Apps Script code the user deploys on the target spreadsheet.
- Create `src/features/spreadsheet/archive-sync.ts` for mapping, webhook request construction, and best-effort sync.
- Create `src/features/spreadsheet/archive-sync.test.ts` for mapping and webhook behavior tests.
- Modify `src/lib/env.ts` to add server-only archive sync environment parsing.
- Modify `src/features/visits/visit-actions.ts` to sync user check-in/check-out after RPC success.
- Modify `src/features/admin/admin-actions.ts` to sync guest check-in/check-out after RPC success.
- Modify `.env.example` to document required variables.
- Modify docs or add `docs/google-sheet-archive-sync.md` for setup instructions.

---

### Task 1: Apps Script Webhook

**Files:**
- Create: `google-apps-script/itu-eaccess-archive-webhook.gs`
- Create: `docs/google-sheet-archive-sync.md`

**Interfaces:**
- Consumes: JSON payload `{ sheetName: "STAFF" | "STUDENT" | "TETAMU", values: string[] }`
- Produces: Apps Script `doPost(e)` endpoint returning JSON `{ ok: true }` or `{ ok: false, error: string }`

- [ ] **Step 1: Create the Apps Script webhook file**

Write `google-apps-script/itu-eaccess-archive-webhook.gs`:

```javascript
const ITU_EACCESS_ALLOWED_SHEETS = new Set(["STAFF", "STUDENT", "TETAMU"]);

function jsonResponse(payload, statusCode) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const expectedSecret = PropertiesService.getScriptProperties().getProperty("ITU_EACCESS_SYNC_SECRET");
    const providedSecret = e.parameter.secret || "";
    if (!expectedSecret || providedSecret !== expectedSecret) {
      return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
    }

    const payload = JSON.parse(e.postData.contents || "{}");
    const sheetName = String(payload.sheetName || "").trim();
    const values = Array.isArray(payload.values) ? payload.values : null;

    if (!ITU_EACCESS_ALLOWED_SHEETS.has(sheetName)) {
      return jsonResponse({ ok: false, error: "Invalid sheetName" }, 400);
    }
    if (!values || values.length === 0) {
      return jsonResponse({ ok: false, error: "Missing values" }, 400);
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      return jsonResponse({ ok: false, error: "Sheet not found: " + sheetName }, 404);
    }

    sheet.appendRow(values);
    return jsonResponse({ ok: true }, 200);
  } catch (error) {
    return jsonResponse({ ok: false, error: String(error && error.message ? error.message : error) }, 500);
  }
}
```

- [ ] **Step 2: Write setup documentation**

Write `docs/google-sheet-archive-sync.md` with:

```markdown
# Google Sheet Archive Sync Setup

1. Open the original Google Spreadsheet responses file.
2. Go to Extensions -> Apps Script.
3. Paste `google-apps-script/itu-eaccess-archive-webhook.gs`.
4. Set Script Property:
   - Key: `ITU_EACCESS_SYNC_SECRET`
   - Value: a long random secret chosen by admin
5. Deploy -> New deployment -> Web app.
6. Execute as: Me.
7. Who has access: Anyone with the link.
8. Copy the Web App URL.
9. Add Cloudflare Worker environment variables:
   - `SPREADSHEET_ARCHIVE_WEBHOOK_URL`
   - `SPREADSHEET_ARCHIVE_SECRET`
10. Redeploy ITU eAccess.
```

- [ ] **Step 3: Verify no secrets are committed**

Run: `rg -n "SPREADSHEET_ARCHIVE_SECRET|ITU_EACCESS_SYNC_SECRET|script.google.com" .`

Expected: only placeholder names appear; no real secret or deployment URL appears.

- [ ] **Step 4: Commit**

Run:

```bash
git add google-apps-script/itu-eaccess-archive-webhook.gs docs/google-sheet-archive-sync.md
git commit -m "docs: add google sheet archive webhook setup"
```

---

### Task 2: Archive Mapping and Webhook Client

**Files:**
- Create: `src/features/spreadsheet/archive-sync.ts`
- Create: `src/features/spreadsheet/archive-sync.test.ts`
- Modify: `src/lib/env.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `archiveUserMovement(input): ArchivePayload`
- Produces: `archiveGuestMovement(input): ArchivePayload`
- Produces: `syncArchivePayload(payload, fetchImpl?): Promise<{ ok: boolean; message?: string }>`

- [ ] **Step 1: Write mapping tests**

Create `src/features/spreadsheet/archive-sync.test.ts`:

```typescript
import { describe, expect, it, vi } from "vitest";

import {
  archiveGuestMovement,
  archiveUserMovement,
  syncArchivePayload,
} from "./archive-sync";

describe("archiveUserMovement", () => {
  it("maps staff movement to STAFF sheet", () => {
    expect(archiveUserMovement({
      status: "MASUK",
      occurredAt: "2026-07-15T01:30:00.000Z",
      email: "staff@example.com",
      displayName: "Staff One",
      category: "STAFF",
      locationName: "BILIK SERVER",
    })).toEqual({
      sheetName: "STAFF",
      values: [
        "15/07/2026 09:30:00",
        "staff@example.com",
        "STAFF",
        "Staff One",
        "BILIK SERVER",
        "MASUK",
      ],
    });
  });

  it("maps pelatih movement to STUDENT sheet", () => {
    expect(archiveUserMovement({
      status: "KELUAR",
      occurredAt: "2026-07-15T01:30:00.000Z",
      email: "pelatih@example.com",
      displayName: "Pelatih One",
      category: "PELATIH",
      locationName: "AUDITORIUM",
    })).toEqual({
      sheetName: "STUDENT",
      values: [
        "15/07/2026 09:30:00",
        "pelatih@example.com",
        "Pelatih One",
        "AUDITORIUM",
        "KELUAR",
        2026,
        7,
        "",
      ],
    });
  });
});

describe("archiveGuestMovement", () => {
  it("maps guest movement to TETAMU sheet", () => {
    expect(archiveGuestMovement({
      status: "MASUK",
      occurredAt: "2026-07-15T01:30:00.000Z",
      recorderEmail: "admin@example.com",
      guestName: "Tetamu One",
      organization: "Jabatan",
      purpose: "Mesyuarat",
    })).toEqual({
      sheetName: "TETAMU",
      values: [
        "15/07/2026 09:30:00",
        "admin@example.com",
        "Tetamu One",
        "Jabatan",
        "Mesyuarat",
        "MASUK",
        2026,
        7,
        "",
      ],
    });
  });
});

describe("syncArchivePayload", () => {
  it("returns skipped when env is missing", async () => {
    const fetchImpl = vi.fn();
    await expect(syncArchivePayload({ sheetName: "STAFF", values: [] }, fetchImpl)).resolves.toEqual({
      ok: false,
      message: "Spreadsheet archive sync is not configured",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test:run src/features/spreadsheet/archive-sync.test.ts`

Expected: FAIL because `archive-sync.ts` does not exist.

- [ ] **Step 3: Implement mapping and best-effort webhook client**

Create `src/features/spreadsheet/archive-sync.ts`:

```typescript
type ArchiveStatus = "MASUK" | "KELUAR";
type UserCategory = "STAFF" | "PELATIH";
type ArchiveSheetName = "STAFF" | "STUDENT" | "TETAMU";

export type ArchivePayload = {
  sheetName: ArchiveSheetName;
  values: Array<string | number>;
};

export type UserMovementInput = {
  status: ArchiveStatus;
  occurredAt: string;
  email: string;
  displayName: string;
  category: UserCategory | null;
  locationName: string;
};

export type GuestMovementInput = {
  status: ArchiveStatus;
  occurredAt: string;
  recorderEmail: string;
  guestName: string;
  organization: string | null;
  purpose: string | null;
};

function malaysiaDateParts(isoDate: string) {
  const date = new Date(isoDate);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    timestamp: `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}:${get("second")}`,
    year: Number(get("year")),
    month: Number(get("month")),
  };
}

export function archiveUserMovement(input: UserMovementInput): ArchivePayload | null {
  const date = malaysiaDateParts(input.occurredAt);
  if (input.category === "STAFF") {
    return {
      sheetName: "STAFF",
      values: [
        date.timestamp,
        input.email,
        "STAFF",
        input.displayName,
        input.locationName,
        input.status,
      ],
    };
  }
  if (input.category === "PELATIH") {
    return {
      sheetName: "STUDENT",
      values: [
        date.timestamp,
        input.email,
        input.displayName,
        input.locationName,
        input.status,
        date.year,
        date.month,
        "",
      ],
    };
  }
  return null;
}

export function archiveGuestMovement(input: GuestMovementInput): ArchivePayload {
  const date = malaysiaDateParts(input.occurredAt);
  return {
    sheetName: "TETAMU",
    values: [
      date.timestamp,
      input.recorderEmail,
      input.guestName,
      input.organization ?? "",
      input.purpose ?? "",
      input.status,
      date.year,
      date.month,
      "",
    ],
  };
}

export async function syncArchivePayload(
  payload: ArchivePayload | null,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: boolean; message?: string }> {
  if (!payload) return { ok: false, message: "No archive payload to sync" };

  const url = process.env.SPREADSHEET_ARCHIVE_WEBHOOK_URL;
  const secret = process.env.SPREADSHEET_ARCHIVE_SECRET;
  if (!url || !secret) {
    return { ok: false, message: "Spreadsheet archive sync is not configured" };
  }

  try {
    const response = await fetchImpl(`${url}?secret=${encodeURIComponent(secret)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return { ok: false, message: `Spreadsheet archive sync failed: ${response.status}` };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Spreadsheet archive sync failed",
    };
  }
}
```

- [ ] **Step 4: Document server-only env vars**

Append to `.env.example`:

```text
# Optional Google Sheet archive sync
SPREADSHEET_ARCHIVE_WEBHOOK_URL=
SPREADSHEET_ARCHIVE_SECRET=
```

- [ ] **Step 5: Run focused tests**

Run: `pnpm test:run src/features/spreadsheet/archive-sync.test.ts`

Expected: PASS.

- [ ] **Step 6: Run typecheck**

Run: `pnpm typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```bash
git add src/features/spreadsheet/archive-sync.ts src/features/spreadsheet/archive-sync.test.ts .env.example
git commit -m "feat: map visits to spreadsheet archive rows"
```

---

### Task 3: Sync User Check-In and Check-Out

**Files:**
- Modify: `src/features/visits/visit-actions.ts`
- Modify: `src/features/visits/visit-actions.test.ts`

**Interfaces:**
- Consumes: `archiveUserMovement()` and `syncArchivePayload()` from Task 2.
- Produces: User check-in/check-out server/client action still returns success even when sync fails.

- [ ] **Step 1: Add tests for non-blocking sync**

Update `src/features/visits/visit-actions.test.ts` with tests that mock a successful `check_in` RPC, an enriched Supabase read, and a failing sync. Assert the action still returns `{ ok: true }`.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `pnpm test:run src/features/visits/visit-actions.test.ts`

Expected: FAIL until sync integration is implemented.

- [ ] **Step 3: Implement sync after successful RPC**

In `src/features/visits/visit-actions.ts`, after RPC success:

1. Query the created visit with `profiles(email, display_name, category)` and `locations(name)`.
2. Build archive payload:
   - `MASUK` uses `data.check_in_at`.
   - `KELUAR` uses `data.check_out_at`.
3. Await `syncArchivePayload(payload)` but do not throw on `{ ok: false }`.
4. Keep existing return shape unchanged.

- [ ] **Step 4: Run focused tests**

Run: `pnpm test:run src/features/visits/visit-actions.test.ts src/features/spreadsheet/archive-sync.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/features/visits/visit-actions.ts src/features/visits/visit-actions.test.ts
git commit -m "feat: sync user visits to sheet archive"
```

---

### Task 4: Sync Admin Guest Check-In and Check-Out

**Files:**
- Modify: `src/features/admin/admin-actions.ts`
- Modify: `src/features/admin/admin-inputs.test.ts` or create `src/features/admin/admin-actions.test.ts`

**Interfaces:**
- Consumes: `archiveGuestMovement()` and `syncArchivePayload()` from Task 2.
- Produces: Guest registration and guest checkout still complete even when archive sync fails.

- [ ] **Step 1: Add tests for guest archive mapping through admin actions**

Create or extend admin action tests to cover:

- `registerGuest` calls `register_guest`, fetches visit details, and calls sync with `TETAMU` `MASUK`.
- `checkOutGuest` calls `admin_check_out_guest`, fetches visit details, and calls sync with `TETAMU` `KELUAR`.
- A sync failure does not throw from the admin action.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm test:run src/features/admin/admin-actions.test.ts`

Expected: FAIL until sync integration is implemented.

- [ ] **Step 3: Implement guest sync**

In `src/features/admin/admin-actions.ts`, after each guest RPC succeeds:

1. Fetch visit with `guest_name`, `guest_organization`, `guest_purpose`, `check_in_at`, `check_out_at`, and `profiles!visits_recorded_by_fkey(email)`.
2. Build `archiveGuestMovement()` payload.
3. Await `syncArchivePayload(payload)` without throwing on sync failure.
4. Keep existing `revalidatePath()` calls.

- [ ] **Step 4: Run focused tests**

Run: `pnpm test:run src/features/admin/admin-actions.test.ts src/features/spreadsheet/archive-sync.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/features/admin/admin-actions.ts src/features/admin/admin-actions.test.ts
git commit -m "feat: sync guest visits to sheet archive"
```

---

### Task 5: Final Verification and Deployment Notes

**Files:**
- Modify: `docs/google-sheet-archive-sync.md`

**Interfaces:**
- Consumes: Implemented sync behavior from Tasks 1-4.
- Produces: Verified local app and clear production deployment steps.

- [ ] **Step 1: Run full verification**

Run:

```bash
pnpm test:run
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all commands exit 0.

- [ ] **Step 2: Update setup docs with deployment order**

Add this section to `docs/google-sheet-archive-sync.md`:

```markdown
## Production deployment order

1. Deploy Apps Script Web App and copy the URL.
2. Add `SPREADSHEET_ARCHIVE_WEBHOOK_URL` and `SPREADSHEET_ARCHIVE_SECRET` to Cloudflare Worker environment variables.
3. Redeploy ITU eAccess from GitHub/Cloudflare.
4. Test one staff/pelatih movement and confirm row appended to `STAFF` or `STUDENT`.
5. Test one guest movement and confirm row appended to `TETAMU`.
```

- [ ] **Step 3: Commit**

Run:

```bash
git add docs/google-sheet-archive-sync.md
git commit -m "docs: document spreadsheet archive deployment"
```

---

## Self-Review

- Spec coverage: the plan covers Apps Script, mapping, env setup, user movement sync, guest movement sync, and verification.
- Placeholder scan: no task contains TBD/TODO placeholders; future retry UI is explicitly out of phase 1.
- Type consistency: all mapping functions use the same `ArchivePayload`, `MASUK`/`KELUAR`, and `STAFF`/`STUDENT`/`TETAMU` names across tasks.
