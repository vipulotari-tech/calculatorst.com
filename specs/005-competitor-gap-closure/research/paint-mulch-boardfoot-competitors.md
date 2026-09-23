# Competitor Research: Paint, Mulch, Board Foot Calculators

Researched: 2026-09
Scope: Factual observations only. No content was copied.
Sources: calculatorsoup.com, omnicalculator.com, inchcalculator.com

---

## 1. Paint Calculator

### Source A — CalculatorSoup
**URL:** https://www.calculatorsoup.com/calculators/construction/paint-calculator.php
**Status:** 404 at fetch time (and at alternate paths `paint-calculator.html`, `paintcalculator.php`, `home-improvement/paint-calculator.php`). Page appears to be retired or relocated. No observations recorded.

### Source B — Omni Calculator
**URL:** https://www.omnicalculator.com/construction/paint

**Calculation modes (5):**
- Wall Room — width, height, doors, windows
- Ceiling Room — room length, room width
- Room & Ceiling — length, width, wall height, doors, windows
- Trim — Baseboard (length + height), Molding (length + height), Door/Window Casing (length + width)
- Calculated Area — manual total-area entry for irregular shapes (split into zones, sum, then enter)

**Door/window deductions:**
- Standard door assumed 21 sq ft (3' × 7')
- Standard window assumed 15 sq ft (3' × 5')
- Count-based deduction (user enters number of doors and number of windows)

**Ceiling handling:**
- Dedicated Ceiling mode (length × width)
- Combined Room & Ceiling mode handles both together

**Number of coats:**
- User-configurable; default 2 ("typically 2")

**Primer handling:**
- None on this page. Primer is not modeled.

**Coverage rates:**
- Coverage per gallon — user-editable; default "typically 350–400 ft²"
- Reference table by surface:
  - Smooth drywall: ~400 ft²/gal
  - Textured walls/ceilings: ~350 ft²/gal
  - Wood siding: ~275 ft²/gal
  - Brick: ~200 ft²/gal
  - Stucco: ~175 ft²/gal

**Unit systems:**
- US (ft, in) and Metric (cm, m) supported via per-field unit toggles
- Area units: in², ft², cm², m²

**Results provided:**
- Paint needed (volume)
- Purchase breakdown: gallons, quarts, liters
- Paint cost (when cost per gallon supplied)
- Labor estimate (when labor rate supplied — per sq ft, sq m, linear ft, or linear m)
- Total estimated cost
- Painted area
- Quart cost auto-estimated at ~40% of gallon cost when <1 gallon is needed

**Diagram quality:**
- No diagrams or visual room layouts. Form-based only.

**Formula transparency:**
- No formulas shown to user. Measurement instructions provided, but the math is hidden.

**Mobile UX:**
- No mobile-specific features described.

---

## 2. Mulch Calculator

### Source A — CalculatorSoup
**URL:** https://www.calculatorsoup.com/calculators/construction/mulch-calculator.php

**Calculation modes (2):**
- Length & Width — direct dimensions
- Area — pre-measured square footage (links to a square-footage calculator)

**Input options:**
- Length & Width mode: Length, Width, Depth, each with unit selector (in, ft, yd, cm, mm)
- Area mode: Area (sq ft / sq yd / sq m), Depth (in / ft / yd / cm / mm)

**Results provided:**
- Volume in cubic yards
- Volume in cubic feet
- Number of 2 cu ft bags
- Number of 3 cu ft bags

**Bag calculations:**
- Hard-coded to two bag sizes: 2 cu ft and 3 cu ft
- Reference table (1–5 cu yds):
  - 1 cu yd = 14 × (2 cu ft) bags = 9 × (3 cu ft) bags
  - 5 cu yds = 68 × (2 cu ft) bags = 45 × (3 cu ft) bags
- Weight reference: 2 cu ft bag ≈ 20 lbs; 3 cu ft bag ≈ 30 lbs

**Waste handling:**
- Recommendation only: "add another 10% to your total estimated volume"
- Guidance to round up between bag quantities for settlement/migration/transport loss
- No automatic waste buffer applied by the calculator

**Cost handling:**
- None. No price-per-yard or price-per-bag input. Bulk discount mentioned in text only.

**Diagram quality:**
- One photograph of mulch application
- Two formula graphics: cubic-feet and cubic-yards formulas
- Coverage table graphic: sq ft per cu yd at depths 1″–5″

**Additional features:**
- Shareable result link
- Embeddable widget
- Linked iOS / Google Play apps
- FAQ (depth, weight, bagged vs. bulk)
- No login

### Source B — InchCalculator
**URL:** https://www.inchcalculator.com/mulch-calculator/

**Calculation modes (7 shapes):**
- Square
- Rectangle
- Rectangle Border (border only, subtracts inner area)
- Circle
- Circle Border (annulus)
- Triangle
- Trapezoid
- (Annulus mentioned in shape list; counted above.)

**Input options:**
- Length (ft, cm, m)
- Width (ft, cm, m)
- Depth (ft, yd, cm, m)
- Pricing mode: Bulk or Bags
- Bag size: 0.8, 1.0, 1.5, 1.8, or 2.0 cu ft
- Unit pricing: per cu ft, per cu yd, or per cu m

