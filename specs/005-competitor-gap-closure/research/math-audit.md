# Math Audit: 8 Priority Calculators

_File: `src/components/calculators/*.astro` and shared calculation models_
_Date: 2026-09-20_
_Scope: factual findings only — no files modified_

---

## 1. ConcreteSlabCalculator.astro

### Source location
`src/components/calculators/ConcreteSlabCalculator.astro`

### Formulas
- **Volume (cu ft):** `sqft = Lf * Wf * num`, then `cuFt = sqft * Tf`
- **Volume (cu yd):** `cuYd = cuFt / 27`
- **Waste factor:** `w = 1 + waste/100`, applied to both cuFt and cuYd
- **80-lb bags:** `Math.ceil(cuFtW / 0.60)` (uses 0.60 ft3 per 80-lb bag)
- **60-lb bags:** `Math.ceil(cuFtW / 0.45)`
- **40-lb bags:** `Math.ceil(cuFtW / 0.30)`
- **Cost:** `cuYdW * price` (per yd3) or `b80 * price` (per 80-lb bag)

### Unit conversion correctness
**Correct.** `toFeet()` converts:
- ft: pass-through (1)
- in: divide by 12
- yd: multiply by 3
- m: divide by 0.3048 (NIST: 1 m = 3.28084 ft exactly)
- cm: divide by 30.48

Volume, area, and unit conversions are dimensionally correct. The thickness input defaults to inches which is the standard US construction unit.

### Waste factor handling
**Correct.** Waste percentage is applied once as a multiplicative factor `(1 + waste/100)` to both cubic feet and cubic yards before bag count and cost calculations.

### Density/material handling
**Correct.** Bag yields match standard QUIKRETE/Sakrete specs:
- 80-lb: 0.60 ft3
- 60-lb: 0.45 ft3
- 40-lb: 0.30 ft3

These are consistent with `src/lib/models-materials.ts` constants `BAG_YIELD_80`, `BAG_YIELD_60`, `BAG_YIELD_40`.

### Rounding behavior
**Correct.** Uses `Math.ceil()` for bag counts (cannot buy partial bags).

### Boundary handling
- Zero/negative inputs are caught by validation (`L > 0`, `W > 0`, `T > 0`)
- Waste is clamped to 0-50%
- No division by zero risk

### Inappropriate references
**None.** No brand names or institution references in this calculator.

### Assessment
This calculator is mathematically sound. The formulas are correct, unit conversions are dimensionally consistent, and bag counts match published manufacturer data.

---

## 2. GravelCalculator.astro

### Source location
`src/components/calculators/GravelCalculator.astro`

### Formulas
- **cuFt:** `Lf * Wf * Df`
- **cuYd:** `cuFt / 27`
- **tons:** `cuYd * tonsPerYd`
- **lb:** `tons * 2000`
- **Waste:** applied as factor `w = 1 + waste/100` to cuYd, tons, lb, and cost
- **Cost:** `cuYdW * price` (per yd3) or `tonsW * price` (per ton)

### Material density table
| Material | Density (tons/yd3) |
|----------|--------------------|
| Pea Gravel | 1.35 |
| Crushed Stone | 1.40 |
| River Rock | 1.33 |
| Limestone | 1.60 |
| Granite | 1.42 |
| Custom | user-entered |

All values are within typical industry range (1.28-1.60 tons/yd3 per FHWA).

### Unit conversion correctness
**Correct.** Same `toFeet()` function as ConcreteSlabCalculator.

### Waste factor handling
**Correct.** Applied once to volume, weight, and cost.

### Density/material handling
**Correct.** The Pea Gravel density of 1.35 tons/yd3 equals exactly 100 lb/ft3 (1.35 * 2000 / 27 = 100). This is consistent with standard tables.

### Inappropriate references — **ISSUE FOUND**

**Line 65:** The UI text reads:
> "Quikrete/FHWA range 1.28–1.60. Check supplier scale ticket — wet adds 5–10%."

