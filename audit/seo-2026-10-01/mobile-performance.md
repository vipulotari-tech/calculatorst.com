# Mobile, performance, images and agent usability audit

Audit date: 2026-10-01. Source/output evidence and a 120-case browser viewport matrix from the built static site; independent live desktop interaction checks. Framework: installed Claude SEO v2.4.1 `seo-performance`, `seo-visual`, `seo-images`, `seo-sxo`, `seo-agentic` and their relevant references.

## Measurement boundaries

No measured field Core Web Vitals result is available. Anonymous PageSpeed Insights returned HTTP 429 (`rateLimitExceeded`, daily shared quota exhausted). CrUX API returned HTTP 403 because authenticated caller identity/API key is required; authenticated analytics were not available to this sub-audit. Thus LCP, INP and CLS field status are **unknown**, not pass/fail. No Lighthouse score or Agentic Browsing X/N fraction is invented. The bundled launcher refused `render_page.py`, `pagespeed_check.py`, `lighthouse_agentic.py`, `capture_screenshot.py` and `agent_ux_check.py` because the project-local managed Python environment is not ready. These failures were preserved as limitations; source/output/manual browser verification supplements the framework without bypassing its bundled runtime.

## Confirmed baseline architecture

- All 20 priority calculators have static `<form>`, descriptive text and inline SVG drawing markup; none depends on a React island to show its initial HTML. Baseline source DOM is 779–1,114 elements per priority page, below the framework's approximate 1,500-element warning.
- Priority output contains zero raster `<img>` elements. SVGs provide `role="img"`, titles/descriptions and `viewBox`-based proportions. Large 4K JPEGs in `public/visuals/` are not referenced by these 20 pages and should not be reported as their load bottleneck.
- Live concrete HTML delivered HTTP 200, `cf-cache-status: HIT` and `cache-control: public, max-age=0, must-revalidate`. Its local JS/CSS fingerprints match baseline output. A single request's timings do not establish user performance or origin TTFB.
- Ads load only after stored or new accepted consent. `AdPlaceholder.astro` reserves a fixed height, but this does not prove a later AdSense placement cannot shift layout. Consent-accepted ad behavior must be evaluated separately from clean local diagnostics.

## Prioritized risks and recommended follow-up

| Priority | Evidence | Implication | Safe next step |
|---|---|---|---|
| P2 | Shared `GenericCalculator` baseline JS: 407,939 raw bytes, 106,771 gzip bytes. The browser script imports `calculator-registry`, which imports `allModels` from ten model families. | Every generic calculator receives the whole model registry. Parse/evaluation cost on slower phones can increase interaction latency; no measured INP failure is claimed. | Separate model families or load the selected model while preserving shared math and initialization. This is a functional refactor requiring regression verification, not an automatic SEO tweak. |
| P2 | Shared CSS: 125,165 raw bytes, 26,996 gzip bytes. `global.css` imports variable Inter and JetBrains Mono defaults. | Render-blocking CSS and multiple font families add network work. Actual downloaded subsets depend on the browser's unicode/weight usage. | Measure requested fonts and CSS coverage first. Consider Latin-only imports and weights used on English pages; retain `font-display: swap`. |
| P2 | Number inputs use explicit `<label for>`, unit selects have `aria-label`, errors have IDs/`role="alert"`, and focus styles exist. Input font size is declared 14px in generic calculator. | Form semantics are broadly strong, but iOS Safari may zoom focused small text inputs and label nesting contains multiple controls. | Verify using rendered accessibility diagnostics; changing input font size to 16px is a small usability candidate after baseline checks. |
| P2 | SVG layouts include small 10–13 user-unit text in a 760-unit-wide viewBox. | A drawing can fit the viewport while labels become too small to read. Width responsiveness alone is insufficient. | Confirm rendered effective font sizes; provide mobile stacked views, accessible text summaries or a zoomable diagram. |
| P2 | Consent banner uses `role="dialog" aria-modal="true"` but source does not trap focus or make background inert. | Declared modality differs from the actual interaction model; a screen reader may perceive a modal despite usable background controls. | If it stays nonmodal, use a named region rather than claiming a modal dialog; verify keyboard access and visible focus. |

`client.BxWss2ux.js` (191,573 raw / 59,629 gzip bytes) exists in build assets, but priority concrete HTML does not reference it. Asset presence is not proof of transfer, and it is excluded from concrete's JS total.

## Search experience and agent readiness

Calculator pages align with a tool/calculator page type by actual form markup; no complete keyword-specific SERP consensus or persona score is claimed in this sub-audit. Input/result explanations, formulas, native links and stable IDs help both search visitors and browsing agents. Missing optional WebMCP, llms.txt or discovery proposals must not be described as Google Search indexing blockers or promise traffic gains. Accessibility and usable mobile controls take precedence over those optional layers.

## Independent live browser verification

Live Cloud Browser viewport: 1363 × 936 CSS pixels. The browser exposed named native input controls, unit selectors, live SVG title/description, a text diagram summary, formulas, worked example, static related links and results in its accessibility tree. The live desktop screenshot showed intact controls and a dismissible bottom cookie banner. Cloud Browser does not expose a viewport-resize API here, so this is **not** a substitute for the six requested mobile widths.

