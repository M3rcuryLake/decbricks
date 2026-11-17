# Decbricks — Phase 4: Baseline (checker output on today's site)

> `scripts/seo-check.mjs` run against `dist/` from the 2026-11-17 build (6 pages).
> All checks pass today; the only output is the expected launch-gate warnings.

```
$ npm run build && npm run seo:check
> node scripts/seo-check.mjs

seo-check: 6 HTML files, 4 sitemap URLs
WARN  Non-production build detected (robots.txt = "Disallow: /"). Site-wide noindex is the launch gate, not a failure.
WARN  /about: in sitemap but noindex (expected: launch gate)
WARN  /contact: in sitemap but noindex (expected: launch gate)
WARN  /: in sitemap but noindex (expected: launch gate)
WARN  /services: in sitemap but noindex (expected: launch gate)
seo-check: PASS
```

## Failure-mode verification (smoke test)

To prove the checks bite, a `[VERIFY` string was injected into a built page and the checker was
re-run — it failed with `FAIL /about: banned placeholder string "[VERIFY"` and returned to PASS
after the file was restored. The same run path covers duplicates, canonicals, noindex, JSON-LD,
dead links, alt, size and sitemap mismatches by construction.

## Interpretation

- The 4 warnings are the intentional `PUBLIC_ENV` launch gate (01-audit F-1). They disappear on a
  production build; at that point the checker treats any sitemap page carrying `noindex` as a hard failure.
- No duplicate titles/descriptions, all canonicals absolute and self-referencing, all JSON-LD
  parses, no dead internal links, no images without `alt`, largest HTML is 175 KB (limit 1.5 MB),
  no banned strings.
- Checker limits (documented per the brief): anchors are not resolved (only target pages), and
  `TODO` is scanned in visible text and img alt/aria attributes rather than bundled JS, to avoid
  false positives from minified vendor code.
