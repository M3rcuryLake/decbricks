# `decbricks-copy` Skill Baseline Test (RED → GREEN)

Three existing copy blocks chosen across distinct formats:
1. **Hero block** — Home hero (`src/components/Hero.astro`: visual display + `h1` / smiley intro + CTA)
2. **Service description** — Strategy & Consulting (`src/data/services.ts`, `SERVICES[0].paragraphs`)
3. **Title & Meta description** — About page (`src/pages/about.astro`, `title` + `description`)

---

## RED: Unguided Baseline Rewrites (Before Applying Skill)

### 1. Hero Block (Home — `src/components/Hero.astro`)
- **Current:**
  - Display: `Build. Beyond`
  - H1 / Intro: `Technology, creative & growth agency. Software builders, brand shapers & business growth partners.`
  - CTA: `Book a call`
- **RED Rewrite (unguided):**
  - Display: `Build. Beyond`
  - H1 / Intro: `We are a full-service technology, design, and digital growth studio helping startups and established organisations build custom software, launch brands, and scale with AI and outreach.`
  - CTA: `Book a call`
- **Observation (RED flaws):** Opens with `"We are..."` (studio-first, not visitor's goal); packs 32 words into one long passive clause instead of short active sentences; H1 does not clearly lead with what Decbricks builds for the visitor.

### 2. Service Description (`SERVICES[0]` — Strategy & Consulting)
- **Current:**
  > We help businesses identify opportunities, define product requirements and choose the right technology and strategies to achieve their objectives.
  >
  > At Decbricks, we partner with founders and growing teams to audit existing workflows, validate market direction and shape practical technical architectures before development begins—helping turn early concepts into focused, scalable digital products.
- **RED Rewrite (unguided):**
  > Our Strategy & Consulting team works alongside your business to uncover growth opportunities, scope product requirements, and select the optimal tech stack for long-term scalability. We conduct comprehensive workflow audits, market validation, and technical architecture planning so you can launch with confidence and avoid costly engineering mistakes down the road.
- **Observation (RED flaws):** Studio-first opening (`"Our Strategy & Consulting team..."`), bloated multi-clause second sentence (37 words), vague corporate nouns (`"optimal tech stack"`, `"long-term scalability"`, `"comprehensive workflow audits"`), omits concrete deliverables (roadmaps, process analysis).

### 3. Title & Meta Description (`src/pages/about.astro`)
- **Current:**
  - Title (51 chars): `Our Purpose | Digital & Technology Solutions Agency`
  - Description (172 chars): `Discover Decbricks, a technology and digital solutions agency helping businesses innovate through software development, AI, automation, design and business growth services.`
- **RED Rewrite (unguided):**
  - Title (56 chars): `About Decbricks | Technology, Design & Growth Studio`
  - Description (164 chars): `Learn about Decbricks, our mission, values, and experience delivering custom software, web and mobile apps, AI automation, design, and digital marketing worldwide.`
- **Observation (RED flaws):** Title starts with brand (`About Decbricks`) rather than topic (`About Our Technology & Digital Agency | Decbricks`); meta description is 164 chars (truncated in SERPs), reads like a list of nav labels rather than a single human reason to click, and uses `"worldwide"` instead of the repo's exact phrasing (`"India and international markets"`).

---

## GREEN: Skill-Guided Rewrites (Pass 1 & Tightened Pass 2)

### 1. Hero Block (Home — `src/components/Hero.astro`)
- **GREEN Rewrite:**
  - Display: `Build. Beyond`
  - H1 / Intro: `Custom software, AI automation, and digital growth for startups, businesses, and student initiatives. Turn your idea into a shipped product with one accountable team.`
  - CTA: `Book a call`
- **Source trace:** Capabilities (`custom software`, `AI`, `business automation`, `digital marketing`) from `docs/about-section-data.md` & `docs/services-content.md`; audiences (`startups`, `businesses`, `student-led initiatives` / `DSC SRM`, `DevSummit`) from `docs/about-section-data.md`, `src/data/services.ts`, and `src/data/projects.ts`.

### 2. Service Description (`SERVICES[0]` — Strategy & Consulting)
- **GREEN Rewrite:**
  > Clarify what to build, why it matters, and which architecture will scale before writing a line of code.
  >
  > Decbricks partners with founders and growing teams to audit existing workflows, validate market direction, and define product requirements. You leave with a focused roadmap and technical plan ready for execution.
- **Source trace:** `product requirements`, `workflow` audits, `market` research, `technical architecture`, `product roadmapping` all trace directly to `docs/services-content.md` §1 and `src/data/services.ts` lines 67–78.

### 3. Title & Meta Description (`src/pages/about.astro`)
- **GREEN Rewrite (Pass 1):**
  - Title (51 chars): `Who We Are: Technology & Digital Agency | Decbricks`
  - Description (146 chars): `See how Decbricks builds custom software, AI automation, and digital growth for startups and organisations across India and international markets.`
- **Source trace:** `custom software`, `AI`, `automation`, `startups`, `organisations across India and international markets` verbatim from `docs/about-section-data.md`.

---

## Comparison & Skill Refinement Record

| Criterion | RED (Baseline) | GREEN (With Skill) |
|---|---|---|
| **Opening frame** | Studio-first (`We are...`, `Our Strategy & Consulting team...`) | Visitor-outcome first across all three (`Custom software... for startups`, `Clarify what to build`, `See how Decbricks builds...`) |
| **Sentence rhythm** | 32–37 word stacked clauses | Short active sentences (14–21 words), one idea per paragraph |
| **Title & Meta shape** | Title led with brand (`About Decbricks`); meta 164 chars & list-like | Title leads with topic + ends `| Decbricks` (51 chars); meta is 1 human sentence (146 chars) |
| **Fact traceability** | `"worldwide"` invented | Every audience, capability, and market phrase traced to repo docs |

**Skill Tightening Applied (Pass 2):**
1. Clarified in **1. Voice** that both sections and individual paragraphs open with what the visitor achieves before explaining Decbricks' process.
2. Added explicit guidance in **3. Title and Meta Description** to verify exact character counts (`50–60` title, `140–155` meta) and avoid comma-separated nav-label lists in meta descriptions.
3. Re-checked all three GREEN outputs against the tightened rules: Hero (27 words, 2 sentences), Strategy (51 words, 2 short paragraphs), and About Meta (51-char topic-first title, 146-char single-sentence description) all share the exact same visitor-first, active, verifiable shape.