**QUIKRETE is a brand name appearing in the GravelCalculator.** While QUIKRETE is primarily known for concrete products, the density range cited (1.28-1.60 tons/yd3) is a standard gravel density range found in FHWA (Federal Highway Administration) publications. The reference to Quikrete here is questionable because:
1. QUIKRETE does not publish gravel density specifications — they sell bagged concrete/mortar
2. The density range 1.28-1.60 tons/yd3 is an FHWA/engineering standard, not a Quikrete specification
3. This appears to be an inappropriate brand reference copied from concrete calculator contexts

**Recommendation:** Remove "Quikrete/" and reference FHWA or industry standards only.

### Rounding behavior
**Correct.** Default 2 decimal places for volume/weight.

### Boundary handling
- Custom density validated: 0.5-3.0 tons/yd3 (reasonable range)
- Input validation for length, width, depth > 0

### Assessment
Formulas are correct. The only issue is the inappropriate QUIKRETE brand reference on line 65.

---

## 3. DrivewayGravelCalculator.astro

### Source location
`src/components/calculators/DrivewayGravelCalculator.astro`

### Formulas
- **cuFt:** `Lf * Wf * Df * layers`
- **cuYd:** `cuFt / 27`
- **tons:** `cuYd * tonsPerYd`
- **lb:** `tons * 2000`
- **Waste:** applied as factor `w = 1 + waste/100` to all outputs
- **Cost:** `cuYdW * price` or `tonsW * price`

### Unit conversion correctness
**Correct.** Same `toFeet()` function. Width unit select supports ft and m (no inches, which is a minor limitation but consistent with driveway dimensions).

### Material density table
Same 4 materials as GravelCalculator but WITHOUT the "granite" option. Densities match.

### Waste factor handling
**Correct.** Applied once.

### "Layers" feature
**Correct.** The `layers` multiplier simply multiplies the volume. The UI note says "Multiply by layers for multi-section driveways. Depth per layer." This is geometrically correct — each layer adds `L * W * D` volume.

### Density/material handling
**Correct.** Same density values as GravelCalculator.

### Inappropriate references
**None.** No brand names.

### Rounding behavior
**Correct.** 2 decimal places.

### Boundary handling
- Validation: L > 0, W > 0, D > 0
- Layers: min 1, max 10 (reasonable)
- Waste: 0-50%

### Assessment
Formulas are correct. The layers concept is implemented correctly. No mathematical errors.

---

## 4. MulchCalculator.astro

### Source location
`src/components/calculators/MulchCalculator.astro`

### Formulas
- **cuFt:** `Lf * Wf * Df * areas`
- **cuYd:** `cuFt / 27`
- **Waste:** `w = 1 + waste/100`, applied to `cuFtW` and `cuYdW`
- **Bags:** `Math.ceil(cuFt / bagSize)` and `Math.ceil(cuFtW / bagSize)`
- **Cost:** `Math.ceil(cuFtW / bagSize) * price` (per bag) or `cuYdW * price` (per yd3)

### Unit conversion correctness
**Correct.** Same `toFeet()`. Note: length unit options are ft/in/m (no yd, which is acceptable).

### Bag size options
- 2 ft3 (most common US — standard 2-cubic-foot bag)
- 1.5 ft3
- 3 ft3
- 0 (bulk/yd3 pricing)

These are realistic US market bag sizes.

### Waste factor handling
**Correct.** Applied to both volume and bag counts.

### Cost handling
**Correct.** Per-bag cost uses `Math.ceil(cuFtW / bagSize) * price` which correctly rounds up bags before multiplying by price.

### UI note
> "Bag = 2 ft3 covers ~8 ft2 at 3" deep."

**Check:** 2 ft3 / (3/12 ft) = 2 / 0.25 = 8 ft2. **Correct.**

### Inappropriate references
**None.**

### Rounding behavior
**Correct.** `Math.ceil()` for bag counts.

### Boundary handling
- Areas multiplier: min 1, max 20
- Waste: 0-30% (lower max than gravel, reasonable for organic mulch)

