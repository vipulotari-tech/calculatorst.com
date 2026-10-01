# CalculatorSt content, programmatic architecture and intent audit

Audit date: 2026-10-01. Source baseline: repository inspected before changes in this run. This is a repository-wide model/content inventory with manual template, all-category and 20-priority-page review. Independently retrieved public Paint, Flooring and Earthwork pages corroborate the documented template, explanatory HTML, worked examples and FAQs. Retrieval can use a recently crawled copy; the team's direct HTTP/build report controls current deployment verification.

## Framework and limits

Applied installed Claude SEO `seo-content`, `seo-programmatic`, `seo-cluster` and `seo-plan` instructions, plus `seo-cluster/references/hub-spoke-architecture.md`. Focus: Who/How/Why; useful original task scope; distinct model attributes; intent-driven hub/spoke links; assumptions and sources; generated vs authored copy. The skill's word-count and link-density floors are heuristics, not Google requirements. No word-count expansion, fake expertise, ratings or indexing promises are recommended. No keyword-volume, SERP-overlap or backlink database was supplied; intent mapping is based on executable tool behavior and search-language semantics, not a claimed measured demand score. GSC is required to distinguish actual ranking cannibalization or Google indexing exclusions from risks.

The 204 tools are already published, explicitly requested for audit and backed by model attributes. The skill's 500+ unjustified-page publication gate does not apply. A shared arithmetic formula is not by itself thin content: custom material inputs, units, assumptions and workflow can create genuine value. No page is recommended for deletion/noindex based only on current traffic or generic FAQ structure. No percentage-based penalty claim is made: a defensible whole-rendered-main-content uniqueness percentage needs tokenized HTML comparison and editorial interpretation.

## Inventory and architecture

- 204 registered hub calculators across 16 main clusters; 183 model keys.
- All 204 have model formula, fields, assumptions, executable initial worked examples, subgroup membership and outgoing workflow adjacency.
- No exact duplicate titles or descriptions in the hub inventory. This does not prove rendered metadata is all unique: manual page overrides and descriptions differ from the inventory.
- 19 groups repeat an exact formula; seven groups share one model key. That is an editorial review queue, not evidence that every group should be consolidated.
- 73 nonmanual calculators have only the generic four-question FAQ (what it calculates, units, Reset, limitations); 83 lack an authored page-specific guidance block. Their formula, worked example and model assumptions still provide substantive unique task content. Author extra copy only when it resolves real project questions.
- 79 model records have no source beyond competitor calculators, or no source at all. Curated manual page references must be assessed separately. Elementary area/volume arithmetic requires transparent derivation, not an arbitrary standards citation; material densities, yield claims and structural advice warrant exact supporting references.
- Concrete has 17, mortar 12; the main category counts are data-derived and currently consistent with the 204-tool catalog. The historical 15-vs-17 concern is not present in this source baseline.
- Header and footer contain normal HTML category anchors, hubs contain calculator links and pages have visible breadcrumb links. The 204 registered tools have category membership; four supplemental static calculators are outside this inventory and require the full 208-page graph audit. That graph confirmed four unreachable tools, including two zero-incoming orphans (see technical.md). Most calculator discovery is homepage -> category -> calculator (2 logical clicks), or homepage -> Construction -> category -> calculator (3). Direct generated/live link graph results belong to the technical audit.

| Cluster | Tools |
|---|---:|
| concrete | 17 |
| slab | 10 |
| foundation | 10 |
| rebar | 10 |
| brick | 15 |
| cmu | 10 |
| mortar | 12 |
| gravel | 15 |
| excavation | 10 |
| framing | 15 |
| roofing | 15 |
| flooring | 15 |
| drywall | 15 |
| deck-fence | 15 |
| landscaping | 10 |
| asphalt | 10 |

## Highest-impact findings and safe resolution

### P1: Missing contextual incoming workflow links

Baseline adjacency contained two nonexistent targets (`cmu-mortar-calculator`, `roof-cost-calculator`). The generic page filters nonexistent records out, so these are silently missing recommendations rather than rendered 404 links. Replaced with `concrete-block-mortar-calculator` and `roofing-calculator`.

