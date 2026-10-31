# CalculatorSt.com SEO + GEO Recovery Plan

**Audit date:** 2026-10-31  
**Repository:** vipulotari-tech/calculatorst.com  
**Scope:** Granular technical SEO, indexation, page-level intent, internal linking, authority, measurement, and AI-answer discoverability.  
**Production status:** Planning/audit artifact only. It does not change application code or deploy the Worker.

## Executive assessment

The public site is discoverable: a recent public search returned the homepage, About page, construction category pages, and individual calculator pages. That rules out a simple assumption that the entire domain is absent from search, but it does not establish how many URLs Google has indexed or whether the pages receive impressions.

The site currently describes a library of 208 construction calculators. The repository has a canonical-only sitemap generator, a robots.txt route, a rendered-HTML SEO audit script, a shared page layout with canonical and Organization/WebSite/WebPage JSON-LD, and calculator-page templates that show formulas, examples, assumptions, related calculators, and author attribution. These are good technical foundations, but none proves that each URL has demand, earns impressions, or is differentiated enough to rank.

**Do not add more calculator pages until Search Console identifies whether the current bottleneck is discovery/indexing, demand, rankings, CTR, or analytics.** More templated pages could increase maintenance without increasing useful search traffic.

## Evidence vs. unknowns

### Verified from public pages and repository source

- The homepage and public search results describe a 208-calculator construction library.
- The public site has /construction/ category hubs, calculator pages, About, Contact, Privacy, Terms, Disclaimer, and an author page.
- src/pages/sitemap.xml.ts builds canonical trailing-slash URLs from static paths and the combined calculator catalog. It intentionally does not fabricate lastmod timestamps.
- src/pages/robots.txt.ts allows crawling and declares https://calculatorst.com/sitemap.xml.
- scripts/audit-seo.mjs checks rendered output for titles, descriptions, canonical URLs, H1s, sitemap consistency, internal links, orphan pages, crawl depth, and valid JSON-LD.
- src/layouts/Layout.astro outputs canonical, meta description, Open Graph/Twitter metadata, and Organization/WebSite/WebPage JSON-LD.
- src/lib/calculator-content.ts generates model-specific descriptions and examples from calculator fields and outputs; this should be validated across the complete rendered URL set for duplication and snippet quality.
- Google search results were visible for the domain in the public search used for this review. This is not a substitute for the Search Console index report.

### Not verifiable without first-party data

- Total clicks, impressions, CTR, average position, and their trends.
- How many submitted URLs are indexed, excluded, crawled but not indexed, or discovered but not indexed.
- Google-selected canonicals vs. user-declared canonicals.
- Which queries/pages already rank in positions 4–30 and could be improved fastest.
- Backlink profile, domain authority metrics, or competitor keyword gaps.
- Core Web Vitals field status in Search Console/CrUX.
- Whether GA4 reports zero users because there are no visits or because consent/tag configuration prevents measurement.

Do not report any of those unknowns as a confirmed defect.

## Priority order

### P0 — Establish the truth (before changing page copy)

1. In Search Console, confirm the property is the Domain property sc-domain:calculatorst.com or the canonical URL-prefix property, and verify ownership.
2. Export the last 3 months and 16 months of Search results by page, query, country, and device. Include clicks, impressions, CTR, and average position. Keep site totals separate from query-row totals because anonymized queries are omitted.
3. Export Page indexing / indexing reasons and inspect representative URLs from every template: homepage, category hub, static calculator, generated calculator, author/about.
4. Inspect these URLs: homepage, /calculators/, /construction/, one category hub, one high-priority calculator, one low-priority calculator. Record Google's selected canonical, crawl time, robots state, fetch state, and indexing verdict.
5. Validate GA4 measurement separately: compare real-time/tag diagnostics with Search Console; do not use GA4 sessions as a proxy for Google impressions.

**Decision gate:** classify the site as (A) indexing/discovery, (B) impressions but poor position, (C) ranking but poor CTR, (D) traffic present but analytics missing, or (E) demand/authority/content competitiveness. Different cases require different fixes.

### P1 — Crawl/indexation and technical integrity

