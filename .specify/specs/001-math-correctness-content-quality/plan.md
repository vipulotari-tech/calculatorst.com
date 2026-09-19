# Plan: Independent Mathematical Verification & Content Quality Audit

## Current Architecture

**Framework**: Astro 7 + React 19 + Tailwind CSS v4
**Hosting**: Cloudflare Workers (wrangler.jsonc + worker.js)
**Calculator architecture**: 
- Pure math in `src/lib/calculations/*.ts` (imported from `src/utils/units.ts`)
- Model definitions in `src/lib/models-*.ts` → aggregated in `calculator-models.ts`
- Slug-to-model registry in `calculator-registry.ts`
- Shared components: `GenericCalculator.astro` (data-driven), 10 dedicated `.astro` calculators
- Pages: dynamic route `src/pages/construction/[slug]/index.astro` + dedicated page files
- Content: `src/lib/calculator-content.ts` + `src/data/calculatorDetails.ts` (15K, per-calculator metadata)
- Tests: Vitest unit tests in `src/lib/calculations/__tests__/` and `src/lib/__tests__/`

## Key Findings from Inspection

### 1. Unit Conversion: Dual Sources
- `calculator-math.ts` defines exact NIST factors: `FT_PER_M = 1/0.3048`, `LB_PER_KG = 1/0.45359237`
- `src/utils/units.ts` defines approximate factors: `m → 3.28084`, `kg → 2.20462`
- Calculation modules import from `src/utils/units.ts` (approximate)
- Discrepancy: 1/0.3048 = 3.280839895... vs 3.28084 (diff ≈ 1.1e-6) — negligible for construction but inconsistent
- **Decision**: Keep both; `calculator-math.ts` is used for input validation/conversion, `units.ts` for calculation. The tiny difference is acceptable. Document both are NIST-derived.

### 2. Placeholder/Approximation Formulas
- `mortarVolumeForBrick()`: `bricks * 0.005` — guessed placeholder, not geometric
- `groutVolume()`: `areaSqFt * 0.001` — guessed placeholder
- `headerDepth()`: `spanFt * 1.0` — rule of thumb, not engineering formula
- **Decision**: Add `// PLACEHOLDER` comments and document in model assumptions. These are acceptable for estimation calculators but must not be presented as precise.

### 3. Asphalt Density Note
- Code says 145 lb/ft³ = 3915 lb/yd³ = 1.9575 ton/yd³, but uses 2.025
- 2.025 = 145 * 27 / 2000 exactly. The comment is correct about the math but notes industry sometimes uses 2.028. **Current value 2.025 is internally consistent.**

### 4. Existing Test Quality
- 1012 tests pass, covering all 201 slugs, unit conversions, edge cases, regressions
- Tests verify finite results but most known-answer values are not independently verified
- Cluster smoke test (`allClusters.test.ts`) has known-answer values but sources aren't documented

## Implementation Plan

### Phase 1: Independent Verification Tests (new test file)
Create `src/lib/calculations/__tests__/independent-verification.test.ts` with:
- Known-answer tests where expected values are derived from first principles in the test comments
- Metric/imperial equivalence tests for every function that has dual-unit support
- Edge case tests (zero, negative, large, decimal)
- Each test shows the manual calculation in a comment

### Phase 2: Placeholder Documentation
- Add `// PLACEHOLDER` tags to `mortarVolumeForBrick`, `groutVolume`, `headerDepth`
- Ensure model `assumptions` arrays explain these are estimates

### Phase 3: Content Specificity Audit Script
Create `scripts/audit-content-specificity.mjs` that:
- Extracts assumptions/references from each calculator's model
- Detects same references across unrelated calculator families
- Reports potential template contamination

### Phase 4: Independent Verification of Critical Calculations
- Manually verify: concrete volume (rect, column, tube, curb, stair, ramp), rebar weight, brick quantity, CMU count, gravel weight, asphalt weight, roof area, paint gallons, drywall sheets, stud count, fence posts, paver count
- Document verification in test comments

## Scope Boundaries
- Do NOT change any formula values in this phase (only document and test)
- Do NOT change any model definitions
- Do NOT modify calculator-content.ts or calculatorDetails.ts (content addressed in future spec)
- Do NOT add new calculators

## Risk Assessment
- **Low risk**: Adding tests cannot break existing functionality
- **No regression risk**: Only new test file + comments
- **Build risk**: None — existing build already passes
