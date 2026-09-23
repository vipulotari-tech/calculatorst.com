# Implementation Plan: Competitor Gap Closure & Calculator Superiority

## Phase 1: Bug Fixes (Day 1 — immediate fixes before enhancements)

### 1.1 Fix FenceCostCalculator panel count formula
**File:** `src/components/calculators/FenceCostCalculator.astro`
**Issue:** `panels = runs * Math.ceil(effectiveLen / runs / safeSpacing)` overcounts posts at gate boundaries because each run counts its own end posts, but gate runs share boundary posts.
**Fix:** Calculate panels per run independently: `panels = runs * (Math.ceil(effectiveLen / runs / spacing) - 1)`, then `posts = panels + 1` (single end-to-end count).

### 1.2 Remove inappropriate QUIKRETE brand reference
**File:** `src/components/calculators/GravelCalculator.astro`
**Issue:** Line 65 reads "Quikrete/FHWA range 1.28–1.60" — QUIKRETE doesn't publish gravel density specs.
**Fix:** Change to "FHWA range 1.28–1.60 tons/yd³" or reference engineering standards only.

### 1.3 Clean dead code in framing.ts
**File:** `src/lib/calculations/framing.ts`
**Issue:** `bfPer` is computed but never returned; `bfAlt` is returned as `bfPer`.
**Fix:** Remove the dead `bfPer` computation, return `bfAlt` as `total`.

---

## Phase 2: Concrete Calculator Mode Expansion (Day 1-2 — highest competitor gap)

### 2.1 Add mode selector to ConcreteSlabCalculator
**Current:** Single slab (rectangle) mode.
**Target:** 7 modes: Slab (Rectangle), Slab (Circle), Wall, Footing, Column, Tube, Curb & Gutter.

### 2.2 Add SVG diagrams
**Tool:** `svg-diagram` skill (already installed)
**Diagrams:** One per mode showing labeled dimensions:
- Slab: L × W × T
- Circle: diameter × T
- Wall: L × H × T
- Footing: L × W × D
- Column: diameter × H
- Tube: OD × ID × H
- Curb & Gutter: curb H × D, gutter W, flag T, L

### 2.3 Add 50-lb bag support
**Current:** 40, 60, 80-lb bags only.
**Add:** 50-lb bag (0.33 ft³ yield per manufacturer data).

### 2.4 Update results to show weight
**Add:** Total weight estimate (4,050 lbs/yd³ standard).

---

## Phase 3: Gravel Calculator Enrichment (Day 2)

### 3.1 Add compaction parameter
**Current:** Only waste %.
**Add:** Separate compaction % field (suggested range 5-30%), applied additively to volume before waste.

### 3.2 Add more material types
**Current:** 4 materials (Pea Gravel, Crushed Stone, River Rock, Limestone).
**Target:** Add Granite, Sand, Topsoil, Riprap, Decomposed Granite.

### 3.3 Add coverage reference table
**Add:** ft² covered per cubic yard at common depths (1", 2", 3", 4").

---

## Phase 4: Paint Calculator Creation (Day 2-3)

### 4.1 Create PaintCalculator.astro
**Modes:** Room dimensions (L×W×H), Single wall (L×H), Known area.
**Features:**
- Door/window deduction (standard sizes + custom)
- Multi-coat support (1-5 coats)
- Coverage rate input with defaults by surface type
- Gallon/quart/liter purchase breakdown
- Cost estimate
- Formula display

### 4.2 Add SVG diagram
**Room rectangle diagram** with labeled walls, doors, windows.

---

## Phase 5: Fence Calculator Fix + Content (Day 3)

### 5.1 Fix panel count (covered in Phase 1)
### 5.2 Add SVG diagram
**Fence layout diagram** showing posts, panels, gates, and spacing.

---

## Phase 6: Content Enrichment Across All 8 (Day 3-4)

### 6.1 Add formula sections
Add visible formula display to each calculator showing the calculation steps.

### 6.2 Add worked examples
- Concrete: 10'×10'×4" slab example
- Gravel: 20'×10'×3" patio example
- Fence: 100' wood fence, 1 gate example
- Paint: 12'×10' room, 2 doors, 1 window example

### 6.3 Add practical measurement guidance
Brief tips on measuring accurately (e.g., "measure at the widest point", "account for slopes").

---

## Phase 7: Testing & Auditing (Day 4-5)

### 7.1 Playwright smoke tests
Create test suite covering all 8 calculators: input → calculate → verify output → reset → mobile viewport.

### 7.2 BeyondSEO audit
Run BeyondSEO on the 8 priority calculator pages. Fix any gaps found.

### 7.3 AdSense audit
Run AdSense auditor. Fix any calculator-specific issues.

### 7.4 Validation log
Create `specs/005-competitor-gap-closure/validation-log.md` documenting all changes, test results, and audit findings.

---

## File Changes Summary

| File | Change |
|------|--------|
| `src/components/calculators/FenceCostCalculator.astro` | Bug fix (panel count) + SVG diagram |
| `src/components/calculators/GravelCalculator.astro` | Remove QUIKRETE + add compaction + more materials + coverage table + SVG |
| `src/components/calculators/ConcreteSlabCalculator.astro` | Mode selector (7 modes) + 50lb bags + weight + SVG diagrams (7) |
| `src/components/calculators/PaintCalculator.astro` | **NEW** component |
| `src/components/calculators/MulchCalculator.astro` | SVG diagram |
| `src/components/calculators/DrivewayGravelCalculator.astro` | SVG diagram |
| `src/components/calculators/PeaGravelCalculator.astro` | SVG diagram |
| `src/components/calculators/RoofPitchCalculator.astro` | SVG diagram |
| `src/lib/calculations/framing.ts` | Dead code cleanup |
| `src/components/shared/FormulaSection.astro` | **NEW** component |
| `src/components/shared/ExampleSection.astro` | **NEW** component |
| `src/components/shared/DiagramSection.astro` | **NEW** component |
| `tests/e2e/calculators.spec.ts` | **NEW** Playwright tests |

## Validation Criteria

- [ ] All 1063 existing tests still pass
- [ ] No console errors in any calculator
- [ ] All 8 calculators pass Playwright smoke tests (desktop + mobile)
- [ ] Concrete Calculator has 7 modes with correct volume formulas
- [ ] Gravel Calculator has separate compaction and waste parameters
- [ ] Paint Calculator has door/window deduction and multi-coat support
- [ ] Fence Calculator panel count matches manual calculation
- [ ] No inappropriate brand references
- [ ] All SVG diagrams render correctly at mobile width
- [ ] BeyondSEO reports no major gaps for priority pages
- [ ] AdSense auditor reports no issues