Thirteen tools had zero incoming links from other calculators' workflow lists despite being reachable from categories: concrete curb, ramp and waste; shed foundation; brick paver, waste and joint; masonry block; concrete block weight; sand cost; roof waste; retaining wall; construction material cost. Curated links now connect each from a relevant existing tool. This strengthens related-task discovery without a sitewide list of all calculators or formula changes. Maximum six rendered recommendations remains enforced; an independent registry/graph check returns zero invalid targets, zero zero-incoming tools and zero lists exceeding six. This graph counts the adjacency API; manually authored pages have separate related lists and must be included in rendered-HTML verification.

One relevant test file (`final-seo-architecture.test.ts`) passed, 3/3 tests. The root agent owns broad build/browser/test verification.

### P1: Earthwork explanatory contradiction

Baseline `src/pages/[slug]/index.astro` FAQ says the tool only applies swell and that shrinkage/compaction must be handled separately. `earthwork-dedicated` actually supports entered bank-to-compacted reduction and emits compacted equivalent. Correct the answer to explain that bank-to-loose swell and bank-to-compacted reduction are separate transformations from bank volume, with project-specific factors. This is a direct user trust/content accuracy issue, not a request to change the arithmetic.

### P2: Generic FAQ and repeated output labels

Priority Paint, Drywall, Fence, Deck and Asphalt have no authored page-specific FAQs in this baseline. Practical scope questions (ceilings/coats; sheet orientation; gates/both sides; board direction; compacted density) are more useful than another Reset explanation. Preserve model-generated formula/example content but supplement with concise, verified assumptions and proper adjacent tool guidance. Paint output/FAQ text repeats “Calculated paint requirement” because gallon/liter rows share a label: show each quantity's unit or deduplicate only the explanatory output list, keeping the worked result table intact.

### P2: Same-model intent differentiation

Prioritize Roof Pitch vs Roof Slope; Deck vs Deck Board; Paint vs Wall Paint/Primer/Paint Cost; Flooring vs Hardwood/Laminate/Vinyl; bulk Asphalt vs Driveway/Parking Lot; Tile vs Tile Quantity; shared known-quantity cost pages. Do not consolidate solely on URL words. GSC query/page exports and actual top-result overlap should guide future consolidation. State broader vs narrower task up front; tailor manufacturer inputs, worked projects, limitations and contextual links. The existing concrete/foundation/rebar/masonry authored guidance is a good implementation pattern.

### P2: Metadata/content source drift

Metadata is distributed among `hubCalculators.ts`, `calculators.ts`, literal manual pages and maps in `[slug]/index.astro`. Example baseline hub Concrete Volume advertises six shapes while the current page/model supports nine; Slab hub snippets omit circular/thickened-edge/subbase features; Mulch original catalog description claims multiple areas although current tool repeats identical rectangular beds. Make verified rendered metadata the authority and align navigation-card summaries when scope changes. Several fallback descriptions in mortar/gravel/excavation are generated by label concatenation and forcibly truncated with `...`; authored complete descriptions should replace them when safe. No fixed 160-character rule is a Google requirement.

### P2: Trust sourcing and author precision

Visible author Vipul Otari and linked author/about pages explain source/model/testing methodology without claiming engineering credentials. Contact, policies and disclaimers are present. Independent reviewer is optional and none is fabricated. Model examples generated by the same arithmetic are explanatory demonstrations, not independent formula verification; current comments correctly acknowledge this. The root agent should preserve that distinction in trust copy. Global “cited sources” copy overstates pages with no visible primary source; phrase it conditionally. Technical sources should support the actual product/assumption, not only link an organization's homepage.

### Category aliases: repository residue versus deployed behavior

`categoryContent.ts` retains decking/fencing aliases mapping to the complete deck-fence cluster; `[cluster]/index.astro` derives paths from that map in the inspected source. Therefore those paths are nominally generated and would reuse the same broad title/H1/tool list. However `public/_redirects` already declares 301 redirects for both aliases to `/construction/deck-fence/`, and sitemap uses canonical `hubCategories` only. Do not report a proven live canonical blocker from these dead/residual declarations. Verify the hosting redirects win, then optionally remove unreachable alias generation in a future cleanup. Preserving redirects protects historical backlinks.

