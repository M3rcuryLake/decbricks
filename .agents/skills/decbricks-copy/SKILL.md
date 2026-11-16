---
name: decbricks-copy
description: Use when writing or editing any visitor-facing copy, page title, meta description, heading, link text or image alt text on the Decbricks site.
---

# Decbricks Copy & Content-SEO Recipe

Follow this recipe whenever writing or revising visitor-facing text in `.astro` templates or `src/data/*.ts`. Re-read `AGENTS.md` before editing so brand lockup (`brandify()`), verbatim source files, and CSS hook rules hold.

## 1. Voice
- Write in **British/Indian English** (`organisation`, `customised`, `optimise`, `behaviour`), matching `src/data/legal.ts`.
- Use **short, active sentences** (aim for 12–20 words; split stacked clauses).
- Choose **concrete nouns and verbs** (software, web apps, AI workflows, roadmaps, outreach campaigns) over abstract filler.
- Keep **one idea per paragraph** (2–3 sentences maximum per paragraph in cards and sections).
- Put **the visitor's goal before our process**: open sections and paragraphs with what the visitor achieves or solves, then state how Decbricks delivers it.
- Render `"Decbricks"` in body copy through `brandify()` from `src/lib/brand.ts`; keep `"Decbricks"` as plain text in `<title>`, `<meta>`, JSON-LD, and `aria-label`s.

## 2. Page Shape
- **H1:** State clearly what Decbricks does and who it is for (while preserving any existing `sr-only` / visual-display split in hero components).
- **First 100 words:** Answer the visitor's primary question immediately (who we serve, what we deliver, and what step to take next).
- **Descriptive H2s:** Order section H2s so a scanner can read the page's logic from problem/offer to proof to action, matching CSS classes on existing tags.
- **One primary CTA per page:** Pick one main action for the page, state it cleanly near the top, and repeat it at the end.

## 3. Title and Meta Description
- **Unique per page:** Every route has its own distinct `<title>` and `<meta name="description">`—never share near-identical boilerplate across `/` and `/about`.
- **Title shape (50–60 characters):** Lead with the specific page topic and company context (no forced `| Decbricks` suffix on every page per owner V-8 decision; tagline is `Build Beyond Ordinary`). Verify character count before finalising.
- **Meta description shape (140–155 characters):** Write **one natural human sentence** (not a comma-separated list of menu items) that states what the page offers and gives a clear reason to click. Verify character count before finalising.

## 4. Links and Images
- **Descriptive link text:** Make every link name its destination or next action (e.g. `"Explore all seven services"`, `"Discuss AI & Automation"`, `"Book a discovery call"`).
- **Informative images:** Write `alt` text as one short sentence describing the image's visual subject and purpose on the page.
- **Decorative images:** Set `alt=""` (and `aria-hidden="true"` where appropriate) on purely ornamental illustrations, background hardware renders, and brand marks adjacent to the `.font-brand` wordmark.

## 5. Claims and Verification
- Trace every client name, company logo, metric, timeline, location, or capability directly to `docs/about-section-data.md`, `docs/services-content.md`, `src/data/*.ts`, or `src/data/legal.ts`.
- Mark any unverified number, client relationship, outcome, or award inline as `[VERIFY: what is needed]` and log it in `docs/content-seo/verify-list.md`.

## 6. Worked Example (Before → After)

**Before (`src/data/services.ts` — Service 01, Strategy & Consulting):**
> We help businesses identify opportunities, define product requirements and choose the right technology and strategies to achieve their objectives.
>
> At Decbricks, we partner with founders and growing teams to audit existing workflows, validate market direction and shape practical technical architectures before development begins—helping turn early concepts into focused, scalable digital products.

**After (with recipe):**
> Define what to build, why it matters, and which architecture will scale before writing a line of code.
>
> Decbricks works with founders and growing teams to audit existing workflows, validate market direction, and map practical product roadmaps. You leave with clear technical requirements and a build plan ready for execution.
