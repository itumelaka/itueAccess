# ITU eAccess Brand Concepts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce four comparable SVG logo concepts and matching front-page header mockups derived from the approved DVS colour palette without modifying the supplied source logo.

**Architecture:** Store source-controlled SVG concepts in a dedicated design folder, render them with the project's existing `sharp` dependency, and compose a single comparison board for user selection. No concept is installed into the PWA in this phase.

**Tech Stack:** SVG, HTML/CSS, TypeScript, Sharp, Vitest, pnpm

## Global Constraints

- Preserve `F:/Downloads/2-Logo-DVS.png` unchanged.
- Omit “Jabatan Perkhidmatan Veterinar” from every candidate icon.
- Use navy, bright red, signal yellow, white, and pale blue-grey sampled from the reference.
- Every icon must remain recognizable at 48 px and use a square `viewBox="0 0 512 512"`.
- Produce A1 DVS Pixel Circuit, A2 DVS Access Gate, B1 ITU Circuit Shield, and B2 eAccess Monogram.
- Present every concept at equal scale with the name “ITU eAccess” and tagline “Masuk mudah, rekod teratur.”
- Do not integrate a candidate into the application until the user selects it.

---

### Task 1: Palette and SVG Contract

**Files:**
- Create: `design/visual-identity/palette.ts`
- Create: `design/visual-identity/palette.test.ts`

**Interfaces:**
- Consumes: approved source logo palette.
- Produces: `brandPalette` with `navy`, `red`, `yellow`, `white`, `surface`, and `ink` hexadecimal strings.

- [ ] **Step 1: Write the palette contract test**

```ts
import { describe, expect, it } from "vitest";
import { brandPalette } from "./palette";

describe("brandPalette", () => {
  it("contains six valid hexadecimal colours", () => {
    expect(Object.values(brandPalette)).toHaveLength(6);
    for (const colour of Object.values(brandPalette)) expect(colour).toMatch(/^#[0-9A-F]{6}$/);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm vitest run design/visual-identity/palette.test.ts --configLoader runner`

Expected: FAIL because `palette.ts` does not exist.

- [ ] **Step 3: Implement the sampled palette**

```ts
export const brandPalette = {
  navy: "#1D388C",
  red: "#E6002D",
  yellow: "#FFF200",
  white: "#FFFFFF",
  surface: "#F3F7FC",
  ink: "#10233F",
} as const;
```

- [ ] **Step 4: Run the test and verify GREEN**

Run: `pnpm vitest run design/visual-identity/palette.test.ts --configLoader runner`

Expected: 1 test PASS.

### Task 2: Four Vector Logo Concepts

**Files:**
- Create: `design/visual-identity/a1-dvs-pixel-circuit.svg`
- Create: `design/visual-identity/a2-dvs-access-gate.svg`
- Create: `design/visual-identity/b1-itu-circuit-shield.svg`
- Create: `design/visual-identity/b2-eaccess-monogram.svg`
- Create: `design/visual-identity/svg-contract.test.ts`

**Interfaces:**
- Consumes: colour constants from Task 1.
- Produces: four independent square SVGs with unique `<title>` elements and no department wording.

- [ ] **Step 1: Write a contract test that reads all four SVGs**

The test must assert `viewBox="0 0 512 512"`, a unique title, presence of all three accent colours, and absence of `Jabatan Perkhidmatan Veterinar`.

- [ ] **Step 2: Run the SVG contract test and verify RED**

Run: `pnpm vitest run design/visual-identity/svg-contract.test.ts --configLoader runner`

Expected: FAIL because the SVG files do not exist.

- [ ] **Step 3: Draw A1 and A2**

A1 retains the split navy/red DVS silhouette while replacing fragmented pixels with circuit nodes. A2 reduces the silhouette into a navy access doorway, a red motion path, and yellow authentication nodes.

- [ ] **Step 4: Draw B1 and B2**

B1 uses a new navy shield/open-door silhouette with red access path and yellow circuit nodes. B2 constructs a legible `eA` monogram from rounded circuit traces.

- [ ] **Step 5: Run the SVG contract test and verify GREEN**

Run: `pnpm vitest run design/visual-identity/svg-contract.test.ts --configLoader runner`

Expected: all SVG contract assertions PASS.

### Task 3: Header Comparison Board

**Files:**
- Create: `design/visual-identity/comparison.html`
- Create: `scripts/render-brand-concepts.ts`
- Create: `outputs/itu-eaccess-brand-concepts.png`

**Interfaces:**
- Consumes: four SVG candidates.
- Produces: one 1600×1200 comparison board with equal-size concept cards and four matching header previews.

- [ ] **Step 1: Build the comparison document**

Use a two-by-two grid. Every card contains the square icon, concept code/name, “ITU eAccess”, the approved tagline, and a miniature header using the same circuit motif. Mark B1 as “Cadangan” without visually enlarging it.

- [ ] **Step 2: Implement deterministic rendering**

`render-brand-concepts.ts` uses `sharp` to rasterize each SVG at 512×512 and create PNG candidate assets. The comparison HTML is captured at 1600×1200 through the local browser preview.

- [ ] **Step 3: Verify visual output**

Run: `pnpm tsx scripts/render-brand-concepts.ts`

Expected: four 512×512 PNGs exist, all have alpha channels, and the comparison board contains four distinct cards without clipped text.

- [ ] **Step 4: Run project verification**

Run: `pnpm test:run && pnpm typecheck && pnpm lint`

Expected: all tests pass and both static checks exit 0.

- [ ] **Step 5: Commit the comparison assets**

```powershell
git add design/visual-identity scripts/render-brand-concepts.ts
git commit -m "design: add ITU eAccess brand concepts"
```

The rendered comparison PNG remains a user-facing output; final integration waits for the user's selected concept.