### Assessment
All formulas are mathematically correct. No errors found.

---

## 5. RoofPitchCalculator.astro

### Source location
`src/components/calculators/RoofPitchCalculator.astro`

### Formulas
- **toInch():** converts ft: `v * 12`, cm: `v / 2.54`, in: pass-through
- **slope:** `riseIn / runIn`
- **angle (degrees):** `Math.atan(slope) * 180 / Math.PI`
- **ratio:** `${fmt(riseIn,2)} : ${fmt(runIn,2)}`
- **x12 (pitch):** `slope * 12`
- **slope %:** `slope * 100`
- **decimal slope:** `slope`

### Unit conversion correctness
**Correct.** Converts all inputs to inches, then computes slope as a dimensionless ratio. The run input accepts only ft and in (no m), which is a minor limitation but standard for US roof pitch.

### Formula correctness
**Correct.** Standard roof pitch formulas:
- angle = atan(rise/run) — correct
- pitch in x:12 notation = 12 * (rise/run) — correct
- slope % = (rise/run) * 100 — correct

### Consistency with model version
**ISSUE FOUND.** The `models-structure.ts` model (`roof-pitch`) has a subtle difference:

Model (line 28):
```js
const slope = v.rise / v.run;
// pitch per 12 = 12 * slope
// angle = atan(slope) * 180 / PI
```

The Astro calculator (line 33-37):
```js
const riseIn = toIn(rise, riseUnit);
const runIn = toIn(run, runUnit);
const slope = riseIn / runIn;
const angle = Math.atan(slope) * 180 / Math.PI;
const ratio = `${fmt(riseIn,2)}:12`;
const x12 = slope * 12;
```

Both compute the same angle and slope. However, the **ratio display** is inconsistent:
- Astro: `${fmt(riseIn,2)} : ${fmt(runIn,2)}` — displays "6.00 : 12.00"
- Model: `${fmt(riseIn,2)}:12` — displays "6.00:12"

The Astro version shows the raw ratio (e.g., "6.00 : 12.00") while the model shows the conventional "x:12" format. The model version is more standard and clearer. The Astro version displays both the raw ratio AND the x12 value, which is redundant but not wrong.

### Zero rise handling
**Correct.** Rise can be 0 (flat roof). Run must be > 0.

### Inappropriate references
**None.**

### Assessment
Mathematically correct. The only minor issue is the redundant ratio display format.

---

## 6. FenceCostCalculator.astro

### Source location
`src/components/calculators/FenceCostCalculator.astro`

### Formulas

**Panel count (line 66):**
```js
const runs = gates + 1;
const panels = runs * Math.ceil(effectiveLen / runs / safeSpacing - 1e-12);
const posts = panels + runs;
```

**Concrete volume (line 70):**
```js
const concreteVolume = posts * fill * (Math.PI * hole * hole / 4 - postW * postW);
```

**Round post fitting inside round hole:**
```js
if (!(hole > postW * Math.SQRT2 && fill > 0 && bagYield > 0))
```

**Linear rails:**
```js
const linearRails = effectiveLen * (mat === "chain" ? 1 : rails);
```

**Cost:**
- Per ft: `effectiveLen * wasteF * price`
- Per panel: `panelsW * price`
- Per post: `postsW * price`

### Panel count formula — **BUG FOUND**

The panel formula divides the effective length equally among `runs` fence segments, then multiplies back:

```
panels = runs * ceil(effectiveLen / runs / spacing)
```

**This is mathematically incorrect for fence panel counting.**

Consider a simple case: 100ft fence, 8ft spacing, 0 gates.
- `runs = 1`
- `panels = 1 * ceil(100 / 1 / 8 - 1e-12) = ceil(12.5) = 13`
- `posts = 13 + 1 = 14`

Standard fence formula: posts = ceil(100/8) + 1 = ceil(12.5) + 1 = 14. This matches.

