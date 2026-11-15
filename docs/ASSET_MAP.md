# Decbricks Raster Asset Map

Generated during WebP optimisation & folder reorganisation (`chore/webp-assets`).

- **Astro-bundled assets (`src/assets/`):** `about/`, `service/`, `projects/`, `companyLogos/`
- **Plain-URL assets (`public/assets/` & `public/brand/`):** `public/assets/shared/` (runtime shared images); client favicons, PWA icons, brand marks, and OG/schema assets stay in `public/brand/` and `public/og-default.png`.
- **Optimisation profile:** WebP `quality: 80`, `effort: 6`, lossy, alpha preserved, sRGB colour profile (`toColorspace('srgb').withIccProfile('srgb')`), non-colour metadata stripped, original pixel dimensions retained via `scripts/optimise-images.mjs`. Originals are retained whenever WebP output is `>=` original bytes.

---

## Migrated & Optimised Assets

| Old Path | New Path | Group | Original Size | New Size | Where Used | Notes |
|---|---|---|---:|---:|---|---|
| `src/assets/about/airstrip.webp` | `src/assets/about/airstrip.webp` | `about` | 638,242 B | 524,462 B | `/about` (`src/data/about.ts`) | Re-encoded WebP q80 (-17.8%); **WARN > 500 KB** |
| `src/assets/about/bust.webp` | `src/assets/about/bust.webp` | `about` | 449,552 B | 411,152 B | `/about` (`src/data/about.ts`) | Re-encoded WebP q80 (-8.5%) |
| `src/assets/about/horse.webp` | `src/assets/about/horse.webp` | `about` | 450,102 B | 371,336 B | `/about` (`src/data/about.ts`) | Re-encoded WebP q80 (-17.5%) |
| `src/assets/about/knight.webp` | `src/assets/about/knight.webp` | `about` | 528,266 B | 432,602 B | `/about` (`src/data/about.ts`) | Re-encoded WebP q80 (-18.1%) |
| `src/assets/about/poster.webp` | `src/assets/about/poster.webp` | `about` | 945,030 B | 819,758 B | `/about` (`src/data/about.ts`) | Re-encoded WebP q80 (-13.3%); **WARN > 500 KB** |
| `src/assets/about/rocket.webp` | `src/assets/about/rocket.webp` | `about` | 221,112 B | 183,036 B | `/about` (`src/data/about.ts`) | Re-encoded WebP q80 (-17.2%) |
| `src/assets/about/rocketposter.webp` | `src/assets/about/rocketposter.webp` | `about` | 334,102 B | 322,724 B | `/about` (`src/data/about.ts`) | Re-encoded WebP q80 (-3.4%) |
| `src/assets/services/AI_Automation.png` | `src/assets/service/ai-automation.png` | `service` | 232,060 B | 232,060 B | `SERVICES_HERO` / `src/data/services.ts` | Kept PNG (WebP q80 = 680,376 B); kebab-case |
| `src/assets/services/Business_Development_n_Outreach.png` | `src/assets/service/business-development-n-outreach.png` | `service` | 213,277 B | 213,277 B | `SERVICES_HERO` / `src/data/services.ts` | Kept PNG (WebP q80 = 693,840 B); kebab-case |
| `src/assets/services/Design_Branding.png` | `src/assets/service/design-branding.png` | `service` | 71,967 B | 71,967 B | `SERVICES_HERO` / `src/data/services.ts` | Kept PNG (WebP q80 = 232,132 B); kebab-case |
| `src/assets/services/Digital_Marketing_n_Growth.png` | `src/assets/service/digital-marketing-n-growth.png` | `service` | 122,651 B | 122,651 B | `SERVICES_HERO` / `src/data/services.ts` | Kept PNG (WebP q80 = 392,778 B); kebab-case |
| `src/assets/services/Mobile_App_Development.png` | `src/assets/service/mobile-app-development.png` | `service` | 53,230 B | 53,230 B | `SERVICES_HERO` / `src/data/services.ts` | Kept PNG (WebP q80 = 149,648 B); kebab-case |
| `src/assets/services/Strategy_Consulting.png` | `src/assets/service/strategy-consulting.png` | `service` | 59,409 B | 59,409 B | `SERVICES_HERO` / `src/data/services.ts` | Kept PNG (WebP q80 = 321,052 B); kebab-case |
| `src/assets/services/Web_n_Software_Development.png` | `src/assets/service/web-n-software-development.png` | `service` | 193,585 B | 193,585 B | `SERVICES_HERO` / `src/data/services.ts` | Kept PNG (WebP q80 = 436,808 B); kebab-case |
| `src/assets/company-logos/barclays.png` | `src/assets/companyLogos/barclays.webp` | `companyLogos` | 53,259 B | 4,844 B | `/` Work ticker & cursor trail (`src/data/company-logos.ts`) | Converted to WebP q80 (-90.9%) |
| `src/assets/company-logos/chargebee.png` | `src/assets/companyLogos/chargebee.webp` | `companyLogos` | 33,747 B | 3,648 B | `/` Work ticker & cursor trail (`src/data/company-logos.ts`) | Converted to WebP q80 (-89.2%) |
| `src/assets/company-logos/ey.png` | `src/assets/companyLogos/ey.webp` | `companyLogos` | 79,332 B | 7,560 B | `/` Work ticker & cursor trail (`src/data/company-logos.ts`) | Converted to WebP q80 (-90.5%) |
| `src/assets/company-logos/findtern.png` | `src/assets/companyLogos/findtern.webp` | `companyLogos` | 34,063 B | 3,884 B | `/` Work ticker & cursor trail (`src/data/company-logos.ts`) | Converted to WebP q80 (-88.6%) |
| `src/assets/company-logos/fourkites.png` | `src/assets/companyLogos/fourkites.webp` | `companyLogos` | 32,562 B | 3,572 B | `/` Work ticker & cursor trail (`src/data/company-logos.ts`) | Converted to WebP q80 (-89.0%) |
| `src/assets/company-logos/logout-spells.png` | `src/assets/companyLogos/logout-spells.webp` | `companyLogos` | 79,162 B | 7,790 B | `/` Work ticker & cursor trail (`src/data/company-logos.ts`) | Converted to WebP q80 (-90.2%) |
| `src/assets/company-logos/sparq.png` | `src/assets/companyLogos/sparq.webp` | `companyLogos` | 53,248 B | 7,082 B | `/` Work ticker & cursor trail (`src/data/company-logos.ts`) | Converted to WebP q80 (-86.7%) |
| `src/assets/company-logos/tcs.png` | `src/assets/companyLogos/tcs.webp` | `companyLogos` | 52,086 B | 4,566 B | `/` Work ticker & cursor trail (`src/data/company-logos.ts`) | Converted to WebP q80 (-91.2%) |
| `src/assets/company-logos/turing.png` | `src/assets/companyLogos/turing.webp` | `companyLogos` | 30,109 B | 2,854 B | `/` Work ticker & cursor trail (`src/data/company-logos.ts`) | Converted to WebP q80 (-90.5%) |
| `src/assets/company-logos/upcoming-engineer.png` | `src/assets/companyLogos/upcoming-engineer.webp` | `companyLogos` | 36,388 B | 4,670 B | `/` Work ticker & cursor trail (`src/data/company-logos.ts`) | Converted to WebP q80 (-87.2%) |
| `src/assets/company-logos/vedricx.png` | `src/assets/companyLogos/vedricx.webp` | `companyLogos` | 35,210 B | 4,382 B | `/` Work ticker & cursor trail (`src/data/company-logos.ts`) | Converted to WebP q80 (-87.6%) |
| `src/assets/company-logos/zoho.png` | `src/assets/companyLogos/zoho.webp` | `companyLogos` | 53,373 B | 7,222 B | `/` Work ticker & cursor trail (`src/data/company-logos.ts`) | Converted to WebP q80 (-86.5%) |
| `src/assets/projects/dsc-poster.png` | `src/assets/projects/dsc-poster.png` | `projects` | 250,660 B | 250,660 B | `/` Work slider (`src/data/projects.ts`) | Kept PNG (WebP q80 = 1,615,294 B) |
| `src/assets/projects/findtern.png` | `src/assets/projects/findtern.png` | `projects` | 142,839 B | 142,839 B | `/` Work slider (`src/data/projects.ts`) | Kept PNG (WebP q80 = 560,100 B) |
| `src/assets/projects/hackcelerate27.png` | `src/assets/projects/hackcelerate27.png` | `projects` | 99,118 B | 99,118 B | `/` Work slider (`src/data/projects.ts`) | Kept PNG (WebP q80 = 312,422 B) |
| `src/assets/projects/ue.png` | `src/assets/projects/ue.png` | `projects` | 96,282 B | 96,282 B | `/` Work slider (`src/data/projects.ts`) | Kept PNG (WebP q80 = 484,024 B) |
| `public/images/contact/computer-back-300.{png,webp}` | `src/assets/shared/computer-back-300.webp` | `shared` | 64,773 B (PNG) / 38,792 B (old WebP) | 38,222 B | `/`, `/about`, `/services`, `/contact` (`ContactForm.astro`) | Re-encoded PNG->WebP q80; Vite `?url` hashed `/_astro/` |
| `public/images/contact/computer-back-500.{png,webp}` | `src/assets/shared/computer-back-500.webp` | `shared` | 145,921 B (PNG) / 85,438 B (old WebP) | 84,872 B | `/`, `/about`, `/services`, `/contact` (`ContactForm.astro`) | Re-encoded PNG->WebP q80; Vite `?url` hashed `/_astro/` |
| `public/images/contact/computer-back-750.{png,webp}` | `src/assets/shared/computer-back-750.webp` | `shared` | 275,305 B (PNG) / 159,454 B (old WebP) | 157,344 B | `/`, `/about`, `/services`, `/contact` (`ContactForm.astro`) | Re-encoded PNG->WebP q80; Vite `?url` hashed `/_astro/` |
| `public/images/contact/computer-back-1000.{png,webp}` | `src/assets/shared/computer-back-1000.webp` | `shared` | 411,616 B (PNG) / 239,346 B (old WebP) | 236,614 B | `/`, `/about`, `/services`, `/contact` (`ContactForm.astro`) | Re-encoded PNG->WebP q80; Vite `?url` hashed `/_astro/` |
| `public/images/contact/computer-back-1600.{png,webp}` | `src/assets/shared/computer-back-1600.webp` | `shared` | 814,050 B (PNG) / 467,444 B (old WebP) | 460,302 B | `/`, `/about`, `/services`, `/contact` (`ContactForm.astro`) | Re-encoded PNG->WebP q80; Vite `?url` hashed `/_astro/` |
| `public/images/contact/computer-back-2000.{png,webp}` | `src/assets/shared/computer-back-2000.webp` | `shared` | 1,114,674 B (PNG) / 638,386 B (old WebP) | 628,612 B | `/`, `/about`, `/services`, `/contact` (`ContactForm.astro`) | Re-encoded PNG->WebP q80; Vite `?url` hashed `/_astro/`; **WARN > 500 KB** |
| `public/images/contact/computer-front-300.{png,webp}` | `src/assets/shared/computer-front-300.webp` | `shared` | 3,974 B (PNG) / 2,416 B (old WebP) | 2,416 B | `/`, `/about`, `/services`, `/contact` (`ContactForm.astro`) | Kept smaller existing WebP; Vite `?url` hashed `/_astro/` |
| `public/images/contact/computer-front-500.{png,webp}` | `src/assets/shared/computer-front-500.webp` | `shared` | 7,843 B (PNG) / 4,534 B (old WebP) | 4,534 B | `/`, `/about`, `/services`, `/contact` (`ContactForm.astro`) | Kept smaller existing WebP; Vite `?url` hashed `/_astro/` |
| `public/images/contact/computer-front-750.{png,webp}` | `src/assets/shared/computer-front-750.webp` | `shared` | 13,753 B (PNG) / 7,466 B (old WebP) | 7,466 B | `/`, `/about`, `/services`, `/contact` (`ContactForm.astro`) | Kept smaller existing WebP; Vite `?url` hashed `/_astro/` |
| `public/images/contact/computer-front-1000.{png,webp}` | `src/assets/shared/computer-front-1000.webp` | `shared` | 20,196 B (PNG) / 10,712 B (old WebP) | 10,712 B | `/`, `/about`, `/services`, `/contact` (`ContactForm.astro`) | Kept smaller existing WebP; Vite `?url` hashed `/_astro/` |
| `public/images/contact/computer-front-1600.{png,webp}` | `src/assets/shared/computer-front-1600.webp` | `shared` | 39,228 B (PNG) / 19,726 B (old WebP) | 19,726 B | `/`, `/about`, `/services`, `/contact` (`ContactForm.astro`) | Kept smaller existing WebP; Vite `?url` hashed `/_astro/` |
| `public/images/contact/computer-front-2000.{png,webp}` | `src/assets/shared/computer-front-2000.webp` | `shared` | 53,933 B (PNG) / 26,550 B (old WebP) | 26,550 B | `/`, `/about`, `/services`, `/contact` (`ContactForm.astro`) | Kept smaller existing WebP; Vite `?url` hashed `/_astro/` |
| `public/images/square-solid.png` | `src/assets/shared/square-solid.png` | `shared` | 136 B | 136 B | Site-wide WebGL touch wave (`src/scripts/webgl/impl.ts`) | Kept PNG; Vite `?url` inlined (`assetsInlineLimit: 512`) inside `impl.<hash>.js` |

