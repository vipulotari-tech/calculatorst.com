import { describe, it, expect } from "vitest";
import { getModelForSlug } from "../calculator-registry.ts";
import { readInputs } from "../calculator-math.ts";
import { constructionCalculatorCount, constructionCategoryCounts, hubCalculators, hubCategories } from "../../data/hubCalculators.ts";
import { getCalculatorContent } from "../calculator-content.ts";
import { calculators } from "../../data/calculators.ts";

describe("Complete 204 Calculator Logic Audit", () => {
  const allSlugs = Array.from(new Set([...calculators.map(c => c.slug), ...hubCalculators.map(c => c.slug)]));

  it("should have exactly 204 unique calculator slugs", () => {
    expect(allSlugs.length).toBe(204);
  });

  it("should derive construction inventory counts from the canonical calculator list", () => {
    expect(constructionCalculatorCount).toBe(hubCalculators.length);
    expect(constructionCalculatorCount).toBe(204);
    expect(hubCategories.reduce((sum, category) => sum + category.count, 0)).toBe(constructionCalculatorCount);
    expect(constructionCategoryCounts.concrete).toBe(
      hubCalculators.filter((calculator) => calculator.cluster === "concrete").length,
    );
    expect(constructionCategoryCounts.mortar).toBe(
      hubCalculators.filter((calculator) => calculator.cluster === "mortar").length,
    );
  });

  it("should keep worked examples human-readable and free of internal enum values", () => {
    const concrete = getModelForSlug("concrete-calculator");
    const content = getCalculatorContent("Concrete Calculator", concrete);
    expect(content.inputs).toContain("Project type: Rectangular slab");
    expect(content.inputs).not.toContain("Project type: 0");
    expect(content.description).not.toMatch(/plus \d+ more/i);
  });

  it("should keep the concrete worked example limited to the active slab inputs", () => {
    const concrete = getModelForSlug("concrete-calculator");
    const content = getCalculatorContent("Concrete Calculator", concrete);
    expect(content.inputs).toContain("Project type: Rectangular slab");
    expect(content.inputs.some(input => input.startsWith("Length:"))).toBe(true);
    expect(content.inputs.some(input => input.startsWith("Width:"))).toBe(true);
    expect(content.inputs.some(input => input.startsWith("Slab thickness / footing depth:"))).toBe(true);
    expect(content.inputs.some(input => input.startsWith("Wall thickness:"))).toBe(false);
    expect(content.inputs.some(input => input.startsWith("Cylinder / column diameter:"))).toBe(false);
    expect(content.inputs.some(input => input.startsWith("Wall / cylinder height:"))).toBe(false);
  });

  it("should calculate concrete slab, wall and cylinder geometry independently", () => {
    const concrete = getModelForSlug("concrete-calculator");
    const units = {
      length: "ft", width: "ft", depth: "in", thickness: "in",
      diameter: "in", height: "ft", density: "lb/ft3", yield: "ft3", price: "USD/yd3",
    };
    const common = {
      length: 12, width: 8, depth: 5, thickness: 8, diameter: 24, height: 8,
      quantity: 1, waste: 0, density: 150, yield: 0.6,
    };

    const slab = concrete.calculate(readInputs(concrete.fields, { ...common, shape: 0 }, units), units);
    expect(slab.rows.find(r => r.key === "net")?.value).toBeCloseTo((12 * 8 * (5 / 12)) / 27, 8);

    const wall = concrete.calculate(readInputs(concrete.fields, { ...common, shape: 2, length: 30, height: 8, thickness: 8 }, units), units);
    expect(wall.rows.find(r => r.key === "net")?.value).toBeCloseTo((30 * 8 * (8 / 12)) / 27, 8);

    const cylinder = concrete.calculate(readInputs(concrete.fields, { ...common, shape: 3, diameter: 24, height: 10, quantity: 3 }, units), units);
    expect(cylinder.rows.find(r => r.key === "net")?.value).toBeCloseTo((Math.PI * 1 * 1 * 10 * 3) / 27, 8);
  });

  it("should reject zero dimensions used by the active concrete shape", () => {
    const concrete = getModelForSlug("concrete-calculator");
    const units = {
      length: "ft", width: "ft", depth: "in", thickness: "in",
      diameter: "in", height: "ft", density: "lb/ft3", yield: "ft3",
    };
    const raw = {
      shape: 3, length: 12, width: 8, depth: 5, thickness: 8,
      diameter: 0, height: 10, quantity: 1, waste: 10, density: 150, yield: 0.6,
    };
    expect(() => concrete.calculate(readInputs(concrete.fields, raw, units), units))
      .toThrow(/greater than zero/i);
  });

  for (const slug of allSlugs) {
    it(`should successfully compute valid results for ${slug}`, () => {
      const model = getModelForSlug(slug);
      expect(model).toBeDefined();
      expect(model.fields.length).toBeGreaterThan(0);

      // Build default inputs from the field definitions
      const rawInputs: Record<string, number> = {};
      const unitInputs: Record<string, string> = {};

      for (const field of model.fields) {
        if (field.value !== undefined) {
          rawInputs[field.id] = field.value;
        } else if (!field.optional) {
          // Provide a valid non-zero default if undefined
          rawInputs[field.id] = field.min !== undefined && field.min > 0 ? field.min : 10;
        }
        if (field.unit) {
          unitInputs[field.id] = field.unit;
        }
      }

      // Read & parse inputs with dimensional conversion
      const parsedValues = readInputs(model.fields, rawInputs, unitInputs);
      expect(parsedValues).toBeDefined();

      // Execute calculation
      const res = model.calculate(parsedValues, unitInputs);
      expect(res).toBeDefined();
      expect(res.rows.length).toBeGreaterThan(0);
      expect(res.steps.length).toBeGreaterThan(0);

      // Verify all result numbers are finite and valid
      for (const row of res.rows) {
        expect(Number.isFinite(row.value)).toBe(true);
        expect(Number.isNaN(row.value)).toBe(false);
      }
    });
  }


  it("should solve roof pitch accurately in forward and reverse modes", () => {
    const roofPitch = getModelForSlug("roof-pitch-calculator");
    const units = {
      rise: "ft",
      run: "ft",
      referenceRun: "ft",
      rafterLength: "ft",
    };

    const forwardValues = readInputs(roofPitch.fields, {
      mode: 0,
      rise: 6,
      run: 12,
      angleInput: 26.565,
      pitchInput: 6,
      rafterLength: 13.416,
    }, units);
    const forward = roofPitch.calculate(forwardValues, units);
    expect(forward.rows.find(r => r.key === "pitch")?.value).toBeCloseTo(6, 8);
    expect(forward.rows.find(r => r.key === "angle")?.value).toBeCloseTo(26.565051, 5);
    expect(forward.rows.find(r => r.key === "percent")?.value).toBeCloseTo(50, 8);
    expect(forward.rows.find(r => r.key === "rafter")?.value).toBeCloseTo(Math.hypot(12, 6), 6);

    const angleValues = readInputs(roofPitch.fields, {
      mode: 1,
      rise: 6,
      run: 12,
      angleInput: 45,
      pitchInput: 6,
      referenceRun: 10,
      rafterLength: 13.416,
    }, units);
    const angle = roofPitch.calculate(angleValues, units);
    expect(angle.rows.find(r => r.key === "pitch")?.value).toBeCloseTo(12, 8);
    expect(angle.rows.find(r => r.key === "rafter")?.value).toBeCloseTo(Math.sqrt(200), 6);

    const pitchValues = readInputs(roofPitch.fields, {
      mode: 2,
      rise: 6,
      run: 12,
      angleInput: 26.565,
      pitchInput: 8,
      referenceRun: 12,
      rafterLength: 13.416,
    }, units);
    const pitch = roofPitch.calculate(pitchValues, units);
    expect(pitch.rows.find(r => r.key === "percent")?.value).toBeCloseTo(66.6666667, 5);
    expect(pitch.rows.find(r => r.key === "riseDerived")?.value).toBeCloseTo(8, 6);

    const reverseValues = readInputs(roofPitch.fields, {
      mode: 3,
      rise: 6,
      run: 12,
      angleInput: 26.565,
      pitchInput: 6,
      rafterLength: Math.hypot(12, 6),
    }, units);
    const reverse = roofPitch.calculate(reverseValues, units);
    expect(reverse.rows.find(r => r.key === "pitch")?.value).toBeCloseTo(6, 6);
    expect(reverse.rows.find(r => r.key === "riseDerived")?.value).toBeCloseTo(6, 6);
  });

  it("should reject impossible reverse roof geometry", () => {
    const roofPitch = getModelForSlug("roof-pitch-calculator");
    const units = { rise: "ft", run: "ft", referenceRun: "ft", rafterLength: "ft" };
    const values = readInputs(roofPitch.fields, {
      mode: 3,
      rise: 6,
      run: 12,
      angleInput: 26.565,
      pitchInput: 6,
      rafterLength: 10,
    }, units);
    expect(() => roofPitch.calculate(values, units)).toThrow(/Rafter length must be at least as long as the horizontal run/);
  });

  it("should correctly handle specialty calculators that previously had bugs", () => {
    // 1. Slab reinforcement: must produce bars / length / weight, NOT concrete volume
    const slabRebar = getModelForSlug("slab-reinforcement-calculator");
    const rebarInputs = readInputs(slabRebar.fields, { length: 20, width: 10, cover: 2, spacing: 16, size: 4, waste: 10 }, { cover: 'in', spacing: 'in' });
    const rebarRes = slabRebar.calculate(rebarInputs, {});
    expect(rebarRes.rows.some(r => r.unit === 'bars')).toBe(true);
    expect(rebarRes.rows.some(r => r.unit === 'lb')).toBe(true);

    // 2. Concrete stairs: solid volume must use n*(n+1)/2 summation
    const stairs = getModelForSlug("concrete-stair-calculator");
    const stairInputs = readInputs(stairs.fields, { stairModel: 0, width: 4, rise: 7, run: 11, steps: 4, waistThickness: 6, landingLength: 0, landingWidth: 4, landingThickness: 0, waste: 10, density: 150, yield: 0.6 }, { width: 'ft', rise: 'in', run: 'in' });
    const stairRes = stairs.calculate(stairInputs, {});
    // 4 steps solid: sum(1..4) = 10 blocks of width*rise*run
    // 4 * (7/12) * (11/12) * 10 = 21.3888 ft3 = 0.792 yd3
    const netYd = stairRes.rows.find(r => r.key === 'net')?.value;
    expect(netYd).toBeCloseTo(0.792, 2);

    // 3. Header size: must calculate section modulus S, not raw piece count
    const header = getModelForSlug("header-size-calculator");
    const headerInputs = readInputs(header.fields, { span: 6, load: 300, allowable: 1000, breadth: 3 }, { breadth: 'in' });
    const headerRes = header.calculate(headerInputs, {});
    expect(headerRes.rows.some(r => r.key === 'section')).toBe(true);
    expect(headerRes.rows.some(r => r.key === 'depth')).toBe(true);

    // 4. Ceiling joist: spacing is in inches, not feet
    const ceiling = getModelForSlug("ceiling-joist-calculator");
    const ceilingInputs = readInputs(ceiling.fields, { length: 20, spacing: 16, extra: 0, waste: 10 }, { spacing: 'in' });
    const ceilingRes = ceiling.calculate(ceilingInputs, {});
    // 20 ft with 16 in spacing -> ceil(20 / 1.333) + 1 = 16 pieces
    const installed = ceilingRes.rows.find(r => r.key === 'installed')?.value;
    expect(installed).toBe(16);
  });
});
