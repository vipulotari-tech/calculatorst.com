# CalculatorSt.com Granular SEO Audit — 2026-10-31

**Repository:** `vipulotari-tech/calculatorst.com`  
**Audit window:** Google Search Console and GA4, 2026-08-01 through 2026-10-30  
**Scope:** technical SEO, query/page opportunities, analytics hygiene, page intent, generated content, validation gaps  
**Status:** proposed changes only; this branch is not production and has not been deployed.

## Executive summary

The main current issue is not “no indexing at all.” Search Console is returning visibility for many URLs, but the property-level aggregate shows **5,992 impressions, 20 clicks, 0.33% CTR, and average position 36.02** across the requested 90-day period. The site has a mix of low-ranking pages and a few promising query/page pairs. The next step is to improve selected pages and verify measurement, not to publish more calculator URLs or rewrite every title.

The strongest immediately verifiable technical finding is that the GA4 tag is embedded unconditionally in the shared layout, while GA4 data includes traffic from localhost and Cloudflare preview/staging hosts. This contaminates reporting. The proposed code change limits GA4 loading to the two production hostnames while leaving consent behavior intact.

## First-party data snapshot

### Search Console

| Measure | Result | Interpretation |
|---|---:|---|
| Property-level clicks | 20 | Use the aggregate metric-only query as the baseline |
| Property-level impressions | 5,992 | Visibility exists; it is not translating into many clicks |
| Aggregate CTR | 0.33% | Low overall, but the site-wide average position is 36.02 so do not treat all impressions as a title problem |
| Aggregate average position | 36.02 | Most visibility is likely outside the top results |
| Page rows returned | 337 | Includes URL variants; not the count of indexed pages |
| Query rows returned | 1,110 | Search Console omits some queries for privacy; these are not a complete query universe |
| Page+query rows returned | 1,339 | Use these for page/query pairing, not as site-wide totals |

**Important data consistency warning:** the metric-only aggregate returned 20 clicks and 5,992 impressions, while summing page rows gives 21 clicks and 6,473 impressions. The page rows include `www` and `http` URL variants, while a separate hostname breakdown reported only `calculatorst.com`. Do not add dimensional rows to calculate site totals; verify the same period directly in Search Console before making redirect/canonical changes.

### Highest-visibility page rows

| URL | Impressions | Clicks | Avg. position | Next action |
|---|---:|---:|---:|---|
| `/calculators/` | 366 | 1 | 14.33 | Clarify that this is the complete calculator directory; review queries and snippet |
| `/` | 322 | 0 | 40.89 | Review homepage intent, internal links, and query mix before changing copy |
| `www.calculatorst.com/` | 271 | 0 | 76.72 | Verify live redirect and Google-selected canonical |
| `/carpet-calculator/` | 216 | 0 | 43.13 | Inspect query intent and actual feature match; do not rewrite from page totals alone |
| `/brick-weight-calculator/` | 178 | 0 | 9.27 | High-priority page-level CTR/intent review; query data is sparse/anonymized |
| `/crushed-stone-calculator/` on www | 142 | 0 | 69.32 | Verify URL variant, then inspect the canonical page |
| `/concrete-crack-repair-calculator/` | 141 | 0 | 12.29 | Inspect query/page fit; visible exact-query row is only 14 impressions at position 53.5 |
| `/concrete-weight-calculator/` | 141 | 0 | 48.82 | Review whether its primary intent differs clearly from concrete volume/mix/cost tools |
| `/roofing-shingle-calculator/` | 111 | 0 | 18.87 | Test whether the page truly satisfies cost, quantity, and roof-shape intents |
| `/asphalt-weight-calculator/` | 102 | 0 | 31.54 | Query-to-tool fit and internal-link review |
| `/earthwork-calculator/` | 88 | 5 | 15.08 | Preserve what works; add relevant internal links and check query-level winners |
| `/trench-calculator/` | 82 | 1 | 11.04 | Improve intent-specific content and links after reviewing top queries |

### Specific query/page opportunities