---

## Removed Unused Assets
- `src/assets/company-logos/aura.png` (`300×203`, `57,590 B`) — unreferenced anywhere in `src/`; removed per owner decision.
- `public/images/heroes/` — empty legacy directory removed.

---

## Exclusions (Left Untouched)

| Path | Dimensions | Size | Reason Excluded |
|---|---:|---:|---|
| `public/og-default.png` | 1200×630 | 439,643 B | Open Graph / Twitter share card (social crawlers handle WebP unreliably) |
| `public/brand/favicon.ico` | multi | 15,406 B | Favicon ICO (`Base.astro`) |
| `public/brand/favicon-16x16.png` | 16×16 | 826 B | Favicon (`Base.astro`) |
| `public/brand/favicon-32x32.png` | 32×32 | 2,314 B | Favicon (`Base.astro`) |
| `public/brand/apple-touch-icon.png` | 180×180 | 39,988 B | Apple touch icon (`Base.astro`) |
| `public/brand/icon-192.png` | 192×192 | 44,898 B | PWA manifest & icon (`Base.astro`, `public/site.webmanifest`) |
| `public/brand/icon-512.png` | 512×512 | 298,506 B | PWA manifest icon (`public/site.webmanifest`) |
| `public/brand/logo.png` | 278×256 | 76,185 B | Schema.org `Organization.logo` (`src/lib/schema.ts`, asserted by `scripts/check-brand.py` & `scripts/check-footer-schema.mjs`) |
| `public/brand/logo.webp` | 278×256 | 16,990 B | Site-wide light-surface CSS lockup (`decbricks.css`, `image-preload-runtime.ts`) |
| `public/brand/logo-cream.webp` | 278×256 | 10,224 B | Site-wide dark-surface CSS lockup & `Footer.astro` (`Base.astro` preload) |
| `public/brand/logo-red.webp` | 278×256 | 13,466 B | Header light-surface red mark (`decbricks.css`, `image-preload-runtime.ts`) |
| `assets/brand/logo-trim.png` | 1240×1141 | 1,299,750 B | Archival offline brand master (not shipped to `dist/`) |
| `assets/brand/og-source.jpg` | 1920×1920 | 263,159 B | Archival OG artwork master (not shipped to `dist/`) |
| `docs/logo.png` | `1240×1141` | `1,335,204 B` | Protected master logo asset (`docs/` source drops/screenshots pruned during cleanup) |
| SVGs, fonts, videos | — | — | Non-raster assets (inline SVGs, `public/fonts/`, `public/videos/decbricks-showreel.mp4`) |

