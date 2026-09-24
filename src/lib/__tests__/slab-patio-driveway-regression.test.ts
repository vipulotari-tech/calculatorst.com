import { describe, expect, it } from "vitest";
import { getModelForSlug } from "../calculator-registry.ts";
import { readInputs } from "../calculator-math.ts";

function run(
  slug: string,
  overrides: Record<string, number> = {},
  unitOverrides: Record<string, string> = {},
) {
  const model = getModelForSlug(slug);
  const raw: Record<string, number> = {};
  const units: Record<string, string> = {};

  for (const field of model.fields) {
    if (field.value !== undefined) raw[field.id] = field.value;
    else if (!field.optional) raw[field.id] = field.min !== undefined ? field.min : 1;
    if (field.unit) units[field.id] = field.unit;
  }

  Object.assign(raw, overrides);
  Object.assign(units, unitOverrides);
  const values = readInputs(model.fields, raw, units);
  return model.calculate(values, units);
}

function rowValue(slug: string, key: string, overrides: Record<string, number> = {}, units: Record<string, string> = {}) {
  const row = run(slug, overrides, units).rows.find((r) => r.key === key);
  if (!row) throw new Error(`Missing row ${key} for ${slug}`);
  return row.value;
}

describe("Slab, Patio & Driveway golden-value regression suite", () => {
  it("Slab Thickness: 1 yd³ spread over 10 × 10 ft averages 3.24 in", () => {
    expect(rowValue(
      "slab-thickness-calculator",
      "depth",
      { mode: 0, length: 10, width: 10, volume: 1 },
      { length: "ft", width: "ft", volume: "yd3" },
    )).toBeCloseTo(3.24, 8);

    const modeB = run(
      "slab-thickness-calculator",
      { mode: 1, length: 10, width: 10, thickness: 4, waste: 0, yield: 0.6, density: 2400, price: 5 },
      { length: "ft", width: "ft", thickness: "in", density: "kg/m3", price: "USD/bag" },
    );
    expect(modeB.rows.find(x => x.key === "ft3")?.value).toBeCloseTo(100 / 3, 8);
    expect(modeB.rows.find(x => x.key === "bags")?.value).toBe(56);
    expect(modeB.rows.find(x => x.key === "cost")?.value).toBeCloseTo(280, 8);
    expect(modeB.rows.find(x => x.key === "kg")?.value).toBeCloseTo((100 / 3) / (3.280839895013123 ** 3) * 2400, 6);

    const compare = run(
      "slab-thickness-calculator",
      { mode: 2, length: 10, width: 10, compareA: 4, compareB: 5, compareC: 6, waste: 0, density: 150, yield: 0.6, price: 200 },
      { length: "ft", width: "ft", compareA: "in", compareB: "in", compareC: "in", density: "lb/ft3", price: "USD/yd3" },
    );
    expect(compare.rows.find(x => x.key === "weightA")?.value).toBeCloseTo(5000, 8);
    expect(compare.rows.find(x => x.key === "costA")?.value).toBeCloseTo((100 / 3) / 27 * 200, 8);
  });

  it("Slab Cost: selected price basis plus entered project items are totaled once", () => {
    const r = run(
      "slab-cost-calculator",
      {
        length: 10, width: 10, depth: 4, quantity: 1, waste: 0,
        price: 200, scope: 1, tax: 10,
        delivery: 100, shortLoad: 0, pump: 0, subbase: 0,
        reinforcement: 50, forms: 25, finishing: 0, labor: 0,
      },
      { length: "ft", width: "ft", depth: "in", price: "USD/yd3" },
    );
    expect(r.rows.find(x => x.key === "materials")?.value).toBeCloseTo(246.913580247, 7);
    expect(r.rows.find(x => x.key === "total")?.value).toBeCloseTo(446.604938272, 7);

    const materialOnly = run(
      "slab-cost-calculator",
      {
        length: 10, width: 10, depth: 4, quantity: 1, waste: 0,
        price: 200, scope: 0, tax: 10,
        delivery: 100, shortLoad: 100, pump: 100, subbase: 100,
        reinforcement: 100, forms: 100, finishing: 100, labor: 100,
      },
      { length: "ft", width: "ft", depth: "in", price: "USD/yd3" },
    );
    expect(materialOnly.rows.find(x => x.key === "total")?.value).toBeCloseTo(246.913580247, 7);
    expect(materialOnly.rows.some(x => x.key === "delivery")).toBe(false);
    expect(materialOnly.rows.some(x => x.key === "tax")).toBe(false);
  });

  it("Slab Reinforcement: 10 × 10 ft slab, 3 in edge offset, 18 in max spacing gives 16 bars and 152 ft", () => {
    const r = run(
      "slab-reinforcement-calculator",
      { length: 10, width: 10, cover: 3, spacing: 18, waste: 0, size: 4 },
      { length: "ft", width: "ft", cover: "in", spacing: "in" },
    );
    expect(r.rows.find(x => x.key === "gridL")?.value).toBeCloseTo(9.5, 8);
    expect(r.rows.find(x => x.key === "gridW")?.value).toBeCloseTo(9.5, 8);
    expect(r.rows.find(x => x.key === "bars")?.value).toBe(16);
    expect(r.rows.find(x => x.key === "length")?.value).toBeCloseTo(152, 8);
    expect(r.rows.find(x => x.key === "actualL")?.value).toBeCloseTo(16.285714286, 7);
  });

  it("Patio Concrete: rectangle includes form perimeter, optional base and truck planning", () => {
    const r = run(
      "patio-concrete-calculator",
      { patioShape: 0, length: 12, width: 10, thickness: 4, quantity: 1, subbaseDepth: 4, truckCapacity: 1, waste: 0 },
      { length: "ft", width: "ft", thickness: "in", subbaseDepth: "in" },
    );
    expect(r.rows.find(x => x.key === "ft3")?.value).toBeCloseTo(40, 8);
    expect(r.rows.find(x => x.key === "perimeter")?.value).toBeCloseTo(44, 8);
    expect(r.rows.find(x => x.key === "subbase")?.value).toBeCloseTo(40 / 27, 8);
    expect(r.rows.find(x => x.key === "loads")?.value).toBe(2);
    expect(r.rows.find(x => x.key === "lastLoad")?.value).toBeCloseTo(40 / 27 - 1, 8);
  });

  it("Patio Cost: full-project scope adds only entered line items and reports per-square-foot cost", () => {
    const r = run(
      "patio-cost-calculator",
      {
        length: 12, width: 10, depth: 4, quantity: 1, waste: 0,
        price: 200, scope: 1, tax: 10, delivery: 100, shortLoad: 0, pump: 0,
        subbase: 0, reinforcement: 0, forms: 50, finishing: 0,
        decorative: 75, demolition: 0, labor: 200,
      },
      { length: "ft", width: "ft", depth: "in", price: "USD/yd3" },
    );
    expect(r.rows.find(x => x.key === "materials")?.value).toBeCloseTo(296.296296296, 7);
    expect(r.rows.find(x => x.key === "total")?.value).toBeCloseTo(750.925925926, 7);
    expect(r.rows.find(x => x.key === "sqft")?.value).toBeCloseTo(750.925925926 / 120, 7);
  });

  it("Driveway Concrete: trapezoid uses editable length once, plus optional base and truck planning", () => {
    const r = run(
      "driveway-concrete-calculator",
      { driveShape: 2, length: 30, widthStreet: 10, widthHouse: 20, thickness: 4, quantity: 1, subbaseDepth: 6, truckCapacity: 4, waste: 0 },
      { length: "ft", widthStreet: "ft", widthHouse: "ft", thickness: "in", subbaseDepth: "in" },
    );
    expect(r.rows.find(x => x.key === "area")?.value).toBeCloseTo(450, 8);
    expect(r.rows.find(x => x.key === "ft3")?.value).toBeCloseTo(150, 8);
    expect(r.rows.find(x => x.key === "subbase")?.value).toBeCloseTo(225 / 27, 8);
    expect(r.rows.find(x => x.key === "loads")?.value).toBe(2);
    expect(r.rows.find(x => x.key === "lastLoad")?.value).toBeCloseTo(150 / 27 - 4, 8);
  });

  it("Driveway Cost: formwork is included when entered in full-project scope", () => {
    const r = run(
      "driveway-cost-calculator",
      {
        length: 24, width: 10, depth: 4, quantity: 1, waste: 0,
        price: 200, scope: 1, tax: 10, delivery: 0, shortLoad: 0, pump: 0,
        subbase: 0, reinforcement: 0, forms: 100, joints: 50,
        finishing: 0, demolition: 0, disposal: 0, labor: 200,
      },
      { length: "ft", width: "ft", depth: "in", price: "USD/yd3" },
    );
    expect(r.rows.find(x => x.key === "materials")?.value).toBeCloseTo(592.592592593, 7);
    expect(r.rows.find(x => x.key === "forms")?.value).toBeCloseTo(100, 8);
    expect(r.rows.find(x => x.key === "total")?.value).toBeCloseTo(1001.851851852, 7);
  });

  it("Driveway Thickness: known volume and area solve inverse depth without implying design adequacy", () => {
    expect(rowValue(
      "driveway-thickness-calculator",
      "depth",
      { mode: 0, length: 24, width: 10, volume: 2 },
      { length: "ft", width: "ft", volume: "yd3" },
    )).toBeCloseTo(2.7, 8);
  });

  it("Garage Slab: thickened perimeter, base, vapor barrier and truck loads are additive and explicit", () => {
    const r = run(
      "garage-slab-calculator",
      {
        length: 20, width: 20, thickness: 4, quantity: 1,
        edgeDepth: 12, edgeWidth: 12, gravelDepth: 4,
        vaporBarrier: 1, truckCapacity: 5, waste: 0,
      },
      { length: "ft", width: "ft", thickness: "in", edgeDepth: "in", edgeWidth: "in", gravelDepth: "in" },
    );
    expect(r.rows.find(x => x.key === "ft3")?.value).toBeCloseTo(184, 7);
    expect(r.rows.find(x => x.key === "edge")?.value).toBeCloseTo(50.666666667, 7);
    expect(r.rows.find(x => x.key === "gravel")?.value).toBeCloseTo((400 / 3) / 27, 7);
    expect(r.rows.find(x => x.key === "vapor")?.value).toBeCloseTo(400, 8);
    expect(r.rows.find(x => x.key === "forms")?.value).toBeCloseTo(80, 8);
    expect(r.rows.find(x => x.key === "loads")?.value).toBe(2);
    expect(r.rows.find(x => x.key === "lastLoad")?.value).toBeCloseTo(184 / 27 - 5, 7);
  });

  it("Shed Foundation: slab, piers and strip footing normalize units exactly once", () => {
    expect(rowValue(
      "shed-foundation-calculator",
      "ft3",
      { foundationType: 0, length: 10, width: 10, thickness: 4, quantity: 1, waste: 0 },
      { length: "ft", width: "ft", thickness: "in" },
    )).toBeCloseTo(100 / 3, 8);

    expect(rowValue(
      "shed-foundation-calculator",
      "ft3",
      { foundationType: 1, pierCount: 4, pierDiameter: 12, pierDepth: 24, quantity: 2, waste: 0 },
      { pierDiameter: "in", pierDepth: "in" },
    )).toBeCloseTo(4 * Math.PI, 8);

    expect(rowValue(
      "shed-foundation-calculator",
      "ft3",
      { foundationType: 2, length: 10, footingWidth: 12, footingDepth: 12, quantity: 2, waste: 0 },
      { length: "ft", footingWidth: "in", footingDepth: "in" },
    )).toBeCloseTo(20, 8);
  });

  it("Shed Foundation: spacing-based pier layout rounds intervals up and keeps actual spacing within the entered maximum", () => {
    const r = run(
      "shed-foundation-calculator",
      {
        foundationType: 3,
        pierPlanLength: 10,
        pierPlanWidth: 12,
        pierSpacing: 6,
        pierDiameter: 12,
        pierDepth: 24,
        quantity: 1,
        waste: 0,
      },
      {
        pierPlanLength: "ft",
        pierPlanWidth: "ft",
        pierSpacing: "ft",
        pierDiameter: "in",
        pierDepth: "in",
      },
    );

    expect(r.rows.find(x => x.key === "pierCount")?.value).toBe(9);
    expect(r.rows.find(x => x.key === "pierCountLength")?.value).toBe(3);
    expect(r.rows.find(x => x.key === "pierCountWidth")?.value).toBe(3);
    expect(r.rows.find(x => x.key === "pierSpacingLength")?.value).toBeCloseTo(60, 8);
    expect(r.rows.find(x => x.key === "pierSpacingWidth")?.value).toBeCloseTo(72, 8);
    expect(r.rows.find(x => x.key === "ft3")?.value).toBeCloseTo(4.5 * Math.PI, 8);
  });

  it("Shed Foundation: bag pricing uses rounded bag count instead of cubic-yard quantity", () => {
    const r = run(
      "shed-foundation-calculator",
      {
        foundationType: 1, pierCount: 4, pierDiameter: 12, pierDepth: 24, quantity: 1,
        waste: 0, yield: 0.6, price: 5, delivery: 0, labor: 0, tax: 0,
      },
      { pierDiameter: "in", pierDepth: "in", price: "USD/bag" },
    );
    expect(r.rows.find(x => x.key === "bags")?.value).toBe(11);
    expect(r.rows.find(x => x.key === "materials")?.value).toBeCloseTo(55, 8);
    expect(r.rows.find(x => x.key === "total")?.value).toBeCloseTo(55, 8);
  });
});
