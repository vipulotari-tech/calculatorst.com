# Search Console SEO experiment — Cement Mix Calculator

**Baseline date:** 2026-10-31  
**Site:** https://calculatorst.com  
**Changed page:** https://calculatorst.com/concrete-mix-calculator/  
**Change scope:** One page only; no formula, calculator behavior, URL, canonical, sitemap, redirects, or indexation changes.

## Evidence (Search Console, 2026-08-01 through 2026-10-30)

- Exact query: `cement mix calculator`
- Page: `/concrete-mix-calculator/`
- Impressions: **63**
- Clicks: **0**
- CTR: **0%**
- Average position: **6.17**
- The page-level row for the same URL reports 77 impressions, 0 clicks, and average position 6.77. Page totals can exceed visible query rows because Search Console omits some queries.

This is a high-ranking, zero-click query/page pair. The existing title begins with “Concrete Mix Calculator” while the exact observed query is “cement mix calculator”; the page does calculate cement, sand, aggregate, water and bag quantities from a concrete mix ratio. The change aligns title and H1 with the observed wording while keeping the tool's scope truthful.

## Change shipped in this branch

- Title: `Cement Mix Calculator — Ratios, Sand & Aggregate`
- H1: `Cement Mix Calculator`
- Description: `Calculate cement, sand, coarse aggregate, water and whole bags from concrete volume and your mix ratio. Adjust dry-volume and water-cement factors.`

No unsupported promise, price, date, or formula claim was added. The existing URL remains unchanged.

## Validation and measurement

- Build and SEO/unit tests must pass before merge.
- After deployment, record this query/page's clicks, impressions, CTR and average position at 14, 28 and 56 days, allowing for crawl/indexing delay.
- Compare the same query and URL against the baseline above. Do not stack another title/content change on this page during the initial 3–4 week observation window.
- If CTR does not improve after 3–4 weeks, inspect the live SERP and competing result formats before proposing another change.
- This is a scoped on-page experiment, not a claim that metadata alone will improve rankings or that it fixes site-wide traffic.