| Query | Page(s) | Evidence | Decision |
|---|---|---|---|
| `cement mix calculator` | `/concrete-mix-calculator/` | 63 impressions, 0 clicks, position 6.17 | A focused title/H1/description experiment is already proposed separately in PR #96; do not stack changes |
| `material calculator` | `/calculators/` | 44 impressions, 0 clicks, position 3.82 | The generic directory ranks for a broad term; inspect the live SERP before deciding whether the snippet is mismatched |
| `shingle roof cost calculator` | `/roofing-shingle-calculator/` | 24 impressions, 0 clicks, position 9.04 | Check that the tool actually calculates cost before promising it in the title |
| `grout calculator` | `/grout-cost-calculator/` and `/tile-grout-calculator/` | 4 impressions at position 3.5 and 13 at position 10 | Possible intent overlap; too little data to merge or redirect |
| `excavation calculator` | `/earthwork-calculator/`, `/excavation-calculator/`, plus URL variants | Several low-volume rows, mostly positions 64–92 | Review tool scope and canonicals; do not redirect based on this sample |
| `asphalt parking lot cost calculator` | `/parking-lot-calculator/`, `/asphalt-driveway-calculator/`, plus variants | Multiple pages appear; low impressions | Possible cannibalization; compare the actual calculators and SERP first |
| `rafter length calculator` | Page-level owner needs confirming | 17 impressions, position 10.88 | Find the owning page in the page+query export, then improve its answer and links |

Some Search Console query rows are very low-volume, unrelated, or language-mixed. Do not create pages to target every observed query. Use query rows as clues and validate intent before making changes.

## GA4 instrumentation finding

The shared `src/layouts/Layout.astro` unconditionally loads `G-7RX7TP3LKB`. The GA4 breakdown for the same date range includes:

- `calculatorst.com`: 164 sessions, 1,551 views, 116 engaged sessions; sources include 104 direct sessions, 58 `chatgpt.com / ai-assistant`, 1 `bing / organic`, and 1 `(not set)`.
- `www.calculatorst.com`: 28 sessions, 396 views; 1 `google / organic` session.
- Non-production hostnames: at least 61 sessions across `localhost`, `127.0.0.1`, `*.pages.dev`, `*.workers.dev`, and malformed-looking hostnames.

The GA4 aggregate event report returned 245 `session_start` sessions and 2,029 `page_view` views, while dimension-level groupings do not reconcile exactly. GA4 organic attribution also does not reconcile cleanly with the 20 Search Console clicks. This may reflect consent, attribution, connector/dimension differences, or environment traffic; it is **not proof of a broken tag or bot traffic**.

**Fix prepared in this branch:** only load the GA4 tag when `window.location.hostname` is exactly `calculatorst.com` or `www.calculatorst.com`. The existing consent-default-denied and consent-update behavior remains. This prevents new localhost/preview-host events from polluting the production property; it does not repair historical data.

After deployment, validate the Realtime report and DebugView on production, then confirm that preview hosts no longer generate GA4 events. Keep `chatgpt.com / ai-assistant` visible as a referral source until the traffic is understood; do not blindly exclude it.

Google notes that hostname filters affect new data only and can permanently remove excluded events. Prefer a report/exploration filter first; if an admin data filter is considered later, test it before activation:
- https://support.google.com/analytics/answer/16608575
- https://support.google.com/analytics/answer/13296761

## Repository review

Verified from source:

- `astro.config.mjs` sets `site: https://calculatorst.com` and `trailingSlash: always`.
- `src/pages/sitemap.xml.ts` builds a deduplicated canonical-only sitemap from static paths and the combined calculator catalog, with no synthetic `lastmod`.
- `src/pages/robots.txt.ts` allows crawling and declares the sitemap.
- `src/layouts/Layout.astro` emits a canonical, description, Open Graph/Twitter metadata, and Organization/WebSite/WebPage JSON-LD.
- `scripts/audit-seo.mjs` checks rendered titles, descriptions, canonical, H1, sitemap membership, internal links, orphan URLs, crawl depth, robots declaration and JSON-LD parse validity.
- `src/lib/calculator-content.ts` creates calculator-specific descriptions and examples from the model fields and outputs. This is better than wholly generic copy, but similarity and uniqueness still need to be measured on built HTML.
- `/calculators/` and `/construction/` both currently use the H1 “Construction Calculators,” while their roles differ: one is the complete tool directory, the other is the category hub.

