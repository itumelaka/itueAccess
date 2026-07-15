# Supabase Cloudflare PWA Template Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Freeze ITU eAccess as a stable production reference, then extract a clean reusable PWA template for future projects.

**Architecture:** Keep ITU eAccess as the production app and create a separate sanitized template repo. The template keeps reusable auth, role approval, PWA, Supabase, Cloudflare, and optional spreadsheet sync patterns, while removing all ITU-specific branding, data, URLs, and secrets.

**Tech Stack:** Next.js, React, Supabase, Cloudflare Workers/OpenNext, Google Apps Script optional archive sync, pnpm, Vitest.

## Global Constraints

- Do not commit real secrets, `.env.local`, Supabase service role keys, Apps Script secrets, or Cloudflare tokens.
- Do not replace or break the production ITU eAccess repository while extracting the template.
- Keep ITU-specific app as `itumelaka/itueAccess`.
- Use a new repository for the template, for example `itumelaka/supabase-cloudflare-pwa-template`.
- Keep Google Spreadsheet archive sync optional in the template.
- Remove ITU/DVS branding and real spreadsheet/project URLs from the template.
- Verify eAccess before tagging stable.

---

## File Structure

### Existing ITU eAccess repo

- `README.md` — production app overview.
- `docs/project-overview.md` — current production status and architecture.
- `docs/google-sheet-archive-sync.md` — real archive sync runbook.
- `google-apps-script/itu-eaccess-archive-webhook.gs` — Apps Script backup used by production.
- `src/` — production application code.
- `supabase/migrations/` — production database schema.

### New template repo

Recommended folder while preparing:

```text
D:\Projects\supabase-cloudflare-pwa-template
```

Recommended future GitHub repo:

```text
https://github.com/itumelaka/supabase-cloudflare-pwa-template
```

Template files to keep:

- `src/app/` — generic app routes.
- `src/features/auth/` — Supabase auth and profile requirements.
- `src/features/admin/` — admin approval, user status, and dashboard patterns.
- `src/features/pwa/` — PWA install/support files.
- `src/features/spreadsheet/` — optional archive sync, renamed generically.
- `src/lib/` — environment and Supabase helpers.
- `supabase/migrations/` — generic auth/profile/access schema.
- `google-apps-script/` — optional generic Apps Script webhook.
- `docs/` — template setup docs.

Template files/content to sanitize:

- ITU eAccess name.
- ITU/DVS logo and brand assets.
- ITU locations.
- Real Supabase URL/project ref.
- Real Apps Script URL.
- Real Google Form URL.
- Real Google Spreadsheet IDs.
- Real user emails in examples, except placeholders like `admin@example.com`.

---

### Task 1: Freeze ITU eAccess stable

**Files:**
- Modify: `README.md`
- Modify: `docs/project-overview.md`
- Modify: `docs/google-sheet-archive-sync.md`
- Modify: `google-apps-script/itu-eaccess-archive-webhook.gs`

**Interfaces:**
- Consumes: current production code and docs.
- Produces: stable Git commit and tag `itu-eaccess-v1-stable`.

- [ ] **Step 1: Copy latest documentation from Codex repo to D repo**

Run in PowerShell:

```powershell
cd "D:\Projects\itu-access"

Copy-Item "C:\Users\burnk\Documents\Codex\2026-07-14\a\itu-access\README.md" "D:\Projects\itu-access\README.md"
Copy-Item "C:\Users\burnk\Documents\Codex\2026-07-14\a\itu-access\docs\project-overview.md" "D:\Projects\itu-access\docs\project-overview.md"
Copy-Item "C:\Users\burnk\Documents\Codex\2026-07-14\a\itu-access\docs\google-sheet-archive-sync.md" "D:\Projects\itu-access\docs\google-sheet-archive-sync.md"
Copy-Item "C:\Users\burnk\Documents\Codex\2026-07-14\a\itu-access\google-apps-script\itu-eaccess-archive-webhook.gs" "D:\Projects\itu-access\google-apps-script\itu-eaccess-archive-webhook.gs"
```

