# Decbricks — 06: AI Search Readiness

> Skill: ai-seo. Framing: Google's own guidance is that AI Overviews/AI Mode need no special markup,
> files or content rewrites — the best practices are normal, people-first SEO. The extractable-structure
> layer below mainly helps non-Google engines (ChatGPT, Claude, Perplexity) and autonomous agents,
> and none of it harms Google.

## Where Decbricks stands today

- **Crawler access:** robots.txt is currently just `User-agent: * / Allow: /` in production, so all
  AI crawlers inherit open access. No WAF/CDN rules exist in the repo. **Nothing to fix access-wise
  today; the policy decision below is still open.**
- **Entity clarity:** Organization JSON-LD with name, Chennai address, `areaServed`, `sameAs`
  (three real profiles) — good entity grounding. Product-marketing doc gives one consistent
  description ("technology and digital solutions agency helping businesses…") reused across
  `site.ts`, JSON-LD and social bios — the consensus signal AI systems look for.
- **Extractable structure:** pages answer directly (home H1 is a full sentence; service blocks
  lead with a one-line outcome). Weak spots: no standalone definition block of "what Decbricks is"
  on any page beyond the meta description; work proof is unlinked posters (no per-project URL an
  assistant could cite); testimonials are rendered as text (good — not baked into images).

## Recommendations (mechanism + metric, no promises)

1. **Answer-first section structure on any new page** (04-content-plan drafts follow this):
   each H2 section opens with a direct 40–60-word answer, then detail. Already applied in the
   drafted AI page.
2. **A plain definition of what Decbricks is and does** in the first screen of `/` and `/about`
   exists in copy; keep it consistent with `site.ts` description when either changes.
3. **Consistent facts across pages and profiles:** one vocabulary for services (existing IDs),
   one description, Chennai stated uniformly (owner-approved V-9). When bios/phone/address land
   (`[VERIFY]`), update all surfaces in the same commit.
4. **Crawlable proof:** case-study pages (03-architecture) give assistants real URLs to cite;
   unlinked poster images cannot be cited.
5. **`llms.txt`:** optional, low-effort, unproven. The brief forbids treating its absence as a
   problem; recommendation is **skip for now** and revisit if a per-page reason appears (no docs/
   pricing content exists for it to summarise).
6. **`/pricing.md` machine-readable file:** Decbricks publishes no fixed prices (engagement-based:
   retainer/milestone/dedicated teams). A pricing.md would have to describe ranges — only possible
   with owner-supplied figures (`[VERIFY]`). Skip until then.

## AI crawler policy — decision for the owner (do not change robots.txt before the gate)

Crawler groups have different purposes and should be decided separately (ai-seo guidance):

| Group | Examples | What allowing it does | What blocking it does |
|---|---|---|---|
| Search discovery | OAI-SearchBot, PerplexityBot, Claude-SearchBot, Googlebot (feeds AI Overviews) | Your pages can be retrieved and cited when a user searches | Removes you from those answer products |
| User-triggered retrieval | ChatGPT-User, Claude-User, Perplexity-User | A user's prompt can open your pages live | Blocks live lookups mid-conversation |
| Model training | GPTBot, ClaudeBot, meta-externalagent, CCBot | Content may inform future models | Keeps content out of training corpora |
| Google grounding control | Google-Extended | Affects some Gemini uses of already-crawled content | Does **not** affect Google Search inclusion or AI Overviews |

Options:
- **A (default, zero changes):** keep `User-agent: * / Allow: /`. Everything allowed. Maximum
  discoverability; content may be used for training.
- **B:** allow discovery + retrieval, disallow training bots only (named group for GPTBot,
  ClaudeBot, CCBot, meta-externalagent). A defensible middle for a services firm that treats its
  methodologies as proprietary.
- **C:** block all AI crawlers. **Not recommended** — it removes Decbricks from the surfaces where
  buyers increasingly research agencies, for little gain.

My recommendation: **Option A now, revisit Option B when real case-study/IP content exists.**
This is the owner's call; robots.txt.ts changes only after approval.

## Monitoring (observation, not expectation)

- Monthly manual check (no tools bought): run 10 buyer-shaped prompts ("best software development
  agency for startups in India", "agencies that build AI agents", "decbricks review"…) in ChatGPT,
  Perplexity and Google; log cited/not-cited, which pages, n=3 runs each.
- GSC has **no AI-specific report**; Google AI surface performance reads through the standard
  Performance report (08-measurement).
