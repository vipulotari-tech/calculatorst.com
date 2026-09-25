import { describe, expect, it } from "vitest";
import { getCalculatorContent } from "../calculator-content.ts";
import { getModelForSlug } from "../calculator-registry.ts";
import { InputError, readInputs } from "../calculator-math.ts";

const slug = "concrete-footing-calculator";

function run(
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
  return model.calculate(readInputs(model.fields, raw, units), units);
}

function value(
  key: string,
  overrides: Record<string, number> = {},
  units: Record<string, string> = {},
) {
  const result = run(overrides, units);
  const found = result.rows.find((row) => row.key === key);
  if (!found) throw new Error(`Missing result row ${key}`);
  return found.value;
}

describe("Concrete Footing Calculator golden values", () => {
  it("renders the worked-example footing type as a label and hides inactive geometry", () => {
    const model = getModelForSlug(slug);
    const content = getCalculatorContent("Concrete Footing Calculator", model);
    expect(content.inputs).toContain("Footing type: Strip / continuous");
    expect(content.inputs.some((input) => input.includes("Side width (square pad)"))).toBe(false);
    expect(content.inputs.some((input) => input.includes("Pad length (rectangular)"))).toBe(false);
    expect(content.inputs.some((input) => input.includes("Diameter (round)"))).toBe(false);
  });

  it("strip footing: 20 ft × 12 in × 12 in × 2 = 40 ft³", () => {
    expect(value("ft3", {
      footingShape: 0,
      length: 20,
      width: 12,
      depth: 12,
      quantity: 2,
      waste: 0,
    }, {
      length: "ft",
      width: "in",
      depth: "in",
    })).toBeCloseTo(40, 8);
  });

  it("square pads: 24 in × 24 in × 12 in × 4 = 16 ft³", () => {
    expect(value("ft3", {
      footingShape: 1,
      sideWidth: 24,
      depth: 12,
      quantity: 4,
      waste: 0,
    }, {
      sideWidth: "in",
      depth: "in",
    })).toBeCloseTo(16, 8);
  });

  it("rectangular pads: 30 in × 24 in × 12 in × 4 = 20 ft³", () => {
    expect(value("ft3", {
      footingShape: 2,
      padLength: 30,
      padWidth: 24,
      depth: 12,
      quantity: 4,
      waste: 0,
    }, {
      padLength: "in",
      padWidth: "in",
      depth: "in",
    })).toBeCloseTo(20, 8);
  });

  it("round footings: 24 in diameter × 12 in deep × 3 = 3π ft³", () => {
    expect(value("ft3", {
      footingShape: 3,
      diameter: 24,
      depth: 12,
      quantity: 3,
      waste: 0,
    }, {
      diameter: "in",
      depth: "in",
    })).toBeCloseTo(3 * Math.PI, 8);
  });

  it("normalizes mixed metric units exactly once", () => {
    const expectedM3 = 1 * 0.6 * 0.3 * 2;
    const expectedFt3 = expectedM3 / (0.3048 ** 3);
    expect(value("ft3", {
      footingShape: 2,
      padLength: 1,
      padWidth: 600,
      depth: 30,
      quantity: 2,
      waste: 0,
    }, {
      padLength: "m",
      padWidth: "mm",
      depth: "cm",
    })).toBeCloseTo(expectedFt3, 8);
  });

  it("applies allowance once and rounds only discrete bag quantities", () => {
    const result = run({
      footingShape: 0,
      length: 20,
      width: 12,
      depth: 12,
      quantity: 1,
      waste: 10,
      yield: 0.6,
    }, {
      length: "ft",
      width: "in",
      depth: "in",
      yield: "ft3",
    });

    expect(result.rows.find((row) => row.key === "net")?.value).toBeCloseTo(20 / 27, 8);
    expect(result.rows.find((row) => row.key === "ft3")?.value).toBeCloseTo(22, 8);
    expect(result.rows.find((row) => row.key === "order")?.value).toBeCloseTo(22 / 27, 8);
    expect(result.rows.find((row) => row.key === "bags")?.value).toBe(37);
  });

  it.each([
    [1, { sideWidth: 0 }, "sideWidth"],
    [2, { padLength: 0 }, "padLength"],
    [2, { padWidth: 0 }, "padWidth"],
    [3, { diameter: 0 }, "diameter"],
  ] as const)("rejects zero active geometry for footing type %s", (footingShape, overrides, field) => {
    try {
      run({ footingShape, ...overrides });
      throw new Error("Expected active geometry validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(InputError);
      expect((error as InputError).field).toBe(field);
    }
  });
});