## Twenty priority tools: dominant task and practical content improvement

Inventory titles/descriptions/model details and query variations are in `priority-intent-map.csv`. The mapping assigns one dominant use case per tool and records overlap risks. It does not claim search volumes or Google rankings.

| Tool | Dominant task | Existing/remaining differentiation |
|---|---|---|
| Concrete | Multi-shape concrete quantity / order estimate | Volume, slab, cost and pour: broad entry point; shape tools add detail. Explain requested waste versus supplier rounding and direct users to the Waste tool. |
| Paint | Paint volume and whole containers for four room walls | Wall Paint, Primer and Paint Cost currently share the paint model. Add useful questions about coats, ceiling exclusion, porous surfaces and container rounding; clarify price per selected container. |
| Gravel | Bulk gravel volume, weight and supplier quantity | Crushed Stone and aggregate are material-specific variations. Source density presets to supplier/product references where possible; clearly label compacted vs loose state. |
| Mulch | Mulch volume and bags for measured rectangular beds | Mulch Cost prices a known quantity, separate from geometry. Avoid duplicated how-much-mulch questions; cite reliable depth/placement guidance only where actually discussed. |
| Roofing | Sloped roof area and packaged roofing materials | Roof Area is geometry; Shingle tools are product-specific packages. Guide irregular roofs and effective package coverage; do not imply bundles universally equal one-third of a square. |
| Roof Pitch | Convert pitch, angle, slope and straight rafter geometry | Roof Slope offers same formulas/near-identical intent. Maintain clear primary pitch ownership; investigate actual GSC overlap before consolidating Roof Slope. |
| Flooring | Floor area, allowance and whole package coverage | Hardwood, Laminate, Vinyl reuse the same formula and defaults. Add material-specific installation/coverage guidance on satellite pages; link quantities to broader flooring tool. |
| Carpet | Roll-strip purchase area and carpet quantity | Carpet Cost shares roll-strip formula plus pricing. Explain seam orientation and that fixed orientation may not find the minimum purchased layout. |
| Tile | Straight-layout tile count and whole boxes | Tile Quantity repeats the same formula. Specify when an area-only result differs from full row/column count and joint allowances. |
| Concrete Slab | Slab quantity, bags, edge concrete and subbase | General Concrete handles multiple shapes; Slab Cost broader cost. Keep unique slab outputs prominent; cite product bag yield rather than using competitors as formula authorities. |
| Drywall | Wall/ceiling sheet takeoff, coverage and ordering | Drywall Sheet is known-area sheet coverage. Add sheet orientation and openings guidance plus seams/offcut limitations; replace generic Reset FAQ with practical drywall questions. |
| Fence | Fence-run material layout and post/panel/picket quantity | Fence Post/Panel/Picket should own narrower purchasing tasks. Add questions about gates breaking runs, both fence sides and individual runs; confirm content matches implemented modes. |
| Deck | Deck-board rows and stock board quantity | Deck Board uses the identical deck model. Explain direction, gaps, stock board joints and cut optimization limits; differentiate broader project page from boards-only page. |
| Paver | Straight modular paver layout, base and sand | Brick Paver adds brick-specific context; Base and Sand handle layers. Add border/curved area and effective modular dimensions guidance; retain clear layer units. |
| Asphalt | Compacted asphalt volume and weight | Asphalt Driveway and Parking Lot reuse bulk model. Add practical tonnage/density/compacted-thickness FAQs; differentiate geometry from cost pages. |
| Brick | Modular wall brick takeoff including joint and wythes | Brick Wall layout; Brick Quantity order quantity; Veneer single layer. Link brick waste, joint and weight when relevant; avoid making gross course counts look opening-adjusted. |
| Concrete Block | Modular block count, wall layout and shipment estimate | CMU presets and Block Wall overlap but add layout/product workflows. Explain nominal versus actual dimensions and face-shell/full-bed mortar; retain block weight source limitations. |
| Rebar | Grid takeoff, stock equivalent, weight and cost | Grid, Spacing, Length and Cost own narrower tasks. Keep entered design inputs clear; explain stock equivalent is not an optimized cut/splice schedule. |
| Excavation | Excavation geometry, bank and loose haul volume | Earthwork handles state conversion; Excavation Cost prices work. Explain sloped sides, average-depth approximation and project-specific swell; provide genuine process example. |
| Earthwork | Bank/loose/compacted state conversion | Cut and Fill balances quantities; Excavation derives cut geometry. Correct stale FAQ denying shrink/compaction despite current shrink input and compacted-equivalent model. |

