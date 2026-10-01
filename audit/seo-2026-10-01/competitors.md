# Construction calculator competitive research — 2026-10-01

## Scope and evidence limits

Applied the installed Claude SEO `seo-competitor-pages`, `seo-content-brief`, and `seo-geo` frameworks: verify claims against public primary pages; distinguish search intent; retain existing useful content; specify differentiated information gain; make formulas and assumptions understandable in crawlable HTML. The user’s prohibition on fabricated ratings, testimonials, credentials, and unnecessary word-count inflation overrides generic skill examples. No keyword volume, ranking position, traffic, backlink strength, or competitor math/interaction score is claimed.

Current primary pages opened successfully through web retrieval:

- [InchCalculator Concrete Calculator](https://www.inchcalculator.com/concrete-calculator/) — retrieval reference `turn5view0`.
- [CalculatorSoup Concrete Calculator](https://www.calculatorsoup.com/calculators/construction/concrete-calculator.php) — retrieval reference `turn5view1`.
- [Calculator.net Concrete Calculator](https://www.calculator.net/concrete-calculator.html) — retrieval reference `turn5view3`.

[Omni Concrete Calculator](https://www.omnicalculator.com/construction/concrete) returned an internal retrieval error (`turn5view2`). A later independent batch requesting paint/gravel/roof-pitch/InchCalculator pages and ConcreteSwift plus connector checks stalled and was aborted; no result from that batch is asserted. Search-engine snippets were used for discovery only, not proof of implemented features. Competitor calculator interactions, mobile layouts, dynamic results, JSON-LD, network performance, and Google rankings were not independently tested in this subtask. The main audit handles CalculatorSt’s live crawl, rendering, source, and mobile evidence.

## Verified representative comparison

| Primary source | Observed content and architecture | Practical benchmark for CalculatorSt |
|---|---|---|
| InchCalculator concrete | Explains premixed bag yields with a lookup table and advises checking the selected product. Distinguishes material price from project installation cost. Includes ready-mix preparation, FAQs, references, and links to gravel, reinforcement, concrete weight and other masonry tools. | Connect quantity estimation to the next real project decision. Explain product-specific yield and distinguish ready-mix material cost, delivery/short-load charges and overall installation cost. Add relevant cross-project links with descriptive anchors. |
| CalculatorSoup concrete | Crawlable explanation covers slabs, walls, footers, columns, tubes, steps and curbs. Shape-specific diagrams and formulas accompany unit conversion explanations. A worked example fills 50 round tubes with mixed feet/inch measurements. Describes allowance separately from geometric volume. Construction breadcrumb is visible. | Provide an independently reproducible worked example per distinct shape or intent. Explain geometry and conversions in static HTML; diagrams should label the same inputs the form accepts. Show net volume separately from order allowance. |
| Calculator.net concrete | Concrete calculator page successfully opened, establishing an accessible relevant benchmark. Retrieved content was substantially shorter than the other two pages; no deeper unobserved feature or trust claims are made. | Preserve the direct calculator-first task experience while supplying enough nearby explanation to resolve assumptions and ordering questions. This is a recommendation, not a claim of demonstrated superior UX. |

This supports a concrete content/architecture benchmark, not a finding that any competitor is categorically best or ranks first.

## Differentiated improvements with acceptance checks

1. **Separate concrete volume, waste and supplier rounding.** Retain CalculatorSt’s useful calculations and explain net geometric volume → requested allowance → supplier increment → actual final overage. An original example should demonstrate a small order where rounding contributes more overage than the requested percentage. Acceptance: every step reproduces the displayed output from the same inputs; no instruction implies all suppliers share one increment.
2. **Make product yield explicit.** Explain that bags are rounded upward from product yield, not inferred solely from bag weight. Link to the actual product datasheet when a yield is asserted. Acceptance: source and assumed yield are visible, and changing yield affects bag count consistently.
3. **Differentiate overlapping concrete pages.** Broad Concrete Calculator: shape selection and quantity planning. Concrete Volume: geometry and unit conversion. Concrete Cost: cost components and rates. Concrete Waste: ordering allowance, rounding and effective overage. Concrete Slab: slab-specific quantity inputs and project assumptions. Concrete Pour: delivery/logistics if the existing tool genuinely supports them. Acceptance: each title, introduction, example and related links describe its actual functionality; do not invent unsupported functionality or delete useful pages.
4. **Connect project workflows.** Concrete pages can naturally link to gravel/base, rebar and cost tools; gravel pages can link to excavation and paver-base tools; roofing quantity pages can link to pitch and relevant shingle tools. Acceptance: ordinary HTML anchors target canonical200 routes, and each related link answers a next-step question.
5. **Use measured worked examples as trust evidence.** Publish input → formula → conversion → rounding → result, with honest author/editor information and exact sources. Acceptance: users can recompute the example; author credentials and reviewer status are factual; update dates correspond to substantive edits.
6. **Keep explanatory content available before interaction.** Main purpose, input definitions, assumptions, formula, example and next-step links should exist in source HTML. Acceptance: disabling JavaScript leaves the purpose and method understandable, while the interactive calculation remains available when JavaScript runs.

## Search-intent briefs for subsequent focused verification

These briefs describe appropriate CalculatorSt intent; they do not claim a completed competitor audit for those topics.

| Existing tool | Dominant user intent | Distinct useful content | Relevant adjacent intent |
|---|---|---|---|
| Concrete | Estimate required concrete from project geometry | Geometry, units, net volume, bags, order allowance and actual supported costs | Volume, slab, footing, cost, waste |
| Paint | Estimate purchase quantities for surfaces and coats | Net paintable area, openings, ceiling selection, product coverage, coats, container rounding and primer assumptions where supported | Paint coverage and drywall |
| Gravel | Estimate aggregate volume, weight and purchase quantity | Loose versus compacted assumptions, density source, volume-to-mass conversion, allowance and price basis where supported | Excavation, paver base, driveway |
| Roof pitch | Convert rise/run, angle and pitch | Define horizontal run versus roof length; show conversion and slope multiplier; distinguish measured geometry from structural design | Roofing area and shingle quantities |

Prioritize verifiable information gain over extra generic text. Avoid pretending manufacturer-specific paint coverage, aggregate density, or supplier charges are universal defaults.

## AI/search discoverability conclusions

The installed GEO framework emphasizes ordinary SEO fundamentals: accessible source content, clear entity identity, cited assumptions and useful self-contained explanations. Search crawler accessibility and AI-training policy are separate questions. Do not remove intentional training-bot restrictions or add speculative files/schema solely to promise AI citations. This research did not establish any AI citation or visibility outcome.

## Data availability

Available tool registry includes Ahrefs management, keyword, SERP, Site Audit, Site Explorer and GSC endpoints; Ahrefs requires reading its `doc` schema before endpoint use. A read-only GSC planning connector exposes authorized organizations, properties and finalized performance data. Tool availability does not demonstrate an authorized CalculatorSt property or sufficient subscription. The attempted optional status batch did not return results; defer concrete credential/subscription status to the main audit’s separately verified evidence. No Google account, subscription, indexing submission or authentication changes were made by this subtask.
