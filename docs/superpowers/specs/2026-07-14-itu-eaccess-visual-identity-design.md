# ITU eAccess Visual Identity Design

**Date:** 2026-07-14  
**Status:** Selected and approved for application integration
**Product:** ITU eAccess — Sistem Rekod Keluar Masuk ITU

## Objective

Create a recognizable, accessible visual identity for the ITU eAccess PWA. The identity should feel official and trustworthy while using an electronic-circuit motif that reflects the IT unit. Four comparable concepts will be produced before one direction is selected for implementation.

## Source Identity and Palette

The supplied Jabatan Perkhidmatan Veterinar logo is the visual reference. Department wording will not appear in the PWA icon. The reference mark will not be overwritten; derivative assets will be saved separately.

The working palette is:

- Navy blue: primary surfaces, trust and institutional identity.
- Bright red: access/action accent.
- Signal yellow: circuit nodes and focal highlights.
- White: contrast and breathing room.
- Pale blue-grey: application background.

Exact production colour values will be sampled from the supplied source image and adjusted only when necessary to meet accessible contrast.

## Concepts

### A1 — DVS Pixel Circuit

Retain the recognizable blue-red geometry of the reference mark. Simplify the fragmented blue/yellow pixels into deliberate circuit traces and nodes. The result should remain recognizable at small icon sizes without retaining the department wording.

### A2 — DVS Access Gate

Simplify the reference geometry into an access doorway or gate. Navy forms the main doorway, red indicates movement/access, and yellow nodes indicate authenticated digital access. This is the more abstract option within the recognizable DVS family.

### B1 — ITU Circuit Shield

Create a new mark shaped like a shield combined with an open door. It uses the DVS palette and pixel language without reproducing the official symbol. This is the recommended long-term product identity because it distinguishes the application from the department's official corporate logo.

### B2 — eAccess Monogram

Create an `eA` monogram from circuit traces. The letterform must remain legible at 48 px, with navy as the base, red as the access path, and yellow as connection nodes. This is the most digital and app-like direction.

## Deliverables for Comparison

Each concept will include:

- One square icon preview suitable for a PWA launcher.
- One transparent-background logo asset.
- One front-page header mockup.
- Product name: **ITU eAccess**.
- Tagline: **Masuk mudah, rekod teratur.**

The four concepts will be presented side by side at equal scale. No concept will be installed into the application until the user selects one.

## Header Design

The front-page header will use a responsive split layout:

- Logo and ITU eAccess wordmark at the top.
- Large Malay headline and short supporting text.
- Google Login as the primary action.
- Circuit traces used as a restrained background pattern, never behind essential text at low contrast.
- Mobile layout collapses into a single column and preserves a large touch target.

## Accessibility and Production Rules

- Essential text must meet WCAG AA contrast.
- The icon must remain recognizable at 48 px and must not depend on tiny wording.
- Circuit decoration must not reduce text readability.
- Red and yellow are accents, not the sole indicators of status.
- Final selected icon will later be exported at PWA-required sizes, including 192×192 and 512×512.

## Approval Boundary

The user selected the `eA` shield direction (the lower-left concept from the final external comparison) on 2026-07-14. The approved login composition combines that mark with the responsive open-door and circuit header direction. Integration is authorized for the anonymous login page, application metadata, and PWA launcher icons; authenticated workflows remain unchanged.
