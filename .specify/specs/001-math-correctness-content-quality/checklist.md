# Checklist: Spec 001 — Mathematical Verification & Content Quality

## Task 1: Independent Verification Tests ✅
- [x] Create `src/lib/calculations/__tests__/independent-verification.test.ts`
- [x] Known-answer tests for all 20+ calculation functions
- [x] Manual derivations documented in test comments
- [x] Authoritative sources cited (NIST SP 811, CRSI, ACI 318R, manufacturer specs)
- [x] All 51 tests pass

## Task 2: Metric/Imperial Equivalence ✅
- [x] Metric→imperial equivalence test included in independent-verification
- [x] Existing `allCalculators.test.ts` covers all 201 slugs with unit conversion
- [x] `regressions.test.ts` covers equivalent units for all registered models

## Task 3: Edge Case Tests ✅
- [x] Zero input tests included
- [x] Decimal input tests included
- [x] Waste edge cases (0.1%, 100%) included
- [x] Extreme values tests in `regressions.test.ts` (NaN, Infinity, -1e30, 1e30)
- [x] Unit switching equivalence in `regressions.test.ts`

## Task 4: Placeholder Documentation ✅
- [x] `mortarVolumeForBrick()` documented as PLACEHOLDER
- [x] `groutVolume()` documented as PLACEHOLDER
- [x] `headerDepth()` documented as PLACEHOLDER
- [x] All include: why it's a placeholder, what a real implementation needs

## Task 5: Content Specificity Audit Script ✅
- [x] Created `scripts/audit-content-specificity.mjs`
- [x] Scans all 200 calculatorDetails entries
- [x] Cross-family contamination detection: CLEAN
- [x] Concrete terms on non-concrete: NONE
- [x] Brand references on non-concrete: NONE
- [x] ACI 318 on non-rebar/non-concrete: NONE
- [x] Thin content: NONE

## Task 6: Tests + Build ✅
- [x] `npm test` → 13 project test files pass (1012+ tests)
- [x] `npm run build` → 233 pages in 6.85s
- [x] No new lint/typecheck errors

## Convergence Status: COMPLETE ✅
- All acceptance criteria from spec.md satisfied
- No P0 or P1 issues
- Formulas independently verified
- Tests pass
- Build succeeds
- Content specificity confirmed clean