- Build production output and run npm run test:seo; also run the full unit suite and astro check.
- Review generated sitemap against all intended indexable routes and confirm every sitemap URL returns HTTP 200, is indexable, and self-canonicalizes.
- Check redirect behavior for HTTP/HTTPS, apex/www, trailing slash/no slash, and unknown slugs. Keep only one canonical URL variant.
- Check for soft 404s, duplicate titles/descriptions, duplicate H1s, unusually short main content, and pages that differ only by keyword substitution.
- Verify no important pages accidentally receive noindex, no sitemap URL redirects, and no broken links across all 208 calculators.
- Use Search Console URL Inspection and indexing reports as the source of truth for Google's view; public site: queries are only a rough diagnostic.

### P2 — Query-to-page mapping and page-level SEO

Create a page map using Search Console queries, not guessed search volumes:

| Search Console evidence | Action |
|---|---|
| High impressions, position 4–20 | Improve intent match, useful worked example, title/H1 clarity, internal links, and source quality; retest after recrawl. |
| High impressions, low CTR, position already competitive | Test title/description phrasing that reflects the actual result and audience; change one cluster at a time. |
| Relevant queries split across multiple similar calculators | Clarify the unique task of each page, strengthen comparison links, and consolidate only when intent truly overlaps. Do not redirect or delete pages based only on low traffic. |
| Indexed, near-zero impressions over a sustained period | Check demand, query coverage, competition, and distinct value before expanding copy. Do not assume indexing failure. |
| Crawled/discovered but not indexed | Compare usefulness, uniqueness, internal link prominence, rendering, and canonical signals; fix the specific pattern before requesting indexing. |
| Impressions/clicks in Search Console but no GA4 sessions | Debug analytics/consent/tagging; do not rewrite SEO copy to solve a measurement issue. |

For each priority URL, produce a one-page record: target task/query cluster, actual GSC queries, title/H1/description, canonical/index status, unique functionality, calculation/formula evidence, example accuracy, assumptions/limits, technical references, related links, and next test.

### P3 — Internal linking and topic architecture

- Keep the homepage as the broad entry point; use category hubs as topical group pages and individual calculators as task-specific destinations.
- Check every important calculator is reachable within three clicks and has meaningful contextual links from its category and relevant workflow neighbors.
- Link calculators by actual user workflow (e.g., volume → weight → cost) rather than adding generic “related tools” lists everywhere.
- Make hub copy answer a category-level need and explain differences among overlapping tools; avoid repeating the same paragraph across categories.
- Do not build city/location pages for a non-local calculator site or publish thousands of keyword permutations.

### P4 — Content quality, trust, and differentiation

For priority pages, validate the page's real calculation logic against its visible explanation:
- exact inputs/outputs and units;
- a reproducible worked example;
- material assumptions, density/yield source, rounding, and exclusions;
- practical limits and when supplier/project data is required;
- relevant primary sources (manufacturer or recognized technical/industry source), not competitor calculators as authority;
- author/methodology/correction pathways that are factual and current.

Improve only where a user gets a materially better answer. Do not add generic word count, unsupported claims, fabricated author credentials, fake review dates, or FAQ/schema markup solely to chase rankings.

### P5 — Structured data and AI search (GEO/AEO)

- Validate existing JSON-LD syntax and entity consistency from the built HTML. Markup must match visible content.
- Retain useful Organization, WebSite, WebPage, and relevant breadcrumb/entity relationships where accurate. Review SoftwareApplication on calculator pages for semantic fit; do not assume schema alone causes rankings.
- Do not add FAQPage or HowTo markup as a promise of Google rich results; FAQ and HowTo rich-result features have been retired.
- Make each calculator's answer extractable: short direct definition, clear inputs/outputs, formula, one worked example, assumptions, and authoritative citations.
- Use stable entity naming for Calculator Street, its author, and calculator types. Consider an llms.txt or machine-readable index only as a low-priority experiment, not a Google indexing fix or ranking guarantee.
- Track AI referrals/citations separately from Google Search Console; do not claim GEO gains without measurement.

### P6 — Authority and distribution

- Audit referring domains and links to the strongest calculators before pursuing link building.
- Create link-worthy original assets from genuine utility (e.g., documented formula methods, unit-conversion reference tables, material density methodology) only where the data is reliable and maintained.
- Seek relevant citations from suppliers, trade education resources, engineering/community resources, and project guides. Avoid paid link schemes, mass directory submissions, and generic guest-post spam.
- Use query/page performance to decide which assets deserve outreach.

## Implementation guardrails