Expected: files copied with no PowerShell error.

- [ ] **Step 2: Verify production code state**

Run:

```powershell
pnpm typecheck
pnpm lint
pnpm test:run
```

Expected: all commands exit successfully.

- [ ] **Step 3: Commit documentation freeze**

Run:

```powershell
git status
git add README.md docs/project-overview.md docs/google-sheet-archive-sync.md google-apps-script/itu-eaccess-archive-webhook.gs
git commit -m "docs: freeze ITU eAccess v1 documentation"
git push origin HEAD:main
```

Expected: commit pushed to `main`.

- [ ] **Step 4: Tag stable version**

Run:

```powershell
git tag -a itu-eaccess-v1-stable -m "ITU eAccess v1 stable"
git push origin itu-eaccess-v1-stable
```

Expected: tag appears on GitHub.

- [ ] **Step 5: Optional local backup**

Run:

```powershell
Compress-Archive -Path "D:\Projects\itu-access" -DestinationPath "D:\Projects\itu-access-v1-stable.zip" -Force
```

Expected: `D:\Projects\itu-access-v1-stable.zip` exists.

---

### Task 2: Create clean template workspace

**Files:**
- Create: `D:\Projects\supabase-cloudflare-pwa-template`
- Modify: all copied project files in the new template folder.

**Interfaces:**
- Consumes: stable ITU eAccess repo.
- Produces: separate local template folder with Git history removed or fresh.

- [ ] **Step 1: Copy project without build/cache folders**

Run:

```powershell
cd "D:\Projects"
robocopy "D:\Projects\itu-access" "D:\Projects\supabase-cloudflare-pwa-template" /E /XD node_modules .next .open-next .wrangler .git /XF .env.local tsconfig.tsbuildinfo
```

Expected: project copied. Robocopy may return code `1`; that still means files copied successfully.

- [ ] **Step 2: Initialize fresh Git repo**

Run:

```powershell
cd "D:\Projects\supabase-cloudflare-pwa-template"
git init
```

Expected: new `.git` folder created.

- [ ] **Step 3: Install dependencies**

Run:

```powershell
pnpm install
```

Expected: dependencies installed.

---