| Live action | Observed result | Verification |
|---|---|---|
| Change length to 12ft, width 10ft, thickness 4in, default 10% allowance | 1.6296yd³ order volume; 74 80lb bags; 6,600lb | Independently matches 12×10×(4/12)×1.1 = 44ft³; 44/27 = 1.629629…yd³; ceil(44/0.6) = 74. |
| Change length unit to m and set 3.6576m | Same volume and bag result; text diagram displays mixed units | 3.6576m = 12ft. |
| Set length to 0 | “Enter a number greater than zero”, stale estimate cleared to “—”, Copy Result disabled | Invalid state announced in accessibility output. |
| Reset | Length returned to 20ft, order volume 2.716yd³, Copy Result enabled | Inputs/units/result restored. |

The visible error log entries during this run came from the browser extension (`chrome-extension://…/content-script.bundle.js`, metadata-send errors), not from application source. No application console error was observed in the inspected entries; this limited log sample cannot prove absence of every possible error.

Rendered desktop concrete diagram width was 718px with viewBox 760 units; input fonts were 14px. Mobile diagram legibility was confirmed in the following local browser matrix.

## Evidence files

- `mobile-performance-source.json`: per-priority-page DOM, HTML bytes, SVG/image, scripts and island census.
- `mobile-check.mjs`: reproducible six-width browser/axe audit (third-party scripts intentionally excluded from local functional diagnostics).


## Local browser matrix — baseline and implemented remediation

Chromium 153.0.8010.0, via repository Playwright and `/tmp/calculatorst-chromium`, tested all 20 priority calculators at 320, 360, 375, 390, 412 and 768px (120 cases). The built static files were served inside the same execution lifetime as the browser because the sandbox network namespace did not retain an independently launched background preview. Third-party analytics/ad requests were excluded from this local app diagnostic. This validates HTML/CSS/JS behavior, not Cloudflare routing/security headers or accepted-consent ad performance.

All 120 cases had zero unnamed visible controls, zero visible controls smaller than 24px on either axis, and zero application `pageerror` events. At 375px, all 20 SVG diagrams scale their drawing text to approximately 3.1–6.9 CSS pixels. Representative diagram screenshots were visually reviewed; these are too small for comfortable reading. The adjacent HTML summaries remain readable and expose the active dimensions/project choices to assistive technology. Diagram resizing/stacking/zoom is recorded as remaining P2 work, not silently claimed fixed.

The full document did not develop horizontal scrolling. A geometric audit nevertheless detected related-tool cards extending beyond the right edge at 320px on four pages, with body clipping hiding the excess. This is a real narrow-screen card clipping issue. Scrollable table content inside its intended container is classified separately and is not reported as document overflow.

| Page | Card clipping viewport | Effective diagram fonts at 375px | Baseline axe WCAG finding |
|---|---|---|---|
| concrete-calculator | None | 3.45–6.25px | None |
| paint-calculator | None | 3.12–5.26px | None |
| gravel-calculator | None | 3.45–5.26px | scrollable-region-focusable |
| mulch-calculator | 320 | 3.45–5.10px | None |
| roofing-calculator | None | 3.45–5.10px | None |
| roof-pitch-calculator | None | 3.62–5.26px | scrollable-region-focusable |
| flooring-calculator | None | 3.29–5.10px | None |
| carpet-calculator | None | 3.45–5.10px | None |
| tile-calculator | None | 3.45–4.77px | None |
| concrete-slab-calculator | None | 3.45–5.43px | scrollable-region-focusable |
| drywall-calculator | 320 | 3.12–4.93px | None |
| fence-calculator | None | 3.45–6.91px | None |
| deck-calculator | None | 3.45–6.25px | None |
| paver-calculator | None | 3.12–6.58px | None |
| asphalt-calculator | None | 3.45–6.58px | None |
| brick-calculator | None | 3.29–6.58px | None |
| concrete-block-calculator | 320 | 3.29–6.58px | None |
| rebar-calculator | None | 3.29–6.25px | None |
| excavation-calculator | 320 | 3.29–4.28px | None |
| earthwork-calculator | None | 3.29–5.26px | None |

The four default-visible confirmed `scrollable-region-focusable` instances were fixed by making the named table regions keyboard-focusable (`tabindex="0"`, `role="region"`, descriptive `aria-label`). Changes are limited to two Gravel table wrappers, the Roof Pitch worked-example wrapper and the Concrete Slab example wrapper. The same semantic repair was also applied to the Roof Pitch conversion reference table inside its closed details section, so it remains keyboard-accessible when opened. Formulas and calculator handlers were untouched. The source-level consent semantics fix was also applied by the main audit to match the banner's actual nonmodal behavior.

Baseline evidence is retained in `mobile-browser-baseline.json`; the follow-up matrix evidence is `mobile-browser-evidence.json`. All 120 follow-up cases had **zero visible uncontained overflow, zero unnamed controls, zero sub-24px controls, zero application page errors and zero axe WCAG violations**. The narrow-screen related-card clipping was resolved in the shared component by adding `min-w-0` to grid items and `w-full` to their cards. The fifth, initially closed reference table passed the focused final-build check: expand the section, focus its named region, ArrowRight scrolls it horizontally (`scrollWidth=440`, `clientWidth=276`, positive `scrollLeft`); axe returned zero violations. Evidence: `mobile-expanded-table-final.json`. Screenshots are under `screenshots/`, with mobile375 and desktop1920 and mobile diagram375 samples for Concrete and Roof Pitch. These are browser lab observations and do not establish field LCP/INP/CLS.
