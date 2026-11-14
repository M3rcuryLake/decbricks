# Legal heroes adopt the ServicesHero treatment — short design (approved 2026-11-14)

**Request:** make `/terms` + `/privacy-policy` "paragraphical instead of points" and give their heroes the About-Us / Services hero treatment (flares, subtext, smiley sticker, bold FK Raster Compact).

**Approach (chosen):** reuse `ServicesHero.astro` via its existing optional props — the exact pattern `about.astro` already uses. No new components, no new CSS families.

- Hero: `<ServicesHero srTitle={doc.title} headingParts={doc.heroHeading} body={doc.intro} navItems={[]} />` — flares (WebGL trail svg), smiley-sticker subtext (`parts-smileyText`), giant `heading-3.5xl font-offBit101` display words all come free; `initServicesPage()` already null-guards and runs on every page.
- Paragraphical: the hero chips (sections / min read / Draft) disappear — `doc.intro` already carries the draft notice as flowing prose. Privacy §2's bullet list becomes prose paragraphs (text verbatim, one paragraph per former bullet).
- Draft stamp: stays visible via a new optional default `<slot />` in `ServicesHero` (default empty, zero behaviour change) rendering the existing `data-legal-draft-stamp` line.
- Jump-to pills: skipped (navItems `[]` + length guard in the component). 14 sections cannot fit the template's ~5-pill desktop row; the fixed numbered rail already covers in-page navigation.
- Removed: the A2 corner wall + brick build-in, `.legal-hero*` custom title/intro/chips CSS, the custom h1/intro/chips markup. Kept: reading-progress hairline, back-to-top, numbered rail + its scroll-spy, island numerals (outside the hero, unchanged).
- `legal-page.ts`: init guard re-pointed from `.legal-hero` (gone) to `.page-legal`; brick build-in block deleted; everything else unchanged.

**Alternatives rejected:** (a) swapping the rail for `ServicesSidebarNav` — its JS requires a `.sections-servicesList` island and won't initialize on legal pages (higher risk, no user ask); (b) keeping chips under the new hero — contradicts "paragraphical"; (c) rendering 14 pills with derived short labels — guaranteed desktop overflow/clipping.

**Constraints honoured:** copy verbatim (transform is bullet→paragraph, words unchanged); noindex/sitemap/draft-stamp untouched; palette/fonts unchanged; no renamed hooks; registered init+teardown pattern untouched (no new main.ts registration needed).

**QA:** `legal-monumental.cjs` hero assertions rewritten to the ServicesHero hooks; `legal-pages.cjs` 29/29 regression must hold; all 7 gates re-run.