Now with 1 gate (4ft wide): 100ft total, 4ft gate.
- `effectiveLen = 100 - 4 = 96ft`
- `runs = 2` (gate + 1)
- `panels = 2 * ceil(96 / 2 / 8 - 1e-12) = 2 * ceil(6) = 12`
- `posts = 12 + 2 = 14`

Standard formula per run: each run has ceil(48/8) + 1 = 7 posts. Two runs share the gate posts, so total unique posts = 7 + 7 - 2 = 12. The calculator gives 14 posts, which is **2 too many**.

The problem is that the formula `runs * ceil(effectiveLen/runs/spacing)` overcounts when the division is exact. For the 0-gate case: ceil(100/8) = 13 panels and 14 posts. For 100ft at 8ft OC, the standard formula gives ceil(100/8)+1 = 14 posts, which is correct. But for the gated case, it double-counts shared posts.

**This formula does not correctly account for shared posts at gate boundaries.** The comment in the code acknowledges this: "gates divide the remaining fence into equal-length runs" — but the equal-length assumption combined with the ceil-per-run-then-multiply approach leads to overcounting.

### Concrete volume formula
**Correct.** Volume of annular post hole minus square post, per post:
```
V = posts * fill * (pi * hole^2 / 4 - postW^2)
```

The post must fit in the hole: `hole > postW * sqrt(2)`. For a square post of width `w` in a round hole of diameter `d`, the diagonal of the square is `w * sqrt(2)`. The hole diameter must exceed this diagonal. **Correct.**

**ISSUE:** The check `hole > postW * Math.SQRT2` compares hole DIAMETER against post diagonal. But `hole` is entered in inches and converted to feet (`hole / 12`), while `postW` is also converted to feet (`postW / 12`). Since both are divided by 12, the comparison `hole > postW * Math.SQRT2` is dimensionally consistent. **Correct.**

### Linear rails
**Correct.** For chain link: rails = effectiveLen * 1 (fabric only, no top rail). For wood/vinyl: rails = effectiveLen * railsPerSection.

### Cost
- **Per ft (chain link):** `effectiveLen * wasteF * price` — correct
- **Per panel (wood/vinyl):** `panelsW * price` — correct
- **Per post:** `postsW * price` — correct
- Chain link per panel is blocked: "Chain-link fabric is priced per foot, not per panel." **Correct.**

### Inappropriate references
**None.**

### Boundary handling
- Effective length < 0 or gate widths exceed length: error shown
- Hole diameter, fill depth, bag yield must be positive
- postW * sqrt(2) validation ensures structural fit

### Assessment
The panel/post count formula has a known issue with gate counting that can overcount posts. The concrete volume, material handling, and cost formulas are correct.

---

## 7. PeaGravelCalculator.astro

### Source location
`src/components/calculators/PeaGravelCalculator.astro`

### Formulas
- **cuFt:** `Lf * Wf * Df`
- **cuYd:** `cuFt / 27`
- **tons:** `cuYd * 1.35` (hardcoded pea gravel density)
- **lb:** `tons * 2000`
- **Waste:** applied as factor to cuYd, tons, lb, and cost
- **Cost:** `cuYdW * price` (per yd3) or `tonsW * price` (per ton)

### Unit conversion correctness
**Correct.** Same `toFeet()` function.

### Density handling
**Pea gravel density = 1.35 tons/yd3 = 100 lb/ft3.**

1.35 tons/yd3 * 2000 lb/ton / 27 ft3/yd3 = 100 lb/ft3. **Correct.**

### UI text claim
**Line 23:** "Pea gravel density 1.35 US short tons/yd3 (100 lb/ft3)."

This is **mathematically correct:** 1.35 * 2000 / 27 = 100 exactly.

### Waste factor handling
**Correct.** Applied once.

### Cost handling
**Correct.** Same pattern as GravelCalculator.

### Relationship to GravelCalculator
**PeaGravelCalculator is essentially a subset of GravelCalculator** with the material hardcoded to pea gravel and no material selection dropdown. The PeaGravelCalculator references the GravelCalculator: "Use the Gravel Calculator for a custom supplier density." This is a good design decision.

