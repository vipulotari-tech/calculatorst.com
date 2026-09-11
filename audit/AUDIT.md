# Calculator Street production audit

Baseline captured 2026-09-11 against https://calculatorst.com. Repository baseline: `433ea6d`. Evidence: `baseline/routes.json`, `baseline/browser.json`, `baseline/tracking.json`. Raw pages and screenshots are retained locally and excluded from Git.

## Inventory and verified baseline

- 205 unique calculator URLs: 201 hub records plus 4 additional dedicated routes. All are construction/home improvement calculators. Ten routes have dedicated implementations; 195 use the generic component.
- 236 live URL requests completed without transport failures. The deliberately nonexistent route returned 404. Existing requested pages returned 200 after redirects.
- 194 calculator pages explicitly request noindex and are absent from the sitemap. The sitemap contains 36 URLs. This is a concrete barrier to those pages appearing in search, not evidence of a Google penalty.
- 210 production browser pages checked, including all 205 calculators. No page-load exceptions or horizontal document overflow at 390px. This does not validate mathematical correctness. Several calculators silently render errors, invalid totals, or unrelated results.
- Baseline build passed: 233 generated pages. Existing 59 unit tests passed in 7 files. Astro check: 0 errors, 0 warnings, 35 hints. Tests exercise separate utility code, not production inline formulas.

## Priorities

### CRITICAL

1. Specialty calculators dispatch by substring to unrelated formulas. Confirmed examples: slab reinforcement returns concrete volume; CMU reinforcement returns invalid brick counts; cement/sand ratio enters the gravel branch; mortar mix returns thickness; beam/header sizing returns piece counts; ceiling joists treat spacing as feet. These violate the user's search intent and can mislead material orders.
2. Incorrect geometry and unit handling: solid stair volume omits the increasing height of successive steps; asphalt thickness treats short tons as cubic feet; hollow tubes and backfill allow impossible geometry; several inputs silently replace zero with a fallback.
3. Construction design claims exceed implementation: fixed 40-diameter rebar laps and placeholder header sizing are not code checks. CRSI requires project-specific lap details. Replace with explicit estimating inputs and clearly bounded mechanics.
4. Production logic and tested functions are duplicated. Tests can pass while the calculator fails. Consolidate the executable code and test the browser path.

### HIGH

5. 194 calculator pages are noindexed and omitted from the sitemap. Repair their usefulness and calculations, then restore indexability without changing their URLs.
6. GA4 accepted consent is not restored on subsequent full-page navigation. The recorded ID is G-7RX7TP3LKB. Production emits denied-consent page-view requests even after returning with accepted localStorage. CSP also blocks Cloudflare's injected beacon; Google regional collection hosts are missing. GA property ownership, filters, actual audience and receipt in Realtime remain account-side checks.
7. Flooring with a price hits an out-of-scope `cov` variable and renders an error. Specialty tile grout, adhesive, drywall screws/tape/compound, spray foam, roof flashing/sheathing/underlayment, and gates return inappropriate generic outputs.
8. Repeated rounding before waste inflates package counts. Carpet's stated order area ignores roll-width offcuts. Deck fasteners count boards instead of actual joist intersections. Fence panels ignore entered spacing; concrete-per-post assumptions lack geometry.
9. Generic content and examples do not match page inputs/results. Metadata contains repeated words and unsupported output promises. Trust pages claim hand verification and no tracking without evidence. Generic HowTo schema describes steps/results some calculators do not offer.
10. GitHub deployment workflow assumes `fast-filament/` inside a repository where package.json is at the root and omits tests. Fix the path and require quality checks before deployment.

### MEDIUM

11. Sitemap lastmod is derived from filesystem timestamps and changes on checkout. Remove unsupported freshness timestamps; preserve canonical URLs.
12. robots.txt blocks every query string, including campaign-tagged URLs. Canonicals can handle non-content parameters without a blanket crawl block.
13. Two category aliases respond with duplicate content; identify existing redirect behavior before touching them. No mass URL changes are justified.
14. Cookie banner conflates analytics and personalized ads, claims no tracking, lacks a return-to-settings control, and falsely declares itself modal. Privacy text does not describe actual loading behavior.
15. Empty advertising placeholders consume space before useful explanations. External font requests and repeated large inline scripts add unnecessary work. Some diagrams/reference images are unrelated to the specific calculator.
16. Accessibility checks found keyboard-inaccessible horizontal table containers; small or obscured unit targets require retesting at scroll positions. All mobile and dark layouts need checks at 320, 390, 768, and desktop widths after changes.
17. Counts and discovery registries disagree (201, 204, 205); some category slug/cluster comparisons omit items. Header and homepage search duplicate data and handlers.

### LOW

18. Unused components, imports, duplicated conversion helpers, and unreachable scripts complicate maintenance. Remove only after confirming they are unused.
19. Organization schema has unverified social identities and dangling entity references. Use only supported entities and factual visible information.

## Implementation plan

1. Preserve this URL inventory and baseline; build an explicit per-URL calculator specification instead of substring dispatch.
2. Consolidate production calculations, units, validation and result rendering. Independently test each formula family and every URL's required inputs, zero/negative/large/small values, unit equivalence and displayed outputs.
3. Keep existing URLs and useful differentiated intentions. Replace misleading content with task-specific inputs, formulas, worked examples, limitations and related tools. Record a keyword/intent decision for every calculator; unavailable Ahrefs metrics remain unavailable.
4. Repair consent restoration and CSP, factual trust pages, schema, sitemap, discovery and accessibility. Keep optional tracking optional. No extra analytics package.
5. Run build, type check, lint, unit, route/SEO, browser, accessibility, mobile, link and asset checks. Review Git diff and secrets, commit and push the correct branch, deploy the existing Cloudflare worker, then repeat live checks. Do not deploy with critical failures.

## Research boundaries

Search Console indexing reasons, actual Google rankings, GA4 property data and AdSense rejection reasons cannot be inferred from public page loads. Requested account evidence is pending. Ahrefs' public generator was opened and a construction keyword submitted; no verified volume/KD/traffic-potential results have yet been captured. Do not label an inferred long-tail opportunity as measured low competition.

Sources consulted: [Google helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), [canonical guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [AdSense readiness](https://support.google.com/adsense/answer/7299563), [Google tag CSP](https://developers.google.com/tag-platform/security/guides/csp), [CRSI laps](https://www.crsi.org/reinforcing-basics/reinforcing-steel/splicing-bars/lap-splices/), [CMHA estimating](https://www.cmha.org/resource/tek-04-02a/), [QUIKRETE yields](https://www.quikrete.com/calculator/main.asp).