### Changes prepared in this PR

1. Restrict GA4 loading to production hostnames to prevent staging/local analytics pollution.
2. Change the `/calculators/` H1 to “All Construction Calculators” to align it with the page title and distinguish the directory from `/construction/`.
3. Add `scripts/audit-seo-content.mjs` and an `audit:seo-content` npm command to report duplicate titles/descriptions, title/description length heuristics, repeated H1s, and images missing an `alt` attribute.
4. Preserve this audit and its measured baselines in the repository.

The new content-audit script is diagnostic and does not alter page output. Its report must be run against a fresh `dist/` build to obtain actual duplicate/alt counts; no such run has been performed by this audit session.

## Priority plan

### P0 — validate measurement and URL identity

- Merge only after build/tests pass; then verify production GA4 and preview-host exclusion.
- In Search Console URL Inspection, inspect the homepage, `/calculators/`, `/construction/`, `/brick-weight-calculator/`, and one www/http variant. Record fetch status, index verdict, last crawl and Google-selected canonical.
- Test live HTTP status and redirect chain for `http://www.calculatorst.com/`, `https://www.calculatorst.com/`, and their affected calculator URLs. Expected destination is the preferred HTTPS apex URL, but do not implement a new redirect until current behavior is measured.
- Compare the Search Console UI aggregate with the Windsor.ai metric-only report for exactly 2026-08-01 to 2026-10-30.

### P1 — on-page opportunities

- PR #96: keep the cement-mix title/snippet test isolated and measure the same query/page at 14, 28 and 56 days after deployment.
- Brick Weight Calculator: inspect the live SERP and page title/snippet; avoid broad copy rewrites because page-level impressions are spread across partly anonymized queries.
- Roofing Shingle Calculator: verify whether the tool supports cost estimates, and make the page's title/intro reflect only actual supported outputs.
- Earthwork Calculator: protect the current clicks and improve contextual internal links from excavation, trench and soil/material workflows.
- Calculator directory: keep the H1 change small; then check whether the `material calculator` query is a real fit or accidental visibility.

### P2 — architecture and content differentiation

- Audit overlap among `/calculators/` vs `/construction/`, `/earthwork-calculator/` vs `/excavation-calculator/`, `/grout-cost-calculator/` vs `/tile-grout-calculator/`, and `/parking-lot-calculator/` vs `/asphalt-driveway-calculator/`.
- Assign one primary intent to each URL. Merge/redirect only if the tools answer the same intent and Google-selected canonical/indexing data supports it.
- Add contextual links to priority calculators from category hubs and related workflow pages. Avoid identical generic related-link blocks everywhere.
- Run the new content audit and manually inspect any duplicate groups. Similar titles/descriptions are diagnostic signals, not proof that body content is duplicated.

### P3 — validation not completed

The following are not verified and must not be reported as passed:
- production HTTP status/redirect chains and Google-selected canonicals (live web fetch failed during this session);
- Search Console index coverage/export and URL Inspection verdicts;
- production build, unit tests, `npm run test:seo`, and the new content-audit command;
- Core Web Vitals / Lighthouse / CrUX (Chrome DevTools MCP is not available in this environment);
- backlink profile and competitor gap analysis;
- Google rich-result eligibility (JSON-LD syntax parsing in the existing script is not the same as rich-result eligibility).

## Official guidance used

- Google Search Central SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google canonicalization guidance: https://developers.google.com/search/docs/crawling-indexing/canonicalization
- Search Console URL Inspection: https://support.google.com/webmasters/answer/12482179
- Search Console Page Indexing report: https://support.google.com/webmasters/answer/7440203
- GA4 web-hostname filters: https://support.google.com/analytics/answer/16608575

Google's own guidance stresses useful, unique, people-first content, descriptive title links/snippets, and checking URL Inspection for index/canonical details. A title change or sitemap entry alone does not guarantee ranking or indexing.