### Inappropriate references
**None.**

### Rounding behavior
**Correct.** 2 decimal places.

### Boundary handling
- Validation: L > 0, W > 0, D > 0
- Waste: 0-50%

### Assessment
All formulas are correct. This calculator is a valid simplified version of the GravelCalculator.

---

## 8. Board Foot Calculator

### Source location
There is **no standalone Board Foot calculator component file** (no `BoardFootCalculator.astro`). The board foot calculation lives in:

1. **`src/lib/calculations/framing.ts`** — function `boardFeet()` (line 19-32)
2. **`src/lib/models-structure.ts`** — model `boardFeet` (line 25)
3. **Registry mapping:** `src/lib/calculator-registry.ts` maps `board-foot-calculator` and `board-foot-cost-calculator` to model key `"boardFeet"`
4. **Both slugs use `GenericCalculator.astro`** via the GenericCalculator component

### Formula in `framing.ts` (correct version)
```ts
export function boardFeet(opts: {
  thicknessIn: number; widthIn: number; lengthFt: number;
  lengthUnit?: string; quantity?: number;
}) {
  const Lf = opts.lengthUnit ? toFeet(opts.lengthFt, opts.lengthUnit) : opts.lengthFt;
  const bfPer = (opts.thicknessIn * opts.widthIn * (Lf*12)) / 144;
  const bfAlt = (opts.thicknessIn * opts.widthIn * Lf) / 12;
  const qty = opts.quantity ?? 1;
  return { bfPer: bfAlt, total: bfAlt * qty };
}
```

**Note:** `bfPer` is computed first but never returned; `bfAlt` is returned as `bfPer`. Both formulas are equivalent (`T*W*L(in)/144 = T*W*L(ft)/12`), so the dead-code `bfPer` is harmless but confusing.

### Formula in `models-structure.ts` (model version)
```js
boardFeet: {
  fields: [length('thickness', 'Board thickness used for pricing', 2, 'in'),
           length('width', 'Board width used for pricing', 6, 'in'),
           length('length', 'Board length', 8),
           count('quantity', 'Number of boards', 10),
           allowance, price('USD/unit')],
  formula: 'Board feet = thickness(in) x width(in) x length(ft) x quantity / 12.',
  calculate(v, u) {
    const per = v.thickness * 12 * v.width * 12 * v.length / 12;
    const net = per * v.quantity;
    const order = net * waste(v);
    // returns rows: boardFeet (order), net, per
  }
}
```

**ISSUE — The model formula looks wrong at first glance but is actually correct after unit conversion:**

The `length()` function with unit `'in'` creates a field where `readInputs` calls `convert(value, 'in', 'length')` which returns `value * (1/12)`. So:
- `v.thickness` = input inches * (1/12) = feet
- `v.width` = input inches * (1/12) = feet
- `v.length` = input feet * 1 = feet

The formula `v.thickness * 12 * v.width * 12 * v.length / 12` expands to:
- `(input_in/12) * 12 * (input_in/12) * 12 * input_ft / 12`
- `= input_in * input_in * input_ft / 12`

Which is the correct board foot formula: **T(in) * W(in) * L(ft) / 12**.

**Verified:** A 2x6x10 board = 2 * 6 * 10 / 12 = 10 board feet. Correct.

### Waste factor handling
**Correct.** Applied via `waste(v)` which returns `1 + (v.waste ?? 0) / 100`.

### Price/cost
**Correct.** `withCost` multiplies `order` quantity by `price`.

### Inappropriate references
**None.**

### Test verification
The test file (`independent-verification.test.ts` line 244-248) verifies:
```
boardFeet: 2x6x10 = 10 bf
```
This test passes. The `framing.ts` implementation is correct.

### Issues found

1. **Dead code in `framing.ts`:** Line 27 computes `bfPer` but the function returns `bfAlt` as `bfPer`. The variable `bfPer` is computed but never used. This is confusing but not mathematically wrong.