### Task 3: Sanitize branding and names

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/manifest.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`
- Modify: `public/brand/*`
- Modify: `public/icon-192.png`
- Modify: `public/icon-512.png`

**Interfaces:**
- Consumes: copied ITU eAccess app.
- Produces: generic template identity.

- [ ] **Step 1: Replace package name**

In `package.json`, change:

```json
"name": "itu-access"
```

to:

```json
"name": "supabase-cloudflare-pwa-template"
```

- [ ] **Step 2: Replace visible app name**

Search and replace:

```text
ITU eAccess
```

with:

```text
My PWA App
```

Search and replace:

```text
ITU EACCESS
```

with:

```text
MY PWA APP
```

- [ ] **Step 3: Replace domain references**

Search and replace:

```text
itu-access.itumelaka.workers.dev
```

with:

```text
your-worker.your-subdomain.workers.dev
```

- [ ] **Step 4: Replace brand assets**

Use simple placeholder icons for template. Keep file names:

```text
public/icon-192.png
public/icon-512.png
public/brand/itu-eaccess-mark.svg
```

Rename SVG later if wanted, but keeping the path avoids unnecessary code edits.

- [ ] **Step 5: Verify after branding cleanup**

Run:

```powershell
pnpm typecheck
pnpm test:run
```

Expected: all tests pass.

---

### Task 4: Sanitize environment and docs

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `docs/project-overview.md`
- Modify: `docs/google-sheet-archive-sync.md`
- Modify: `google-apps-script/itu-eaccess-archive-webhook.gs`

**Interfaces:**
- Consumes: production docs and examples.
- Produces: setup docs that use placeholders only.

- [ ] **Step 1: Ensure `.env.example` uses placeholders**

Use:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_FALLBACK_FORM_URL=https://forms.google.com/your-fallback-form
SPREADSHEET_ARCHIVE_WEBHOOK_URL=
SPREADSHEET_ARCHIVE_SECRET=
```

- [ ] **Step 2: Remove production IDs from docs**

Search for:

```text
txbtyrsneenembvcggsf
1chzFBMwVkZBkW6_Y9yRUrIGTfyOi1MkcNJ_fKkCljyg
1lA7ng0Bj9KjepnaGJjhlIlEYOo-MmHxtirv6GkWVxqw
AKfycbxDXp7hKKfgtADmRiTszB_oxWrOrp6qmE6yatAN4dWgVVNCsp2RzmoChcLvqJhethmw
itumelaka@gmail.com
```

Replace with placeholders:

```text
your-supabase-project-ref
your-google-spreadsheet-id
your-google-form-id
your-apps-script-web-app-id
admin@example.com
```

- [ ] **Step 3: Rename spreadsheet docs as optional**

Make clear in README:

```text
Google Spreadsheet archive sync is optional. The app works with Supabase only.
```

- [ ] **Step 4: Verify no known production IDs remain**

Run:

```powershell
Select-String -Path .\* -Pattern "txbtyrsneenembvcggsf","AKfycbxDX","itumelaka@gmail.com","1chzFB","1lA7ng0" -Recurse
```

Expected: no matches.

---

### Task 5: Create template setup guide

**Files:**
- Create: `docs/template-setup.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: clean template repo.
- Produces: step-by-step setup guide for new projects.

- [ ] **Step 1: Create setup checklist**

Add `docs/template-setup.md` with sections:

```markdown
# Template Setup

## 1. Create Supabase project

Create a new Supabase project and save:

- Project URL
- Publishable key

## 2. Run migrations

Open Supabase SQL editor and run files from `supabase/migrations/` in order.

## 3. Configure Google OAuth

Set Google OAuth client in Google Cloud Console, then connect it in Supabase Auth.

## 4. Configure local environment

Copy `.env.example` to `.env.local` and fill values.

## 5. Create first admin

Login once using Google, then promote the admin profile in Supabase SQL.

## 6. Deploy to Cloudflare

Create Cloudflare Worker/Pages project from GitHub and set variables.

## 7. Optional Google Spreadsheet archive

Deploy Apps Script webhook and set Cloudflare secrets.
```

- [ ] **Step 2: Link setup guide from README**

Add:

```markdown
## Start a new project from this template

Follow [Template Setup](docs/template-setup.md).
```

- [ ] **Step 3: Commit template docs**

Run:

```powershell
git add README.md docs/template-setup.md
git commit -m "docs: add template setup guide"
```

---

### Task 6: Final template verification and publish

**Files:**
- All template files.

**Interfaces:**
- Consumes: sanitized template repo.
- Produces: pushed template GitHub repo.

- [ ] **Step 1: Run full verification**

Run:

```powershell
pnpm typecheck
pnpm lint
pnpm test:run
```

Expected: all pass.

- [ ] **Step 2: Check secrets and production references**

Run:

```powershell
git status
Select-String -Path .\* -Pattern ".env.local","SUPABASE_SERVICE_ROLE_KEY","txbtyrsneenembvcggsf","itumelaka@gmail.com","AKfycbxDX" -Recurse
```

Expected: no real secrets or production IDs in committed files.

- [ ] **Step 3: Initial template commit**

Run:

```powershell
git add .
git commit -m "chore: create Supabase Cloudflare PWA template"
```

- [ ] **Step 4: Push to new GitHub repo**

After creating empty GitHub repo:

```powershell
git branch -M main
git remote add origin https://github.com/itumelaka/supabase-cloudflare-pwa-template.git
git push -u origin main
```

Expected: template repo appears on GitHub.

---

## Self-Review

- Spec coverage: plan freezes production, creates separate template, sanitizes branding, removes production IDs, adds setup docs, verifies, and publishes.
- Placeholder scan: placeholders are intentional values for template setup and are explicitly listed.
- Type consistency: no new runtime types required in this plan.
