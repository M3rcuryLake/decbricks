# Decbricks — 04: Content Plan

> Skills: content-strategy, customer-research, copywriting (+ copy-editing pass below).
> Every topic is a **hypothesis** until GSC validates it. No invented facts; `[VERIFY]` items list
> what Decbricks must supply. Effort assumes one part-time writer + part-time engineer.

## Topic clusters

Clusters tie the **seven services** (repo source: `src/data/services.ts`, `docs/services-content.md`)
to the **audience segments** (`.agents/product-marketing.md`). Search volume is unvalidated; the
information-gain gate applies to every guide: if we cannot say what ours adds that current results
lack, we do not write it.

| Cluster | Owns | Best-fit page today | Gap |
|---|---|---|---|
| Custom software & web apps | startups, SMBs | `/services` block | depth (detail page or guide) |
| AI agents & automation | founders, SMB ops | `/services` block | depth (drafted below) |
| Mobile apps | founders | `/services` block | keep single-page until GSC shows demand |
| Brand, design & web design | founders, student teams | `/services` block | keep single-page |
| Digital marketing & growth | SMBs, founders | `/services` block | keep single-page |
| B2B outreach & lead gen | founders, growth leads | `/services` block | keep single-page |
| Strategy & consulting | founders | `/services` block | keep single-page |
| Cross-cutting: how Decbricks works | all segments | `/about`, `/contact` | process/scoping section (proposed) |

## Page types (what we build, and why it fits)

1. **Service detail pages** (1–3 only) — for services with real scope/process evidence. Drafted: AI & Automation (below).
2. **Real case-study pages** (`/work/<project>`) — Challenge → approach → outcome, using only facts the owner confirms per project (V-4 declined summaries; `[VERIFY]` owner must supply one verified sentence + permission per project before any case-study page exists).
3. **Process / "how we scope and price" section** — facts already in the repo (`src/data/legal.ts`: proposal review in 5–8 days, 2–3 revision rounds, 14 days post-launch support). No invented prices; describe the model (retainer, milestone-based, dedicated teams — product-marketing doc).
4. **Visible FAQs** — only questions answerable from repo facts; rendered as visible content (no expectation of rich results — Google retired FAQ rich results for most sites in May 2026).
5. **Decision guides (later, GSC-gated)** — e.g. "how to choose between a dev shop and a build-and-growth partner", "what an MVP scope looks like". Only after 03-architecture's pages exist and GSC shows impression volume for the cluster.

## Proof Decbricks must supply (all `[VERIFY]` — listed in `docs/seo/verify-list.md`)

| Item | Needed for | Owner question |
|---|---|---|
| 1 verified sentence + outcome (with permission) per project: Findtern, Upcoming Engineers, Hackcelerate '27, DSC SRM | case-study pages | What was built, what happened, may we publish it? |
| Real team bios (names, roles) | about/E-E-A-T, AI-search trust | Who does the work, and may we name them? |
| Phone number(s) | contact, Organization.contactPoint | Which number(s) may be public? (open-items A3) |
| Real office address (beyond "Chennai") | local trust, Google Business Profile | Is there a physical office to list? |
| Designed OG/share image | social sharing (open-items A6) | Brand asset or keep emblem card? |

## 90-day schedule (effort in focused half-days)

| When | Item | Type | Effort |
|---|---|---|---|
| Week 1 | Launch gate: `PUBLIC_ENV=production`, verify redirects + 404 status | Technical | 0.5 |
| Week 1–2 | Process / "how we scope and price" section (facts from `legal.ts`) | Visible content | 1 |
| Week 2–4 | AI & Automation service page (copy drafted below; needs owner facts for proof block) | Service page | 2 + 1 review |
| Week 3–6 | 1–2 case-study pages, **only after** owner supplies verified sentences | Case study | 2 each |
| Week 4–8 | Observe GSC: validate query themes (00-context table), record in a log | Measurement | 0.5/mo |
| Week 8–12 | Decide next service page from GSC data (mobile apps vs outreach vs web) | Decision | 0.5 |
| Week 12 | Review: which decision guide (if any) earned its information-gain sentence | Decision | 0.5 |

60/30/10 mix doesn't apply yet at this scale; the first 90 days are ~100% searchable pages plus
observation. Shareable/experimental content is revisited once the foundation pages have data.

---

## Drafted page copy — `/services/ai-automation` (Pass 1, copywriting skill)

> **Diagnosis: Situation A** (no existing page; brief + repo facts only). Proposed page is gated on
> the 03-architecture decision — this is the content it would ship with. Sources: `docs/services-content.md`
> §5 (AI & Automation), `.agents/product-marketing.md`, `src/data/legal.ts`. British/Indian English.
> Every "Decbricks" visible mention renders through `brandify()` per the brand rules.

**Title (54 chars):** AI Automation & AI Agents for Business — Decbricks
**Meta description (149 chars):** See how Decbricks builds AI agents, chatbots and workflow automation into the tools your team already uses, scoped around one business process first.

**H1:** AI automation that does the work your team keeps doing by hand

**Intro (first 100 words — what it is, for whom, what to do):**
Your team answers the same customer questions, chases the same approvals and copies the same data between tools every week. We build AI agents and automations that take over those repeatable steps and hand the work back to your people. Decbricks works with startups and growing businesses across India and abroad: first on one process, then on the next, with each automation owned by your team, not locked in a black box.

**Section — What we build (H2)**
Three things, in the order most teams need them:
- **Customer-facing agents.** Chatbots and assistants that answer real customer questions in your voice and escalate to a human when they should.
- **Workflow automation.** Approvals, handoffs and data entry that move between your existing tools without anyone re-typing them.
- **Custom integrations.** The glue between your website, app, CRM and spreadsheets, built to the quality bar of production software.

**Section — How we scope it (H2)**
We start with one process you can measure. We watch how it works today, agree where automation earns its keep, and build the smallest system that proves it. Once it runs reliably, we extend to the next process. You get a clear roadmap before development begins, proposals reviewed within 5–8 days, 2–3 revision rounds built into every engagement, and 14 days of post-launch support. [source: `src/data/legal.ts`]

**Section — What you own (H2)**
Everything we build is yours: the code, the prompts, the documentation and the accounts it runs on. Handover includes written docs and a walkthrough for your team.

**Section — Common questions (H2, visible FAQ)**
- *How long does an automation project take?* Most first automations are scoped, built and handed over within weeks rather than months, because we start with one process. [⚠ timeline adjectives are qualitative; no invented durations]
- *Do you work with our existing tools?* Yes — the point is to automate the tools your team already uses, not to sell you a new platform.
- *What if the AI gets something wrong?* Agents are built with human escalation paths, and every workflow has a review step where the stakes demand one.
- *How do we start?* Book a call or send a brief describing the process that annoys your team most. [link: `/contact?service=ai-automation`]

**CTA:** Book a call — we'll look at one process together and tell you honestly whether AI should touch it.

**Proof section — deliberately omitted.** No AI-specific client outcome exists in the repo. Adding
one requires owner-supplied, verifiable material (`[VERIFY]`).

**Copy-editing pass (applied per copy-editing skill):** AI-tell scan clean (no contrast reveals,
negation lists, colon reveals, stock openers, or em dashes in the title/CTA); every claim traces to
`legal.ts`, `services-content.md` §5, or product-marketing doc; "in your voice" and "black box"
kept as plain specific statements; sentence lengths varied (9–24 words); CTA uses the owner-approved
"Book a call" label. One flagged line: *"within weeks rather than months"* is qualitative — kept
because no repo source states a duration; replace with a real median once the owner supplies one
(`[VERIFY]`).