2. **Redundant formula in model:** `v.thickness * 12 * v.width * 12 * v.length / 12` simplifies to `v.thickness * v.width * v.length` (since `* 12 * 12 / 12 = * 12`). This is correct but could be written more clearly as `T(in) * W(in) * L(ft) / 12`.

### Assessment
The board foot calculation is mathematically correct. The only issues are code clarity (dead variable, overly complex formula expression).

---

## Cross-Cutting Issues

### Brand/Institution References

| Brand/Institution | File | Line | Context | Verdict |
|---|---|---|---|---|
| QUIKRETE | `GravelCalculator.astro` | 65 | Density range text | **Inappropriate** — Quikrete does not publish gravel density specs; the range is an FHWA/engineering standard |
| QUIKRETE | `models-materials.ts` | 5, 14 | Source citation + yield constants | **Appropriate** — QUIKRETE publishes 80-lb bag yield (0.60 ft3) |
| QUIKRETE | `models-slab.ts` | 5, 6 | Source citation | **Appropriate** — QUIKRETE has a published concrete calculator |
| CRSI | `models-materials.ts` | 720 | Concrete footing source | **Appropriate** — CRSI publishes rebar/footing guidance |
| CRSI | `models-structure.ts` | 3 | Rebar lap splice source | **Appropriate** — CRSI is the Concrete Reinforcing Steel Institute |
| CMHA | `models-materials.ts` | 6 | Masonry wall source | **Appropriate** — CMHA is the Concrete Masonry & Hardscapes Association |
| FHWA | `GravelCalculator.astro` | 65 | Density range text | **Appropriate** — FHWA publishes gravel density ranges |
| FHWA | `models-materials.ts` (cutFill) | 31 | Excavation swell source | **Appropriate** — FHWA publications cover earthwork |
| ACI | `models-materials.ts` | 8, 296 | Concrete density source | **Appropriate** — ACI 318R specifies normal-weight concrete density |

### Consistent Unit Conversion Strategy
All inline calculators (astro scripts) use a local `toFeet()` function. The centralized utility in `src/utils/units.ts` also defines `LENGTH_TO_FT` with identical values. These are consistent with each other and with the GenericCalculator model system.

### Waste Factor Consistency
All calculators apply waste once as `1 + waste/100`. None double-apply waste. The `ceilDiscrete()` helper in `src/utils/units.ts` and the `roundUp()` helper in `src/lib/calculator-math.ts` both use `Math.ceil(value - 1e-9)` to avoid false positives from floating-point rounding. The inline calculators use plain `Math.ceil()` without the epsilon, which is a minor inconsistency but unlikely to cause practical issues.

### Density Consistency
The pea gravel density of 1.35 tons/yd3 used in GravelCalculator, DrivewayGravelCalculator, and PeaGravelCalculator is consistent across all three. This equals 100 lb/ft3 (verified: 1.35 * 2000 / 27 = 100).

### Summary of Findings

| # | Calculator | Severity | Finding |
|---|---|---|---|
| 1 | GravelCalculator.astro | Low | Inappropriate QUIKRETE brand reference on line 65 (should reference FHWA or industry standard only) |
| 2 | FenceCostCalculator.astro | Medium | Panel/post count formula overcounts when gates divide the fence; the equal-length-run approach with ceil-multiply-back can produce 2 extra posts |
| 3 | BoardFeet (framing.ts) | Low | Dead variable `bfPer` computed but never used; confusing but harmless |
| 4 | BoardFeet (models-structure.ts) | Low | Overly complex formula expression (`*12*12/12` instead of `/12`) — correct but hard to read |
| 5 | RoofPitchCalculator.astro | Info | Ratio display shows "6.00 : 12.00" instead of conventional "6:12" format — minor UX issue, not a math error |
| 6 | ConcreteSlabCalculator | None | All formulas correct |
| 7 | DrivewayGravelCalculator | None | All formulas correct |
| 8 | MulchCalculator | None | All formulas correct |
| 9 | PeaGravelCalculator | None | All formulas correct |
