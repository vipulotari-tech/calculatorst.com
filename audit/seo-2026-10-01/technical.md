# CalculatorSt technical SEO and sitemap audit — 2026-10-01

Baseline: repository `1437a8d9c8e298f17c0115db573ca755ee08bd1a`, production fetched beginning 06:31 UTC. The full live sitemap crawl, internal-link graph, and core edge checks are complete.

## Evidence established

- Live `/robots.txt` returns HTTP 200, valid plain text, and explicitly allows `Googlebot`, `Googlebot-Image`, `Google-Extended`, and `*` with `Allow: /`. CSS/JS/calculator/category crawling is permitted. No dangerous Disallow directive is present.
- Googlebot Smartphone and desktop use the same robots token, `Googlebot`. `Google-Extended` is an independent AI-training/grounding preference and does not control Search inclusion/ranking. There is no need to modify it to fix Search indexing.
- Live `/sitemap.xml` returns parseable XML and lists 233 URLs. `/sitemap-index.xml` and `/sitemap-0.xml` return 404, which is normal because this small site uses one sitemap. The robots declaration points to the working sitemap. No synthetic lastmod dates are emitted.
- The site has a static Astro architecture (`site: https://calculatorst.com`, `trailingSlash: always`), static metadata/sitemap/robots endpoints, and a Cloudflare Assets Worker. Middleware does not enforce runtime redirects on prebuilt static assets.
- Unknown route `/nonexistent-seo-audit-route/` correctly returns HTTP 404; the deployment is not a SPA catch-all returning 200.
- Apex HTTP, www HTTPS, and missing trailing slash each redirect 301 to canonical URLs. Combined HTTP + www + slashless URL takes three redirects, not the intended one.
- Query-state calculator URLs return 200 with a clean canonical. This preserves shareable calculator states and consolidates indexing signals without redirecting away legitimate inputs.

## Confirmed P1 finding: Worker policies bypassed by static assets

`https://calculatorst.com/calculators/?q=concrete` returns HTTP 200 with no `X-Robots-Tag`. The raw HTML has no noindex directive (default index/follow); a client script may insert noindex after rendering. The server response should carry the intended policy so it does not depend on JavaScript. A junk search parameter (`?q=%24%7BencodeURIComponent`) also returns HTTP 200 rather than the expected redirect.

`worker.js` already contains the correct noindex response policy for search-filter URLs and junk-query removal, but `wrangler.jsonc` does not set `assets.run_worker_first`. Cloudflare's default serves matching static files without invoking Worker code. A small configuration change is appropriate: set `assets.run_worker_first: true` and verify against a local Worker and then production. This makes the existing response policies execute; formulas/content need no change. Recheck redirect chains because an upstream Cloudflare HTTPS rule may still run before the Worker.

Evidence: `edge-variants.json`. Primary references:

- https://developers.cloudflare.com/workers/static-assets/routing/worker-script/
- https://developers.cloudflare.com/workers/static-assets/binding/
- https://developers.google.com/search/docs/crawling-indexing/googlebot
- https://developers.google.com/crawling/docs/about-crawling

## Lower-priority routing concern

Garbage unit route `/ton/` permanently redirects to Gravel Calculator. The old rules also include `/panel`, `/post`, `/ft`, and `/unit`, which do not represent equivalent Gravel content. Mapping unrelated invalid URLs to an arbitrary calculator may look like a soft-404 workaround. Fix the source of malformed links; consider removing unrelated unit redirects so invalid URLs return a real 404. Do not infer these legacy paths cause current low traffic without GSC evidence.

## Limits

User-agent spoof requests are diagnostic HTTP requests from this audit environment, not verified Googlebot traffic. A 200 for a Googlebot string cannot prove allowlisting for real Google IPs or disprove geographic/WAF restrictions. No authenticated GSC URL Inspection, Crawl Stats, Page Indexing, Cloudflare bot logs, or verified Googlebot reverse-DNS/IP evidence is available within this subtask. Actual indexation reasons and chosen Google canonicals therefore remain unverified. Crawlability and technical indexability are prerequisites, not guarantees of indexing or organic traffic.

Installed Claude SEO `seo-technical` and `seo-sitemap` instructions and agent guidance were read and applied. The bundled `sitemap_discovery.py` launcher reports that its isolated runtime requires setup; the audit does not claim the helper ran successfully. Independent controlled HTTP/XML/HTML checks provide the equivalent measured evidence. Browser rendering/mobile/Core Web Vitals measurements are handled by other audit workstreams, not scored here.

## Sitemap and generated route coverage

