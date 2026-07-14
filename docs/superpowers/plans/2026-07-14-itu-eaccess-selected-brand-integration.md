# ITU eAccess Selected Brand Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the approved `eA` shield identity, responsive login hero, and branded PWA launcher icons into ITU eAccess.

**Architecture:** Keep the approved mark as a source-controlled SVG, generate deterministic PNG launcher assets with Sharp, and render the login experience as responsive React/CSS rather than a fixed screenshot. Existing Supabase authentication and signed-in visit flows remain unchanged.

**Tech Stack:** Next.js App Router, React, TypeScript, SVG, Tailwind CSS, Sharp, Vitest, Testing Library

**Execution Status:** Completed and verified on 2026-07-14.

## Global Constraints

- Use the approved `eA` shield direction from concept image 5, lower-left.
- Use navy `#1D388C`, red `#E6002D`, yellow `#FFD429`, white, and pale blue-grey.
- Do not include “Jabatan Perkhidmatan Veterinar” in the product mark.
- Keep the mark readable at 48 px and provide 192×192 and 512×512 PNG launcher icons.
- Recreate the approved header as responsive HTML/CSS; do not embed the fixed screenshot as the page.
- Preserve the existing Google OAuth implementation and signed-in home flow.
- Do not cache authenticated pages or personal data in this branding change.

---

### Task 1: Selected Mark and Launcher Assets

**Files:**
- Create: `design/visual-identity/itu-eaccess-ea-shield.svg`
- Create: `design/visual-identity/selected-brand-contract.test.ts`
- Create: `scripts/generate-pwa-icons.mjs`
- Create: `public/brand/itu-eaccess-mark.svg`
- Create: `public/icon-192.png`
- Create: `public/icon-512.png`

**Interfaces:**
- Consumes: approved palette and selected `eA` shield direction.
- Produces: one canonical square SVG and deterministic PNG icons.

- [ ] **Step 1: Write the failing SVG contract test**

Assert that the selected SVG exists, uses `viewBox="0 0 512 512"`, contains an accessible title, includes navy/red/yellow, and excludes department wording.

- [ ] **Step 2: Run the contract test and verify RED**

Run: `pnpm vitest run design/visual-identity/selected-brand-contract.test.ts --configLoader runner`

Expected: FAIL because the selected SVG does not exist.

- [ ] **Step 3: Draw the selected SVG and generate launcher assets**

Create a two-tone shield with a white centre, a geometric navy `eA` monogram, red access accent, and a small yellow circuit highlight. Copy the canonical SVG to `public/brand/itu-eaccess-mark.svg`; use Sharp with `fit: contain` to export 192×192 and 512×512 PNG files.

- [ ] **Step 4: Verify GREEN and icon dimensions**

Run the contract test, execute `node scripts/generate-pwa-icons.mjs`, and inspect both PNG files with Sharp metadata.

Expected: contract PASS; icons report exactly 192×192 and 512×512.

### Task 2: Responsive Login Hero

**Files:**
- Create: `src/features/brand/brand-mark.tsx`
- Create: `src/features/brand/login-hero.tsx`
- Create: `src/features/brand/login-hero.test.tsx`
- Modify: `src/features/auth/google-login-button.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `/brand/itu-eaccess-mark.svg` and `GoogleLoginButton`.
- Produces: `LoginHero`, shown only when no authenticated user exists.

- [ ] **Step 1: Write the failing login hero test**

Render `LoginHero` and assert the accessible brand name, headline `Rekod masuk dan keluar, tanpa teka-teki.`, supporting sentence, Google login action, and tagline `Masuk mudah, rekod teratur.` are present.

- [ ] **Step 2: Run the component test and verify RED**

Run: `pnpm vitest run src/features/brand/login-hero.test.tsx --configLoader runner`

Expected: FAIL because `LoginHero` does not exist.

- [ ] **Step 3: Implement the responsive hero**

Build a split hero with content on the left and a code-native open-door/circuit illustration on the right. Collapse to one column on narrow screens, keep the primary button at least 48 px high, and mark decorative SVG elements `aria-hidden="true"`.

- [ ] **Step 4: Connect the home page and verify GREEN**

Replace only the anonymous branch in `page.tsx` with `<LoginHero />`; retain the authenticated branch unchanged. Run the component test and the full unit suite.

Expected: all Vitest tests PASS.

### Task 3: Branded PWA Metadata and Final Verification

**Files:**
- Create: `src/app/manifest.ts`
- Create: `src/app/manifest.test.ts`
- Modify: `src/app/layout.tsx`
- Modify: `docs/superpowers/specs/2026-07-14-itu-eaccess-visual-identity-design.md`

**Interfaces:**
- Consumes: `public/icon-192.png`, `public/icon-512.png`.
- Produces: a standalone ITU eAccess web-app manifest and branded browser metadata.

- [ ] **Step 1: Write the failing manifest test**

Import the manifest factory and assert `name`, `short_name`, `display: "standalone"`, theme/background colours, and exactly two PNG icons with 192×192 and 512×512 sizes.

- [ ] **Step 2: Run the manifest test and verify RED**

Run: `pnpm vitest run src/app/manifest.test.ts --configLoader runner`

Expected: FAIL because `manifest.ts` does not exist.

- [ ] **Step 3: Implement manifest and metadata**

Add `manifest.ts`, set layout metadata title/description/application name/icons/theme colour, and record the selected brand direction in the visual identity specification.

- [ ] **Step 4: Run complete verification**

Run: `pnpm test:run`, `pnpm typecheck`, `pnpm lint`, and a production `pnpm build` with build-safe Supabase public variables.

Expected: all tests and static checks PASS; production build exits 0 and emits `/manifest.webmanifest`.

- [ ] **Step 5: Commit the selected brand integration**

```powershell
git add design public scripts src docs
git commit -m "feat: integrate selected ITU eAccess brand"
```