**Results provided (always):**
- Cubic yards (yd³)
- Cubic feet (ft³)
- Cubic meters (m³)
- When bag pricing entered: bag count + total cost

**Bag calculations:**
- Bag cheat sheet: 1.5 cu ft ≈ 6 sq ft at 3″ depth; 2.0 cu ft ≈ 8 sq ft; 3.0 cu ft ≈ 12 sq ft
- Bags per cu yd: 18 (1.5 cu ft), 14 (2.0 cu ft), 9 (3.0 cu ft)
- Five selectable bag sizes (0.8 / 1.0 / 1.5 / 1.8 / 2.0 cu ft)

**Waste handling:**
- Guidance: "5–10% extra for waste and settling" — not auto-applied

**Cost handling:**
- Bulk mode: input price per cu ft / cu yd / cu m
- Bag mode: input price per bag (any of 5 sizes)
- Total cost derived automatically

**Diagram quality:**
- Simple 2D shape outlines (rectangle, circle, triangle, trapezoid, border variants)
- Schematics without dimensional annotations
- Written step-by-step formula breakdowns for every shape

**Additional features:**
- Volume conversion tables (cu in → cu ft → cu yd; cm → m)
- Mulch-type quick-reference with recommended depths by application
- FAQ (bag equivalencies, fabric under mulch, seasonal timing, professional organizations)

---

## 3. Board Foot Calculator

### Source A — CalculatorSoup
**URL:** https://www.calculatorsoup.com/calculators/construction/lumber.php

**Formula transparency:**
- Formula shown directly: `board feet = length (ft) × width (in) × thickness (in) / 12`
- Definition stated: 1 board foot = 144 cubic inches = 1/12 cubic foot

**Input modes:**
- Number of boards
- Thickness (in)
- Width (in)
- Length (ft)
- Price per board foot

**Species / density options:**
- No species selector. Wood type is not a calculator input.
- Informational density note only: Oak averages 3.875 lb (1.77 kg) per BF (range 3.08–4.67 lb)

**Cost calculations:**
- Total BF × per-BF price
- Worked example: 41.67 BF × $4.15 = $172.92

**Results provided:**
- Total board feet
- Total cost

**Reference tables:**
- Board feet for 2x4 lumber at lengths 6–24 ft (8 ft = 5⅓ BF; 12 ft = 8 BF; 24 ft = 16 BF)

**Worked examples:**
- Step-by-step example with the formula applied numerically
- Doyle log rule also shown: `((Diameter − 4) / 4)² × Length`

**Other:**
- Linear foot vs. board foot distinction explained ("board foot is a measure of volume, whereas a linear foot is a measure of length")

### Source B — Omni Calculator
**URL:** https://www.omnicalculator.com/construction/board-foot

**Formula transparency:**
- Formula displayed: `board feet = length (ft) × width (in) × thickness (in) / 12`
- 1 BF = 144 in³

**Input modes:**
- Number of boards
- Thickness (in)
- Width (in)
- Length (ft)
- Price per board foot

**Species / density options:**
- No species selector in inputs
- Density referenced in informational FAQ only (Oak ≈ 3.875 lb/BF average)

**Cost calculations:**
- Total cost = total BF × per-BF price
- Worked example: 41.67 × $4.15 = $172.92

**Results provided:**
- Total board feet
- Total cost

**Reference tables:**
- 2x4 board-feet table across common lengths (6–24 ft)

**Worked examples:**
- Same numeric example as CalculatorSoup (likely a shared example)

---

## Summary Observations (Factual)

- **Paint** — Omni Calculator offers substantially more depth than CalculatorSoup's retired page: 5 modes (Walls, Ceiling, Walls+Ceiling, Trim, Calculated Area), door/window deduction logic, surface-based coverage table, quart/gallon/liter purchase breakdown, and labor estimation. Neither page shows formulas or diagrams.
- **Mulch** — InchCalculator leads on shape coverage (7 shapes incl. borders/annulus), selectable bag sizes (5), and built-in cost handling. CalculatorSoup is simpler (2 modes, 2 bag sizes, no cost). Neither calculator auto-applies a waste buffer — both recommend 5–10% extra in text.
- **Board Foot** — CalculatorSoup and Omni Calculator are near-parity: same formula, same inputs, same reference table, same worked example. Neither offers a species/density input that affects output; density appears only in informational text.
- **Common gaps across all six tools** — None of the six expose the underlying formula in a copyable/transparent way beyond the board-foot page, none offer interactive diagrams, none require an account, and only CalculatorSoup's mulch page offers an embeddable widget.

---

## Source URLs

- https://www.calculatorsoup.com/calculators/construction/paint-calculator.php (404 at research time)
- https://www.omnicalculator.com/construction/paint
- https://www.calculatorsoup.com/calculators/construction/mulch-calculator.php
- https://www.inchcalculator.com/mulch-calculator/
- https://www.calculatorsoup.com/calculators/construction/lumber.php
- https://www.omnicalculator.com/construction/board-foot
