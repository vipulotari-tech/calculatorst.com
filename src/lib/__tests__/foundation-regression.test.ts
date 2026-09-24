import { describe, expect, it } from "vitest";
import { getModelForSlug } from "../calculator-registry.ts";
import { readInputs } from "../calculator-math.ts";

function run(slug: string, overrides: Record<string, number> = {}, unitOverrides: Record<string, string> = {}) {
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
  return model.calculate(readInputs(model.fields, raw, units), units);
}

const value = (slug: string, key: string, overrides: Record<string, number> = {}, units: Record<string, string> = {}) => {
  const r = run(slug, overrides, units).rows.find((x) => x.key === key);
  if (!r) throw new Error(`Missing ${key} for ${slug}`);
  return r.value;
};

describe("Foundation & Footing golden-value regression suite", () => {
  it("Foundation Cost uses selected price basis and only entered full-scope items", () => {
    const r = run("foundation-cost-calculator", {
      foundationType: 0, length: 10, width: 10, thickness: 4, quantity: 1, waste: 0,
      density: 150, yield: 0.6, price: 200, scope: 1, tax: 10, delivery: 100,
      excavation: 500, forms: 100, reinforcement: 200, waterproofing: 150, labor: 300,
    }, { length: "ft", width: "ft", thickness: "in", density: "lb/ft3", price: "USD/yd3" });
    expect(r.rows.find(x => x.key === "yards")?.value).toBeCloseTo((100 / 3) / 27, 8);
    expect(r.rows.find(x => x.key === "materials")?.value).toBeCloseTo((100 / 3) / 27 * 200, 8);
    expect(r.rows.find(x => x.key === "total")?.value).toBeCloseTo(1621.604938272, 7);

    const materialOnly = run("foundation-cost-calculator", {
      foundationType: 0, length: 10, width: 10, thickness: 4, quantity: 1, waste: 0,
      density: 150, yield: 0.6, price: 5, scope: 0, tax: 10, delivery: 1000,
      excavation: 1000, forms: 1000, reinforcement: 1000, waterproofing: 1000, labor: 1000,
    }, { length: "ft", width: "ft", thickness: "in", density: "lb/ft3", price: "USD/bag" });
    expect(materialOnly.rows.find(x => x.key === "bags")?.value).toBe(56);
    expect(materialOnly.rows.find(x => x.key === "total")?.value).toBeCloseTo(280, 8);
  });

  it("Foundation Excavation separates working room, overbreak and swell", () => {
    const r = run("foundation-excavation-calculator", {
      length: 30, width: 20, depth: 6, workingRoom: 1.5, overbreak: 10, swell: 20,
      bankRate: 20, haulRate: 5, fixed: 500,
    }, { length: "ft", width: "ft", depth: "ft", workingRoom: "ft" });
    const bank = (33 * 23 * 6 * 1.10) / 27;
    const loose = bank * 1.20;
    expect(r.rows.find(x => x.key === "bank")?.value).toBeCloseTo(bank, 8);
    expect(r.rows.find(x => x.key === "loose")?.value).toBeCloseTo(loose, 8);
    expect(r.rows.find(x => x.key === "total")?.value).toBeCloseTo(bank * 20 + loose * 5 + 500, 8);
  });

  it("Strip Footing uses centerline run × cross-section × quantity", () => {
    expect(value("strip-footing-calculator", "ft3", {
      length: 40, width: 16, depth: 8, quantity: 1, waste: 0,
    }, { length: "ft", width: "in", depth: "in" })).toBeCloseTo(40 * (16 / 12) * (8 / 12), 8);
  });

  it("Pad Footing supports rectangular, square and round pads", () => {
    expect(value("pad-footing-calculator", "ft3", {
      shape: 0, length: 30, width: 24, depth: 12, quantity: 4, waste: 0,
    }, { length: "in", width: "in", depth: "in" })).toBeCloseTo(20, 8);

    expect(value("pad-footing-calculator", "ft3", {
      shape: 1, side: 24, depth: 12, quantity: 4, waste: 0,
    }, { side: "in", depth: "in" })).toBeCloseTo(16, 8);

    expect(value("pad-footing-calculator", "ft3", {
      shape: 2, diameter: 24, depth: 12, quantity: 4, waste: 0,
    }, { diameter: "in", depth: "in" })).toBeCloseTo(4 * Math.PI, 8);
  });

  it("Pier Footing supports cylindrical shaft plus optional enlarged base without double-counting", () => {
    expect(value("pier-footing-calculator", "ft3", {
      diameter: 12, depth: 36, quantity: 6, bellDiameter: 0, bellDepth: 0, waste: 0,
    }, { diameter: "in", depth: "in", bellDiameter: "in", bellDepth: "in" })).toBeCloseTo(4.5 * Math.PI, 8);

    expect(value("pier-footing-calculator", "ft3", {
      diameter: 12, depth: 36, quantity: 6, bellDiameter: 24, bellDepth: 12, waste: 0,
    }, { diameter: "in", depth: "in", bellDiameter: "in", bellDepth: "in" })).toBeCloseTo(9 * Math.PI, 8);
  });

  it("Footing Volume is geometry-only and applies allowance once", () => {
    const net = 20 * (16 / 12) * (10 / 12);
    expect(value("footing-volume-calculator", "netYd", {
      shape: 0, length: 20, width: 16, depth: 10, quantity: 1, waste: 10,
    }, { length: "ft", width: "in", depth: "in" })).toBeCloseTo(net / 27, 8);
    expect(value("footing-volume-calculator", "orderYd", {
      shape: 0, length: 20, width: 16, depth: 10, quantity: 1, waste: 10,
    }, { length: "ft", width: "in", depth: "in" })).toBeCloseTo(net * 1.10 / 27, 8);
  });

  it("Footing Concrete round mode returns bags, weight and price-aware material cost", () => {
    const r = run("footing-concrete-calculator", {
      shape: 3, diameter: 18, depth: 10, quantity: 4, waste: 0,
      density: 150, yield: 0.6, price: 5,
    }, { diameter: "in", depth: "in", density: "lb/ft3", price: "USD/bag" });
    const ft3 = Math.PI * (0.75 ** 2) * (10 / 12) * 4;
    const bags = Math.ceil(ft3 / 0.6);
    expect(r.rows.find(x => x.key === "ft3")?.value).toBeCloseTo(ft3, 8);
    expect(r.rows.find(x => x.key === "bags")?.value).toBe(bags);
    expect(r.rows.find(x => x.key === "cost")?.value).toBeCloseTo(bags * 5, 8);
  });

  it("Foundation Wall deducts opening area × thickness and reports two-face forms", () => {
    const r = run("foundation-wall-calculator", {
      length: 80, height: 8, thickness: 8, openings: 20, quantity: 1, waste: 0,
    }, { length: "ft", height: "ft", thickness: "in" });
    expect(r.rows.find(x => x.key === "ft3")?.value).toBeCloseTo(80 * 8 * (8 / 12) - 20 * (8 / 12), 8);
    expect(r.rows.find(x => x.key === "forms")?.value).toBeCloseTo(80 * 8 * 2, 8);
  });

  it("Basement Wall derives perimeter from footprint and adds extra wall run", () => {
    const r = run("basement-wall-calculator", {
      length: 30, width: 20, height: 8, thickness: 8, openings: 20, extraWall: 10, waste: 0,
    }, { length: "ft", width: "ft", height: "ft", thickness: "in", extraWall: "ft" });
    expect(r.rows.find(x => x.key === "perimeter")?.value).toBeCloseTo(110, 8);
    expect(r.rows.find(x => x.key === "ft3")?.value).toBeCloseTo(110 * 8 * (8 / 12) - 20 * (8 / 12), 8);
  });

  it("Crawl Space derives perimeter, adds interior stem wall and deducts vents", () => {
    const r = run("crawl-space-calculator", {
      length: 30, width: 20, wallHeight: 3, thickness: 8, interiorWall: 20, openings: 8, waste: 0,
    }, { length: "ft", width: "ft", wallHeight: "ft", thickness: "in", interiorWall: "ft" });
    expect(r.rows.find(x => x.key === "perimeter")?.value).toBeCloseTo(100, 8);
    expect(r.rows.find(x => x.key === "wallRun")?.value).toBeCloseTo(120, 8);
    expect(r.rows.find(x => x.key === "ft3")?.value).toBeCloseTo(120 * 3 * (8 / 12) - 8 * (8 / 12), 8);
  });
});
