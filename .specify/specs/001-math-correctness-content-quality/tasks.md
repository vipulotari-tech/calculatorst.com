# Tasks: Independent Mathematical Verification

## Task 1: Create independent-verification.test.ts
- File: `src/lib/calculations/__tests__/independent-verification.test.ts`
- For each calculation function, add at least one test with a manually-computed expected value
- Show the manual calculation in comments
- Cover: rectVolume, columnVolume, tubeVolume, curbVolume, stairVolume, rampVolume, gravelVolume, gravelDepth, rebarCount, rebarGrid, rebarWeight, lapLength, brickQuantity, cmuQuantity, paverCount, mulch, roofArea, shingles, rafterLength, drywallSheets, paintGallons, studCount, boardFeet, joistCount, deckBoards, fencePosts, fencePickets, trenchVolume, stripFooting, padFooting, pierFooting, foundationWall, asphaltWeight, tileQuantity, carpet

## Task 2: Add metric/imperial equivalence tests
- For each function that accepts units, test that equivalent inputs in different units produce identical results
- Use `toBeCloseTo` with tolerance ≤ 0.01%

## Task 3: Add edge case tests
- Zero inputs → zero or appropriate result
- Very small waste (0.1%)
- Very large waste (100%)
- Minimum spacing
- Decimal inputs
- Unit switching mid-calculation

## Task 4: Document placeholder formulas
- Add `// PLACEHOLDER` tags to mortarVolumeForBrick, groutVolume, headerDepth
- Add explanatory comments showing what a real implementation would do

## Task 5: Create content specificity audit script
- File: `scripts/audit-content-specificity.mjs`
- Scan calculator models for assumptions/sources/references
- Flag identical text appearing across unrelated calculator families
- Run it and document findings

## Task 6: Run full test suite + build
- `npm test` → all pass
- `npm run build` → succeeds
- No new warnings
