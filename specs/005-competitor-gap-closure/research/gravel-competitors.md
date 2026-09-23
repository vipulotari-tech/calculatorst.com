# Gravel Calculator — Competitor Research

> Factual observations from a structural review of two top-ranking gravel calculator pages.
> No competitor copy was reproduced. All notes summarize observed capabilities and presentation.

**Research date:** 2026-09
**Search intent:** "gravel calculator"
**Pages reviewed:**

1. https://www.calculatorsoup.com/calculators/construction/gravel-calculator.php
2. https://www.inchcalculator.com/gravel-calculator/

---

## 1. Feature Comparison Matrix

| Capability | CalculatorSoup | InchCalculator |
|---|---|---|
| **URL modes** | Dimensions (L×W×D), Area (with depth), Volume | Total area, Rectangle, Circle, Triangle |
| **Shape support** | Implicit rectangle (L×W) | Rectangle, Circle, Triangle (no quad/polygon) |
| **Material types** | 6 (Gravel, Rock, Pea Gravel, Sand, Topsoil, Riprap) | 10 (Pea gravel, River rock, Crushed stone #57, Crushed stone #411, DGA/QP, Bank run gravel, Decomposed granite, Lava rock, Marble chips, Riprap) |
| **Material size variants** | Sized ranges (¼"–2", 2"–6", ¼"–⅜") | Sized labels (Fine / Medium / Coarse / Extra coarse) + custom density |
| **Density — editable?** | No (fixed per material, range shown) | Yes (preset + user-editable custom density field) |
| **Density units shown** | tons/cu yd (range) | kg/m³ and lb/yd³ (two reference tables) |
| **Compaction handling** | Text guidance only ("+30% if compacted") — not automated | Separate numeric input, defaults suggested 5–30% |
| **Waste / overrun handling** | Text guidance only ("+10% for overage") — not automated | Separate numeric input, defaults suggested 5–15% |
| **Compaction vs waste** | Combined narrative guidance, not separated | Treated as two independent adders |
| **Length / width / depth units** | in, ft, yd, cm, m | in, ft, yds, cm, m (no separate yd) |
| **Area units** | sq ft, sq yd, sq m | in², ft², yd², acre, hectare, cm², m² |
| **Volume units** | cu ft, cu yd, cu m | cu ft, cu yd, cu m |
| **Weight units in result** | tons only | pounds, kilograms, US tons, long tons, metric tons |
| **Currency support** | $ only (USD implied) | $, £, € |
| **Price basis** | $/ton or $/cu yd | per cu ft / cu yd / cu m / US ton / long ton / metric ton |
| **Cost result** | Yes (if price entered) | Yes (if price entered) |
| **Bag count result** | No | No |
| **Formula shown** | Yes (L×W×D in ft ÷ 27; weight = cu yd × density) | Yes (5-step walkthrough) |
| **Worked example** | Yes (10′×10′×1′) | Yes (20′×10′ patio at 3″ depth) |
| **Coverage reference table** | No | Yes (ft² per inch of depth) |
| **FAQ count** | 3 questions | 4 questions |
| **Diagrams** | 2 (formula graphic + supplier photo) | 1 (labeled gravel type samples) |
| **Interactive diagrams** | No | No |
| **Truck-load guidance** | Yes (pickup 1 cu yd; dump 13–25 tons; $35–$50/ton) | No |
| **Accessibility features** | Dark mode toggle, skip-to-content, labeled icons + alt, share/embed/cite dialogs, semantic headings | Skip links (×3: answer, calculator start, main content), descriptive alt text, semantic h1/h2/h3 |
| **Mobile apps offered** | iOS + Android | Not mentioned |
| **Responsive layout** | Yes (collapsible nav, touch-friendly dropdowns) | Standard HTML form (not specifically tested in source) |

---

## 2. CalculatorSoup — Detailed Observations

**URL:** https://www.calculatorsoup.com/calculators/construction/gravel-calculator.php

### URL Modes
Three modes supported, switched via tabs:
- **Dimensions** — user enters length, width, and depth.
- **Area** — user enters a known area plus depth (volume is computed).
- **Volume** — user enters a known volume directly (no depth field).

### Input Options & Fields
- Length, width, depth (each with its own unit dropdown).
- Material selector (dropdown).
- Optional price field with per-ton or per-cubic-yard basis.
- Numeric inputs only; no shape selector beyond an implicit rectangle for Dimensions mode.

### Material Types Supported
- Gravel (¼"–2")
- Rock (2"–6")
- Pea Gravel (¼"–⅜")
- Sand (dry / wet)
- Topsoil (dry / compacted / wet)
- Riprap

### Density Handling
Fixed per material. A range is displayed (e.g., gravel 1.4–1.7 tons/cu yd) but the user cannot override. No lb/ft³ or kg/m³ values are surfaced to the user.

### Compaction Handling
No numeric compaction field. Compaction is addressed only in narrative text below the calculator, which recommends +30% extra material when compacting. The user must do this addition manually.

### Waste / Overage Handling
Same pattern as compaction — narrative only ("+10% for overage"), not automated.

### Unit Systems
- Length/width/depth: inches, feet, yards, centimeters, meters.
- Area: square feet, square yards, square meters.
- Volume: cubic feet, cubic yards, cubic meters.
- Weight: tons only in the result.
- Price: USD only, per ton or per cubic yard.

### Results Provided
- Tons.
- Cubic yards.
- Estimated cost (when a price is supplied).
- No pounds, no kilograms, no bag count.

### Diagrams
- A cubic-yards formula graphic (L × W × H ft ÷ 27).
- A photograph of a landscape supplier.
- Neither is interactive; both are illustrative.

### Formula Transparency
Formulas are stated explicitly in text:
- Cubic yards = (L × W × D in feet) / 27.
- Weight (tons) = cubic yards × density (1.4–1.7 tons/cu yd).

### Worked Example
A single worked example is provided: 10′ × 10′ × 1′ → 100 cu ft → 3.7 cu yds → 5.2–6.3 tons; with overage 5.7 tons; with compaction 7.4 tons.

### FAQ Content
Three questions covered:
- Order by yard or ton? (answer: supplier-dependent).
- Coverage per ton (0.59–0.71 cu yds).
- Truck load sizes and pricing (pickup ~1 cu yd; dump 13–25 tons; $35–$50/ton → $455–$1,250/load).

### Accessibility Features
- Dark mode toggle.
- Skip-to-content link.
- Labeled icons with alt text.
- Share, embed, and cite dialogs.
- Semantic heading structure.
- iOS and Android apps linked.

### Mobile UX
Responsive layout, collapsible navigation, touch-friendly unit dropdowns. Dedicated iOS/Android apps are advertised.

---

## 3. InchCalculator — Detailed Observations

**URL:** https://www.inchcalculator.com/gravel-calculator/

### URL Modes
Four modes supported, switched via tabs:
- **Total area** — single numeric input for area.
- **Rectangle** — length × width.
- **Circle** — radius or diameter.
- **Triangle** — base × height.

No "known volume" mode — volume is always derived from area × depth.

### Input Options & Fields
- Gravel type dropdown (10 presets).
- Area input with unit toggle: in², ft², yd², acre, hectare, cm², m².
- Depth input with unit toggle: in, ft, yds, cm, m.
- Compaction % (optional; defaults suggested 5–30%).
- Waste & Overrun % (optional; defaults suggested 5–15%).
- Currency selector: USD, GBP, EUR.
- Price field with per-unit toggle: per cu ft, per cu yd, per cu m, per US ton, per long ton, per metric ton.
- Custom density entry (user-editable).

### Material Types Supported
- Pea gravel
- River rock
- Crushed stone #57
- Crushed stone #411
- Dense graded aggregate (DGA / QP)
- Bank run gravel
- Decomposed granite
- Lava rock
- Marble chips
- Riprap

Also labeled by size: Fine / Medium / Coarse / Extra coarse, with custom density override.

### Density Handling
- Fixed presets per material type.
- User-editable custom density field.
- Two reference tables displayed: kg/m³ and lb/yd³.

### Compaction Handling
A dedicated numeric input, described as "typically 5–30% extra." Applied to volume additively and independently of the waste factor.

### Waste / Overrun Handling
Separate numeric input from compaction, defaults suggested 5–15%. Treated as an independent adder to volume.

### Unit Systems
- Area: in², ft², yd², acre, hectare, cm², m².
- Depth: in, ft, yds, cm, m.
- Weight result: pounds, kilograms, US tons, long tons, metric tons.
- Price: per cu ft, per cu yd, per cu m, per US ton, per long ton, per metric ton.

### Results Provided
- Volume.
- Density (echoed back).
- Weight (in pounds, kilograms, US tons, long tons, metric tons).
- Total cost (in selected currency).

No bag count is provided.

### Diagrams
A single image showing labeled gravel type samples (pea gravel, river rock, crushed stone variants, bank run, decomposed granite, lava rock, marble chips, riprap). Decorative / reference only. No area-shape diagrams, no depth visualizations, no flow charts.

### Formula Transparency
Five-step formula explicitly written out:
1. Area = length × width.
2. Depth in feet = inches ÷ 12.
3. Volume ft³ = area × depth.
4. Cubic yards = ft³ ÷ 27.
5. Pounds = yd³ × density.

Includes a coverage reference (324 ft² at 1″ depth; 162 ft² at 2″ depth; 108 ft² at 2″ depth; 81 ft² at 3″ depth — note: the source repeats "2 inch depth" twice, which appears to be an error in the original page).

### Worked Example
One example: 20 ft × 10 ft patio at 3 in depth using pea gravel (density 2,565 lb/yd³) → 1.85 yd³ → 4,745.25 lbs.

### FAQ Content
Four questions covering:
- The formula.
- Typical depths by use case.
- Material selection guidance.
- Coverage per cubic yard.

### Accessibility Features
- Skip links: "skip to calculator answer," "skip to calculator start," "skip to main content."
- Descriptive alt text on the gravel type reference image.
- Semantic heading structure (h1, h2, h3).
- Form controls associated with labels (implied by standard markup).

### Mobile UX
Standard HTML form with dropdowns and numeric inputs. Unit toggles are radio-style buttons. Result block is a separate anchor-linked region. No specific responsive or touch-optimization claims are visible in the page source.

---

## 4. Gap Themes Identified

Observations only; no recommendations made here.

- **Shape coverage** — neither competitor supports a quad / polygon / trapezoid shape; only rectangle (and InchCalculator's circle and triangle).
- **Compaction + waste** — only InchCalculator exposes both as separate numeric inputs; CalculatorSoup leaves them as text guidance.
- **Density transparency** — InchCalculator exposes editable density plus kg/m³ and lb/yd³ tables; CalculatorSoup shows only a tons-per-cubic-yard range.
- **Result units** — InchCalculator provides five weight units (lb, kg, US ton, long ton, metric ton); CalculatorSoup shows tons only.
- **Bag count** — neither competitor converts the result into bag counts, which is a frequently searched follow-up intent.
- **Diagrams** — both are decorative static images; neither offers interactive shape entry or visual area/depth preview.
- **Known-volume mode** — CalculatorSoup is the only one of the two with an explicit "enter volume directly" path; InchCalculator forces depth multiplication.
- **FAQ scope** — both are short (3–4 questions); no competitor appears to cover delivery fees, regional price variance, or substrate/ground-prep in FAQ form.
- **Accessibility** — both implement basic skip links and semantic headings; CalculatorSoup adds a dark mode toggle and dedicated mobile apps; InchCalculator's mobile UX is not visibly optimized beyond standard responsive form layout.

---

## 5. Summary

| Strength observed | CalculatorSoup | InchCalculator |
|---|---|---|
| Explicit known-volume URL mode | ✓ | — |
| Shape variety (rectangle / circle / triangle) | — | ✓ |
| Material variety (10 vs 6) | — | ✓ |
| User-editable density | — | ✓ |
| Separate compaction + waste fields | — | ✓ |
| Multiple weight units in result | — | ✓ |
| Multi-currency | — | ✓ |
| Coverage reference table | — | ✓ |
| Truck-load guidance in FAQ | ✓ | — |
| Dark mode + mobile apps | ✓ | — |
| Skip links + semantic structure | ✓ | ✓ |
| Interactive diagram | — | — |
| Bag count output | — | — |