The working sitemap contains **233 canonical candidate URLs**: **208 calculator pages**, **16 construction category pages**, **1 construction hub**, **1 homepage**, **1 author page**, **1 calculator directory**, and **5 about/contact/legal pages**. XML namespace is correct; every location uses HTTPS on calculatorst.com with a trailing slash, no query/fragment, and no duplicate location. No lastmod/changefreq/priority is emitted, which avoids pretending to know substantive modification dates. One 19055-byte XML file is well within protocol limits.

Generated production output contains 235 index.html routes plus 404.html. All 233 sitemap URLs have generated HTML. The two generated routes deliberately excluded are `/construction/decking/` and `/construction/fencing/`, existing redirect aliases of `/construction/deck-fence/`. The noindex/error 404 output is correctly excluded. No important generated page is missing from the sitemap. Evidence: `route-coverage.json`; re-run against final build if routes are changed.

## Request-header accessibility checks

Desktop Googlebot, Googlebot Smartphone, Bingbot, Google-Extended and Screaming Frog user-agent probes all receive HTTP 200 for `/concrete-calculator/`, the correct self-canonical, and no noindex response. Evidence: `ua-access.json`. This checks string-based access policy from one audit origin only, not Google's authenticated crawler network.

## Full live crawl results

| Measured check | Result |
| --- | --- |
| Sitemap locations fetched | 233/233 |
| HTTP 200 | 233/233 |
| Sitemap URLs redirecting | 0 |
| Correct self-referencing canonical | 233/233 |
| Accidental noindex in HTML or response | 0 |
| Single H1 | 233/233 |
| Nonempty title and description | 233/233 |
| Exact duplicate titles/descriptions | 0/0 |
| JSON-LD parse errors | 0 |
| Broken internal link targets | 0 |
| Largest uncompressed HTML response | 426,926 bytes |
| Sitemap URLs reachable from homepage | 229/233 |
| Homepage graph depths | 1 homepage; 68 pages at depth 1; 160 pages at depth 2; 4 unreachable |

Every sitemap URL passes measured HTTP, canonical and noindex checks. **This establishes 233 technically indexable canonical candidates; it does not mean Google indexed all 233.** The largest HTML response is well below Googlebot's current 2MB HTML fetching limit. JSON validity is not equivalent to eligibility for a Google rich result; schema meaning and duplicate entities are covered by the schema audit. Raw HTML word counts include navigation/footer and are not used as content-quality scores.

Evidence: `live-crawl.csv`, `live-crawl.json`, `technical-summary.json`, `crawl-graph.json`, saved raw source files in `live-html/`. The two additional internal targets outside the sitemap are `/ads.txt` and `/sitemap.xml`, both HTTP 200; neither is a missing HTML landing page.

## Confirmed P1 finding: four calculators are detached from the crawl architecture

| URL | Incoming links from other sitemap pages | Homepage reachability |
| --- | --- | --- |
| /deck-material-calculator/ | 0 | Unreachable |
| /roof-square-footage-calculator/ | 0 | Unreachable |
| /driveway-gravel-calculator/ | 1 | Unreachable |
| /pea-gravel-calculator/ | 1 | Unreachable |

The two gravel pages only link to each other, so they form a detached cluster. All four appear in the sitemap and have correct breadcrumbs, but breadcrumbs provide outbound links to categories rather than inbound links from those categories. A sitemap helps discovery; it does not substitute for navigation or semantic contextual links.

The cause is split inventory: the sitemap manually adds `extraCalculatorSlugs`, while categories, directory and hubs resolve links against `hubCalculators`. `/construction/` even requests `driveway-gravel-calculator` in `additionalPrioritySlugs`, then silently drops it through `.find(...).filter(Boolean)`. Use one canonical listing inventory, or include supplemental static-tool metadata in category/directory/hub selectors. Add relevant contextual inbound links from Deck, Roofing and Gravel tools. Preserve the existing calculators and self-canonicals. Retest the generated and live graph after deployment; all useful pages should be reachable in at most 2–3 clicks.

## Priority order for this workstream

1. **P1:** Restore execution of existing Worker header/redirect policies by configuring Worker-first serving; verify clean pages remain indexable and search filters return noindex.
2. **P1:** Link the four detached calculators from their categories and relevant existing tools; keep inventory/counts consistent.
3. **P2:** Reduce combined URL normalization redirect chains. Worker-first improves the www/slash combination; an upstream HTTPS rule may still require dashboard-level changes.
4. **P3:** Review unrelated garbage-unit redirects; resolve malformed link origins and serve a real 404 for URLs without equivalent content.

No P0 site-wide robots, canonical, sitemap, 404 catch-all or missing-static-content blocker was detected in the measured production sample. Performance field metrics, exact GSC indexation statuses, verified Googlebot access, and Cloudflare dashboard policy remain unmeasured in this subtask. Do not claim a comprehensive technical/CWV score using those unmeasured categories.
