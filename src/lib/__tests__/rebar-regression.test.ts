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

function value(slug: string, key: string, overrides: Record<string, number> = {}, units: Record<string, string> = {}) {
  const r = run(slug, overrides, units).rows.find((x) => x.key === key);
  if (!r) throw new Error(`Missing ${key} for ${slug}`);
  return r.value;
}

describe("Rebar & Reinforcement golden-value regression suite", () => {
  it("Rebar Calculator matches a 20 × 10 ft grid with 2 in edge offset and 16 in max spacing", () => {
    const r = run("rebar-calculator", {
      length: 20, width: 10, cover: 2, spacing: 16, size: 4,
      stockLength: 20, waste: 10, price: 10,
    }, { length: "ft", width: "ft", cover: "in", spacing: "in", stockLength: "ft", price: "USD/unit" });
    expect(r.rows.find(x => x.key === "acrossL")?.value).toBe(16);
    expect(r.rows.find(x => x.key === "acrossW")?.value).toBe(9);
    expect(r.rows.find(x => x.key === "netLength")?.value).toBeCloseTo(331.666666667, 7);
    expect(r.rows.find(x => x.key === "actualL")?.value).toBeCloseTo(15.733333333, 7);
    expect(r.rows.find(x => x.key === "actualW")?.value).toBeCloseTo(14.5, 8);
    expect(r.rows.find(x => x.key === "stockPieces")?.value).toBe(19);
    expect(r.rows.find(x => x.key === "weight")?.value).toBeCloseTo(364.833333333 * 0.668, 7);
    expect(r.rows.find(x => x.key === "cost")?.value).toBeCloseTo(190, 8);
  });

  it("Rebar Weight uses published nominal size weight and allowance", () => {
    const r = run("rebar-weight-calculator", {
      quantity: 16, length: 20, size: 4, waste: 10,
    }, { length: "ft" });
    expect(r.rows.find(x => x.key === "lbPerFt")?.value).toBeCloseTo(0.668, 10);
    expect(r.rows.find(x => x.key === "diameter")?.value).toBeCloseTo(0.5, 10);
    expect(r.rows.find(x => x.key === "netLength")?.value).toBeCloseTo(320, 8);
    expect(r.rows.find(x => x.key === "netWeight")?.value).toBeCloseTo(320 * 0.668, 8);
    expect(r.rows.find(x => x.key === "orderWeight")?.value).toBeCloseTo(352 * 0.668, 8);
  });

  it("Rebar Quantity converts a grid takeoff to equivalent stock bars", () => {
    const r = run("rebar-quantity-calculator", {
      length: 20, width: 10, cover: 2, spacing: 16, stockLength: 20, size: 4, waste: 10,
    }, { length: "ft", width: "ft", cover: "in", spacing: "in", stockLength: "ft" });
    expect(r.rows.find(x => x.key === "installed")?.value).toBe(25);
    expect(r.rows.find(x => x.key === "pieces")?.value).toBe(19);
    expect(r.rows.find(x => x.key === "netLength")?.value).toBeCloseTo(331.666666667, 7);
    expect(r.rows.find(x => x.key === "weight")?.value).toBeCloseTo(364.833333333 * 0.668, 7);
  });

  it("Rebar Cost respects per-stock-bar pricing, tax and delivery", () => {
    const r = run("rebar-cost-calculator", {
      mode: 0, quantity: 16, length: 20, totalLength: 1, size: 4,
      stockLength: 20, waste: 10, price: 15, tax: 10, delivery: 100,
    }, { length: "ft", totalLength: "ft", stockLength: "ft", price: "USD/unit" });
    expect(r.rows.find(x => x.key === "netLength")?.value).toBeCloseTo(320, 8);
    expect(r.rows.find(x => x.key === "orderLength")?.value).toBeCloseTo(352, 8);
    expect(r.rows.find(x => x.key === "stockPieces")?.value).toBe(18);
    expect(r.rows.find(x => x.key === "materials")?.value).toBeCloseTo(270, 8);
    expect(r.rows.find(x => x.key === "total")?.value).toBeCloseTo(397, 8);
  });

  it("Rebar Spacing solves both equal spacing and bar count from a maximum", () => {
    expect(value("rebar-spacing-calculator", "spacing", {
      mode: 0, length: 20, cover: 2, quantity: 16, spacing: 16,
    }, { length: "ft", cover: "in", spacing: "in" })).toBeCloseTo(15.733333333, 7);

    const maxMode = run("rebar-spacing-calculator", {
      mode: 1, length: 20, cover: 2, quantity: 16, spacing: 16,
    }, { length: "ft", cover: "in", spacing: "in" });
    expect(maxMode.rows.find(x => x.key === "bars")?.value).toBe(16);
    expect(maxMode.rows.find(x => x.key === "spacing")?.value).toBeCloseTo(15.733333333, 7);
  });

  it("Rebar Length reports net/order footage and equivalent stock bars", () => {
    const r = run("rebar-length-calculator", {
      quantity: 16, length: 20, stockLength: 20, waste: 10,
    }, { length: "ft", stockLength: "ft" });
    expect(r.rows.find(x => x.key === "net")?.value).toBeCloseTo(320, 8);
    expect(r.rows.find(x => x.key === "order")?.value).toBeCloseTo(352, 8);
    expect(r.rows.find(x => x.key === "pieces")?.value).toBe(18);
    expect(r.rows.find(x => x.key === "stockPurchased")?.value).toBeCloseTo(360, 8);
  });

  it("Rebar Grid focuses on exact grid dimensions, counts and equalized spacing", () => {
    const r = run("rebar-grid-calculator", {
      length: 20, width: 10, cover: 2, spacing: 16, waste: 10,
    }, { length: "ft", width: "ft", cover: "in", spacing: "in" });
    expect(r.rows.find(x => x.key === "gridL")?.value).toBeCloseTo(19.666666667, 7);
    expect(r.rows.find(x => x.key === "gridW")?.value).toBeCloseTo(9.666666667, 7);
    expect(r.rows.find(x => x.key === "bars")?.value).toBe(25);
    expect(r.rows.find(x => x.key === "actualL")?.value).toBeCloseTo(15.733333333, 7);
    expect(r.rows.find(x => x.key === "actualW")?.value).toBeCloseTo(14.5, 8);
  });

  it("Rebar Lap totals only the specified additional lap steel and its weight", () => {
    const r = run("rebar-lap-length-calculator", {
      lap: 24, quantity: 10, size: 4, waste: 10, price: 1,
    }, { lap: "in", price: "USD/ft" });
    expect(r.rows.find(x => x.key === "net")?.value).toBeCloseTo(20, 8);
    expect(r.rows.find(x => x.key === "order")?.value).toBeCloseTo(22, 8);
    expect(r.rows.find(x => x.key === "weight")?.value).toBeCloseTo(22 * 0.668, 8);
    expect(r.rows.find(x => x.key === "cost")?.value).toBeCloseTo(22, 8);
  });

  it("Reinforcement Mesh automatically chooses the lower-sheet 90-degree orientation", () => {
    const r = run("reinforcement-mesh-calculator", {
      length: 20, width: 10, sheetLength: 10, sheetWidth: 5, lap: 6, waste: 10, price: 30,
    }, { length: "ft", width: "ft", sheetLength: "ft", sheetWidth: "ft", lap: "in", price: "USD/unit" });
    expect(r.rows.find(x => x.key === "installed")?.value).toBe(5);
    expect(r.rows.find(x => x.key === "order")?.value).toBe(6);
    expect(r.rows.find(x => x.key === "rows")?.value).toBe(1);
    expect(r.rows.find(x => x.key === "columns")?.value).toBe(5);
    expect(r.rows.find(x => x.key === "sheetAlongL")?.value).toBeCloseTo(5, 8);
    expect(r.rows.find(x => x.key === "sheetAlongW")?.value).toBeCloseTo(10, 8);
    expect(r.rows.find(x => x.key === "cost")?.value).toBeCloseTo(180, 8);
  });

  it("Rebar Chair grid rounds support counts up by each maximum spacing", () => {
    const r = run("rebar-chair-calculator", {
      length: 20, width: 10, edgeOffset: 0, spacingL: 4, spacingW: 4, waste: 10, price: 2,
    }, { length: "ft", width: "ft", edgeOffset: "in", spacingL: "ft", spacingW: "ft", price: "USD/unit" });
    expect(r.rows.find(x => x.key === "installed")?.value).toBe(24);
    expect(r.rows.find(x => x.key === "order")?.value).toBe(27);
    expect(r.rows.find(x => x.key === "actualL")?.value).toBeCloseTo(4, 8);
    expect(r.rows.find(x => x.key === "actualW")?.value).toBeCloseTo(10 / 3, 8);
    expect(r.rows.find(x => x.key === "cost")?.value).toBeCloseTo(54, 8);
  });
});
