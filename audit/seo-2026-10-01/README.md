# Calculator Street SEO audit — October 1, 2026

## Outcome

The live site has no observed sitewide crawl or indexability blocker. Its robots file permits Googlebot and points to a working sitemap. The sitemap contains 233 unique canonical URLs: 208 calculators, 16 construction categories, and nine other pages. A full HTTP crawl returned 200 for every sitemap URL, with a self canonical and no noindex signal. The final generated HTML audit found every sitemap page reachable from the homepage in at most three clicks, with no broken internal route. This describes **technically indexable candidates**, not Google's actual indexed count.

All 20 requested priority calculators expose their purpose, form, formulas, worked examples, FAQ text, related links, and structured data in initial HTML. Their titles, descriptions, and H1s are nonempty and unique. The 208 calculator pages have no exact duplicate title, description, or H1 in the compiled output. Some generic guidance remains repetitive; its next edits should answer real project-specific questions rather than add filler.

## Implemented and live

| Priority | Finding at baseline | Resolution |
| --- | --- | --- |
| P1 | Four supplemental calculators had no homepage crawl path; two had no incoming page link. | Unified site inventory and category/hub links; all sitemap pages are now reachable. |
| P1 | Search-filter URLs could be served as indexable static assets without executing the Worker's noindex header. | Enabled Worker-first asset routing; live `/calculators/?q=concrete` responds with `X-Robots-Tag: noindex, follow`. Junk template queries redirect to the clean URL. |
| P1 | A few recommended calculator slugs did not resolve and some related tools had no contextual inbound link. | Corrected adjacency and added relevant workflow links; output audit checks internal links. |
| P1 | Earthwork guidance contradicted its compacted-volume capability. | Corrected the explanation without changing the arithmetic. |
| P2 | Shared schema assigned page descriptions to the site entity; the author card overclaimed cited sources. | Kept WebSite description stable and made attribution text factual. No invented reviewer or ratings. |
| P2 | Some calculator metadata and generic FAQ guidance obscured actual tool scope. | Clarified Paver scope and added excavation-specific questions about bottom dimensions, sloped volume, and bank-volume pricing. |

These changes reached `main` in commits `004bd74`, `129adcb`, and `c3540c0`. Live production was checked after deployment for robots, the concrete canonical, search-query response policy, and the new excavation guidance. A Git commit hash is not exposed by the production HTTP response, so the exact deployed hash cannot be independently proved from headers alone.

## Verification and limits

- Current `main` production build: **pass**, 234 generated pages including the 404 page.
- `npm run test:seo`: **pass**, 233 sitemap URLs, 233 indexable built HTML pages, 1,348 parseable JSON-LD blocks, all sitemap pages reachable within three clicks.
- `npm test`: **pass**, 1,589 tests in 33 files.
- `npx astro check`: **zero errors, zero warnings** (51 informational hints).
- Live robots, sitemap, canonical, unknown-route 404, query noindex, redirects, and calculator content were independently checked. User-agent spoofing alone cannot prove access from verified Googlebot IP addresses.
- Playwright test collection lists 211 tests. Browser execution in this workspace was blocked because the Chromium headless executable is absent. Earlier local mobile evidence covers 20 priority pages at 320, 360, 375, 390, 412, and 768 px; see `mobile-performance.md` and `mobile-browser-evidence.json`. It is not a substitute for post-deployment field Core Web Vitals.
- The installed Claude SEO 2.4.1 framework was read and applied across audit, technical, sitemap, page, content, schema, programmatic, image, performance, and search-experience checks. Its bundled runtime doctor reported a missing/stale managed environment; bundled scripts were not run. Equivalent HTTP, XML, compiled-HTML, graph, source, and browser checks were performed directly.
- The connected Search Console property is `sc-domain:calculatorst.com`, but its performance data request returned a provider error. Google-selected canonicals, coverage exclusions, impressions, crawl logs, and actual indexed counts remain **unverified**. Anonymous PageSpeed data was rate-limited; CrUX field data was unavailable. Do not treat low traffic as proof of a specific indexing exclusion or a measured CWV failure.

## Next evidence-driven work

1. Obtain Search Console Page Indexing and URL Inspection data for the priority pages, plus query/page impressions and Google-selected canonicals. This decides whether the remaining traffic issue is discovery/indexing, ranking, or demand.
2. Use GSC query overlap to choose which near-neighbor tools need clearer differentiation, especially Concrete versus Concrete Volume, Earthwork versus Excavation, and broad versus material-specific tools. Do not consolidate useful calculators based only on similar names.
3. Edit the most repeated guidance and add exact source references for material density, yield, coverage, and structural assumptions where those claims appear. Avoid citing a generic institutional homepage as proof of a precise number.
4. Measure mobile LCP, INP, and CLS with field data; inspect the large shared calculator script, SVG label legibility, and consent-accepted ad layout only against actual measurements.

Supporting analysis: `technical.md`, `content.md`, `schema.md`, `mobile-performance.md`, `competitors.md`, `priority-technical.csv`, and `priority-intent-map.csv`. The technical baseline documents issues that the above commits subsequently resolved. Raw crawl responses and browser matrices were retained in the local audit workspace.