- Preserve the existing Astro static build and Cloudflare Worker routes; do not migrate to Cloudflare Pages.
- Do not touch the production main branch until code changes are tested and reviewed.
- No broad de-indexing, bulk redirects, deleting calculators, changing formulas, or pillar-guide rewrites without evidence and explicit scoped review.
- Keep the current sitemap policy of not emitting synthetic lastmod values; only add lastmod when real content-change metadata is reliable.
- Avoid generating more pages as a substitute for query research.
- Record baseline metrics before a change, change one cluster at a time, and compare at 14/28/56 days while allowing for crawl/indexing delay.

## Required next input for evidence-led implementation

Connect the site's Google Search Console data source or export:
1. Performance → Search results → last 3 months, dimensions Page + Query, with clicks, impressions, CTR, position.
2. Indexing → Pages export.
3. URL Inspection results for the representative URLs listed above.

With those, prioritize the first 10 URLs by opportunity and deliver page-specific changes instead of guessing from public HTML alone.


## Second-pass review: concrete source-level findings (2026-10-31)

This pass inspected the current `main` branch's actual source for the shared layout, consent component, homepage, directory pages, sitemap, robots route, calculator-content generator, and SEO audit script. These are code observations, not Search Console measurements.

### Confirmed implementation facts

1. **Analytics measurement is consent-dependent.** The shared layout loads GA4 (`G-7RX7TP3LKB`) and initializes Consent Mode with `analytics_storage: denied`. The consent component grants analytics storage only after Accept and sets it denied on Decline. This is a deliberate consent design, but it means a GA4 "0 active users" report alone cannot prove the site has no visitors. Verify GA4 real-time/tag diagnostics and compare with Search Console clicks before concluding there is no traffic. Do not remove consent protections as an SEO fix.
2. **Two public directory pages have related intent but distinct functionality.** `/construction/` is a category hub with selected calculators and topic clusters; `/calculators/` is the full searchable catalog. Their title tags differ, but both H1s currently read "Construction Calculators". This is not automatically a ranking problem. Keep both only if their search purpose and internal links remain distinct; assess query/page overlap in Search Console before changing or redirecting either.
3. **Sitemap and robots logic are present in source.** The sitemap builds canonical trailing-slash URLs from static routes, categories, and calculator slugs. Robots allows crawling and declares the sitemap. This confirms implementation intent, not production HTTP status or Google's accepted/indexed URL counts.
4. **The SEO audit script checks important structural invariants.** It checks one title, one description, one H1, self-canonical, valid JSON-LD, sitemap membership, internal links, orphan pages, crawl depth, and robots sitemap declaration. It does not currently compare titles/descriptions across different pages, grade title/description lengths, measure rendered main-content uniqueness, verify image alt text, check response status/redirects, or validate Google-selected canonicals. These should be separate checks; do not mistake the current audit passing for proof of rankings or content uniqueness.
5. **Calculator descriptions are generated from model fields and outputs.** This is better than one identical description template, but model-derived text can still be similar across related calculators. Compare actual rendered descriptions and main content across the whole catalog before adding copy or creating more URLs.
6. **The public search surface shows the homepage and both directory/hub pages.** Public search results are a limited snapshot, not proof of complete index coverage, clicks, or impressions.

### Revised next actions

- First compare Search Console clicks with GA4. If GSC clicks are also near zero, investigate query impressions/indexing; if GSC has clicks but GA4 is zero, debug measurement/consent.
- In Search Console, compare `/construction/`, `/calculators/`, and the homepage for overlapping queries and selected canonicals before altering headings or merging pages.
- Extend the existing audit script in a separate tested change to report cross-page duplicate titles/descriptions and content signatures, missing image alt text, sitemap URL status/redirects, and page-specific title/H1/description data. Start as warnings/report output before failing CI; establish baseline first.
- Sample calculator pages from distinct families and compare formula correctness, unique functionality, examples, assumptions, citations, and generated text. Prioritize based on Search Console impressions and user value, not arbitrary keyword-density targets.
- Run `npm run build`, `npm run test`, `npm run test:seo`, and `npx astro check` in the project environment before considering any code change for production.

### Important limitation

No connected Search Console report, GA4 report, live Google URL Inspection response, or production HTTP/redirect test result was available in this review. No claim is made here that the site has zero indexed pages, a broken sitemap, a confirmed analytics bug, or a Google penalty.
