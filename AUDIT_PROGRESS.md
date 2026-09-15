# Audit Progress — calculatorst.com

## Batch 5 — 2026-09-16 — SEO & Accessibility Fixes
Branch: `fix/audit-batch5-seo-a11y-fixes` → PR to `main`
Status: Built & tests verified, ready for review/deploy (deploy blocked by secrets)

### What was fixed
- **Header tap targets**: `h-8 w-8` (32px) → `h-11 w-11` (44px) for `#search-btn-mobile` and `#menu-toggle`. WCAG 2.5.5 AAA 44px now passes. `src/components/Header.astro`
- **FAQ chevron**: `h-6 w-6` → `h-9 w-9` (36px) per skill. `src/components/FAQ.astro`
- **Sitemap fake freshness**: Removed `lastmod = today` (every page had same build date). Now omits `<lastmod>` entirely per Google sitemap guidance (priority/changefreq are ignored by Google since 2015; lastmod should be real mtime or omitted). Fixes deceptive freshness signal. `src/pages/sitemap.xml.ts`
- **GA4 consent restoration**: Added synchronous `localStorage.getItem('cookieConsent')` check BEFORE `gtag('config')` sends `page_view`. Previously returning users with accepted consent still sent `denied` page_view then updated. Now restores `ad_storage/analytics_storage` to `granted` before first page_view. `src/layouts/Layout.astro`
- **Organization schema**: `sameAs` unverified `github.com/calculatorst` + `x.com/calculatorst` → actual verified `github.com/vipulotari-tech/calculatorst.com`. Removes dangling entity reference. `src/layouts/Layout.astro`
- **_headers**: Added `/_astro/*` and `/_assets/*` `Cache-Control: public, max-age=31536000, immutable` plus `nosniff` per Cloudflare Pages best practice. Fixes missing immutable for hashed assets.

### Files affected
- `src/components/Header.astro`
- `src/components/FAQ.astro`
- `src/layouts/Layout.astro`
- `src/pages/sitemap.xml.ts`
- `public/_headers`
- `audit/calculator-status.json` (updated date/note)

### Tests & build
- `npm test` — 12 test files, **977 passed** (Duration ~3s) — verified claims.
- `npx astro check` — **0 errors, 0 warnings, 19 hints** (unused vars).
- `npm run build` — **233 pages** in ~13s — verified claims.
- Manual checks:
  - `dist/sitemap.xml` has no `<lastmod>` ✓
  - `dist/_headers` has `/_astro/*` immutable ✓
  - `dist/index.html` contains `h-11 w-11` for mobile menu + restored consent script ✓
  - `organizationSchema` now points to actual repo ✓

### Commit & PR
- Commit on `fix/audit-batch5-seo-a11y-fixes` (to be pushed)
- PR: `fix/audit-batch5-seo-a11y-fixes` → `main`

### Deployment
- **Blocked**: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` not configured in GitHub Secrets.
  - Where to fix: GitHub → `vipulotari-tech/calculatorst.com` → Settings → Secrets and variables → Actions → New repository secret
  - Required secrets: `CLOUDFLARE_API_TOKEN` (Workers API token with `Cloudflare Workers` edit + `Account Resources` read) and `CLOUDFLARE_ACCOUNT_ID` (from Cloudflare dashboard → Account ID)
  - Workflow: `.github/workflows/deploy.yml` — `cloudflare/wrangler-action@v3` uses these secrets. Without them, `Deploy to Cloudflare Workers` step fails (as reported for batches 1-4).
  - Previous deployment claims were premature — changes are merged but NOT live until workflow succeeds. Verify live at `https://calculatorst.com/` after configuring secrets.
- Build artifacts remain in `dist/` (233 pages) ready for manual `wrangler deploy` if needed.

### Known limitations & blockers
- **Deployment**: blocked by missing GitHub Secrets (see above). No code change can fix without user action.
- **Browser verification**: `LIVE_RECHECK_PENDING` for all 205 calculators — requires manual or Playwright recheck on production after deploy (especially GenericCalculator inline handlers vs model).
- **Dedicated vs generic**: 10 dedicated calculators (`concrete-slab`, `deck-material`, `driveway-gravel`, `fence-cost`, `gravel`, `mulch`, `paver`, `pea-gravel`, `roof-pitch`, `roof-square-footage`) have separate inline logic; tests cover models but not browser inline handlers for dedicated. Spot checks pass but exhaustive browser tests pending.
- **Sitemap**: Now omits lastmod entirely; alternative is to use real git mtime per file (requires `git log` at build). Omitted is safer than fake today.
- **Counts**: 201 hub + 4 extra = 205 unique slugs + 4 static alias pages = 233 built pages. Registry count 201 matches hubCalculators; dist has 205 calculator dirs.

### Next action for another session
1. Configure `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` in GitHub Secrets, re-run workflow, verify live at `https://calculatorst.com/` (check `sitemap.xml` no lastmod, headers immutable, consent restoration).
2. Run Playwright `npm run test:e2e` against preview (4321) to verify calculator interactions (Calculate/Reset/Copy, Enter-key, unit selectors, validation `role=alert`, mobile 390px no overflow, dark mode).
3. Audit remaining priorities from `audit/AUDIT.md`: empty AdSense placeholders, external fonts/inline scripts, category duplicate canonicals, cookie banner return-to-settings control.
4. Merge this PR after CI passes, then repeat live checks on production.

## Previous batches (2026-09-15)
- Batch 4: Production deploy and spot verification (docs/audit batch 4)
- Batch 3: Align dedicated calculator explanations and correct bulk mulch pricing (PR #3)
- Batch 2: Fix dedicated calculator validation and takeoffs; add model reference coverage (PR #2)
- Batch 1 (2026-09-15): Align calculator guidance with executable models and clarify fence pricing