## Evidence files and reproducibility

- `content-inventory.json`: baseline complete calculator record, explicit fields/formula/assumptions/sources, generated example inputs/results/steps, metadata, subgroup and link graph, with all duplicate formula/model groups.
- `content-overlays.json`: baseline authored guidance and actual composed FAQ arrays extracted from the Astro frontmatter maps (manual page FAQ arrays must be checked in their own source).
- `priority-intent-map.csv`: all 20 requested tools, dominant intent, close queries, cluster, existing title/description, formula and practical next work.
- Live corroboration: https://calculatorst.com/paint-calculator/ (retrieved 2026-10-01, crawler timestamp two days before), https://calculatorst.com/flooring-calculator/ (crawler timestamp today), https://calculatorst.com/earthwork-calculator/ (crawler timestamp yesterday). A cached retrieval is not proof of current response headers or deployed commit.

## Growth work after safe technical fixes

1. Obtain GSC Search Performance query/page exports and Page Indexing examples for each priority route. Rank observed causes by evidence: crawl response/directive errors first, Google-selected canonical issues second, discovered/crawled-not-indexed and intent/value issues third. No such states are inferred as verified without GSC.
2. Review all shared-model groups for a standalone reason to exist. Add material/product-specific guidance and worked projects only when helpful; narrow the scope of confusing satellite pages rather than adding bulk filler.
3. Complete reviewed practical FAQs for the five priority template-heavy pages, then audit the remaining 73 using the model scope and actual user errors. Add exact references for nontrivial physical assumptions; do not fabricate a reviewer or field experience.
4. Add contextual links at the decision point in guidance where adjacent tools materially help, while retaining breadcrumbs and cards. Keep important pages within 2–3 logical clicks and continue the 0-orphan check in generated HTML.
5. Monitor 28-day GSC clicks/impressions/query diversity and actual indexed canonicals, then decide whether further differentiation or evidence-supported consolidation is useful. No ranking, AdSense or traffic guarantee is appropriate.


## Implementation completed in this run

`src/pages/[slug]/index.astro` now uses the complete authored inventory description for the fallback, preserving the richer concrete/slab/foundation/rebar/masonry overrides. The former generated/truncated fallback and duplicate override map were removed. Related cards now receive complete descriptions; their CSS still clamps display text. Earthwork FAQ now accurately explains independent bank-to-loose and bank-to-compacted conversions.

Paint, Drywall, Deck, Fence and Asphalt each received three practical model-specific guidance points and three factual FAQs. These explicitly distinguish ceiling scope, sheets versus cut layouts, deck orientation and quantities versus structural sizing, gate/run/post handling and double-sided picket scope, and compacted asphalt thickness/density versus complete paving-project cost. No calculator arithmetic, form or engine was edited. The five changed content pages and corrected Earthwork page use the actual revision date 2026-10-01.

Two focused existing SEO test files pass (6/6 tests): `gsc-cannibalization-seo.test.ts` and `final-seo-architecture.test.ts`. Independently compiled and evaluated Astro frontmatter maps confirm three guidance items and three FAQs per new priority tool. Baseline JSON and counts are deliberately retained as before-change evidence; the current generic-only FAQ queue is reduced from 73 to 68, and no-guidance queue from 83 to 78. Final production-build/HTML/browser results are reported by the root audit.

The parallel architecture fix now includes four separately implemented calculators in the public catalog: Deck Material, Driveway Gravel, Pea Gravel and Roof Square Footage. The public union contains 208 tools, while this report's formula/content baseline intentionally covers the 204 hub models. The generic page's related lookup now uses the public union, allowing valid supplemental links without changing model routes. Gravel now lists 17 tools, Roofing 16 and Deck/Fence 16; the other main-category counts remain as above. The root build audit verifies the final counts and rendered routes.