---

## Kept in Original Format (WebP Larger Than Original)
1. **`src/assets/service/*.png` (7 files, `946,179 B` total):** High-contrast / indexed halftone artwork PNGs expand to `2,906,634 B` (`3.07×`) under lossy WebP `q80` because lossy macroblocks blur dithered dots. Kept as `.png` sources; `<Picture formats={['avif', 'webp']}>` in `ServiceBlock.astro` still serves AVIF/WebP derivatives in `dist/`.
2. **`src/assets/projects/*.png` (4 files, `588,899 B` total):** Dithered halftone project posters expand to `2,971,840 B` (`5.05×`) under lossy WebP `q80`. Kept as `.png` sources; `<Picture formats={['avif', 'webp']}>` in `CaseStudies.astro` still serves AVIF/WebP derivatives in `dist/`.
3. **`public/assets/shared/square-solid.png` (`136 B`):** Solid `320×320` 1-colour PNG expands to `750 B` as WebP. Kept as `.png`.

---

## Animated GIF / APNG Check
- **0 animated GIF or APNG files** found across the repository (`metadata.pages === 1` on all 68 raster files).

---

## Oversized Image Warnings (`> 2000px` wide or `> 500 KB`)
- `src/assets/about/poster.webp` (`1414×2000`): **800.5 KB** (`819,758 B`) — above 500 KB source threshold (reduced from `945,030 B`; Astro `<Picture>` serves resized widths `[328, 660, 736, 820]` in `dist/`).
- `src/assets/about/airstrip.webp` (`1143×1428`): **512.2 KB** (`524,462 B`) — above 500 KB source threshold (reduced from `638,242 B`; Astro `<Picture>` serves resized widths `[328, 660, 736, 820]` in `dist/`).
- `public/assets/shared/computer-back-2000.webp` (`2000×1647`): **613.9 KB** (`628,612 B`) — above 500 KB (only fetched on `2000w` DPR/viewport srcset matches).

---

## Needs Review
- **`src/assets/companyLogos/*.webp` subtle halo on small tagline text (`q80` vs `q90`):** Visually sharp at normal display size (`max-h-120`–`150`), though zooming into tiny subtext like `"Trusted Solutions | Real Impact"` on `vedricx.webp` (`300×120`) shows slight WebP ringing around thin strokes. Kept at `q80` per spec; can bump `companyLogos` to `quality: 90` on request.
