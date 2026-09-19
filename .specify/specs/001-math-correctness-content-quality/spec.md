# Spec: Independent Mathematical Verification & Content Quality Audit

## Problem
The current test suite (1012 tests) verifies that calculators execute without errors and produce finite results. However, tests validate outputs against values potentially derived from the same production code paths. There is no systematic independent mathematical verification of calculator formulas, no content-specificity audit, and no template contamination detection. A subtle formula error could pass all existing tests while producing incorrect real-world results.

## Goals
1. Every calculator formula is independently verified against known-answer values derived from first principles or authoritative sources (not from the code being tested).
2. Content specificity is audited — each calculator page contains information relevant to its specific calculation type.
3. Template contamination is detected and root-cause fixed.
4. Unit conversion equivalences are independently verified (metric/imperial parity).
5. Edge cases are systematically tested (zero, negative, very large, decimal, repeated unit switching).

## Non-Goals
- Adding new calculators beyond the 201 already registered.
- Changing calculator UI/UX (addressed in future specs).
- SEO keyword optimization (addressed in future specs).
- Performance optimization beyond correctness (addressed in future specs).

## Affected Calculators/Pages
All 201 registered calculators under `src/lib/calculator-registry.ts`, spanning:
- Concrete (16), Slab & Patio (10), Foundation (10), Rebar (10), Brick & Masonry (15), CMU (10), Mortar & Cement (10), Gravel & Aggregate (15), Excavation (10), Framing & Lumber (15), Roofing (15), Flooring & Tile (15), Drywall & Paint (15), Deck & Fence (15), Paver & Landscaping (10), Asphalt & Surface (10), Dams & Coastal (4)

## User Intent
Users input project dimensions and material parameters; expect accurate quantities (volume, weight, count, cost). Incorrect results lead to material over/under-ordering and wasted money.

## Mathematical Requirements
- All length/area/volume conversions must be independently verified against NIST SP 811 (international foot = 0.3048m, avoirdupois pound = 0.45359237kg).
- Volume formulas must match standard geometry (rectangular prism, cylinder, hollow cylinder, triangular prism, step summation).
- Weight calculations must use correct density values with authoritative sources cited.
- Count calculations (studs, rebar, bricks, pavers) must use ceiling-on-count at the appropriate boundary.
- Waste factors applied exactly once, after measurement, before discrete rounding.
- Cost = quantity × price, never the reverse.

## Formulas
Formulas are defined in `src/lib/calculations/*.ts`. Each must be independently cross-referenced against:
- NIST SP 811 for unit conversions
- CRSI for rebar weights/lap lengths
- Industry-standard brick/CMU dimensions and mortar joints
- Standard bag yields (80lb bag = 0.60 ft³, 60lb = 0.45 ft³, 40lb = 0.30 ft³)
- Standard material densities (gravel, asphalt, concrete, etc.)
- Standard paint/drywall coverage rates

## Units
- Primary: US customary (ft, in, yd, lb, ton)
- Secondary: Metric (m, cm, mm, kg, tonne)
- Conversion factors defined in `src/lib/calculator-math.ts` — must be independently verified.

## Required Inputs
Per model field definitions in `src/lib/models-*.ts`.

## Required Outputs
Per model `calculate()` return type: `Calculation { rows: ResultRow[], steps: string[], notes: string[] }`

## Validation Requirements
- Zero handled correctly (zero length = zero volume, zero area = zero count).
- Negative values rejected at input boundary.
- Decimal inputs handled without precision loss.
- Extremely large values handled gracefully.
- NaN/Infinity impossible from valid inputs; invalid inputs throw `InputError`.
- Unit switching preserves numerical equivalence (within floating-point tolerance).

## Edge Cases
- Zero dimensions
- Zero waste
- Very small waste (0.1%)
- Very large waste (100%)
- Minimum spacing (e.g., rebar at 1" spacing)
- Maximum practical values
- Decimal spacing
- Mixed unit systems (e.g., feet + inches + metric)
- Empty optional fields

## UX Requirements
(None — UX addressed in separate spec.)

## Mobile Requirements
(None — mobile addressed in separate spec.)

## Accessibility Requirements
(None — accessibility addressed in separate spec.)

## SEO Requirements
(None — SEO addressed in separate spec.)

## Content Requirements
- Each calculator page must contain: formula explanation, assumptions, material-specific guidance, at least one worked example, relevant references.
- No template contamination (wrong-domain references, copied text across unrelated calculators).
- Each calculator's assumptions list must be specific to that calculation type.

## Competitor Research Requirements
- Compare key calculators against inchcalculator.com, calculatorsoup.com, calculator.net, omnicalculator.com for: input set, output set, formula approach, unit support, waste handling, cost features.
- Document gaps where CalculatorST has materially different or missing capabilities.

## Internal-Linking Requirements
- Each calculator page must link to at least 2-3 genuinely related calculators (not the same set on every page).
- Category hub pages must list all calculators in that category with working links.

## Structured Data Requirements
- WebApplication schema where appropriate.
- No fabricated AggregateRating, Review, author credentials, or awards.

## Performance Requirements
(None — performance addressed in separate spec.)

## Testing Requirements
- Independent known-answer tests for each calculation function.
- Metric/imperial equivalence tests.
- Edge case tests.
- Regression tests for shared utilities.
- Content-specificity audit (automated script for template contamination detection).

## Regression Constraints
- No change to `calculator-math.ts` unit conversion factors without independent verification.
- No change to model `calculate()` functions without corresponding test updates.
- Shared library changes must pass all dependent calculator tests.

## Measurable Acceptance Criteria
1. ✅ Every calculation function has at least one independent known-answer test (value NOT from production code).
2. ✅ Metric/imperial conversions produce equivalent results within tolerance (≤0.1%).
3. ✅ All 201 calculators execute without error with default inputs.
4. ✅ Content contamination script exists and runs cleanly (or produces fixable findings).
5. ✅ No domain-mismatched references (e.g., concrete org on paint page).
6. ✅ All formula comments include authoritative source citations.
7. ✅ Edge case tests exist for: zero input, negative rejection, large values, unit switching.
8. ✅ Build succeeds, all 1012+ tests pass.
