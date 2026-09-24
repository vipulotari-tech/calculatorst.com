import { describe, it, expect } from "vitest";
import { getModelForSlug } from "../calculator-registry.ts";
import { readInputs } from "../calculator-math.ts";
import { hubCalculators } from "../../data/hubCalculators.ts";
import { calculators } from "../../data/calculators.ts";

describe("Complete 204 Calculator Logic Audit", () => {
  const allSlugs = Array.from(new Set([...calculators.map(c => c.slug), ...hubCalculators.map(c => c.slug)]));

  it("should have exactly 204 unique calculator slugs", () => {
    expect(allSlugs.length).toBe(204);
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
