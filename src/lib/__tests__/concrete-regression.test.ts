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

function value(slug: string, key: string, overrides: Record<string, number> = {}, units: Record<string, string> = {}) {
  const row = run(slug, overrides, units).rows.find(r => r.key === key);
  if (!row) throw new Error(`Missing result row ${key} for ${slug}`);
  return row.value;
}

describe("Concrete category golden-value regression suite", () => {
  it("Concrete Calculator: 12 in × 8 ft cylinder = 2π ft³", () => {
    expect(value(
      "concrete-calculator",
      "ft3",
      { shape: 3, diameter: 12, height: 8, quantity: 1, waste: 0 },
      { diameter: "in", height: "ft" },
    )).toBeCloseTo(2 * Math.PI, 6);
  });

  it("Concrete Volume: cylinder, hollow tube, curb, solid stair+landing and wedge use normalized units once", () => {
    expect(value(
      "concrete-volume-calculator", "ft3",
      { shape: 1, diameter: 12, height: 8, quantity: 1, waste: 0 },
      { diameter: "in", height: "ft" },
    )).toBeCloseTo(2 * Math.PI, 6);

    expect(value(
      "concrete-volume-calculator", "ft3",
      { shape: 2, diameter: 12, innerDiameter: 8, height: 8, quantity: 1, waste: 0 },
      { diameter: "in", innerDiameter: "in", height: "ft" },
    )).toBeCloseTo(3.490658504, 6);

    expect(value(
      "concrete-volume-calculator", "ft3",
      { shape: 3, length: 20, curbWidth: 6, curbHeight: 12, gutterWidth: 18, gutterDepth: 6, waste: 0 },
      { length: "ft", curbWidth: "in", curbHeight: "in", gutterWidth: "in", gutterDepth: "in" },
    )).toBeCloseTo(25, 6);

    expect(value(
      "concrete-volume-calculator", "ft3",
      { shape: 4, stairWidth: 4, rise: 7, run: 11, steps: 4, landing: 2, waste: 0 },
      { stairWidth: "ft", rise: "in", run: "in", landing: "ft" },
    )).toBeCloseTo(40.055555556, 6);

    expect(value(
      "concrete-volume-calculator", "ft3",
      { shape: 5, base: 12, triHeight: 6, wedgeLength: 10, waste: 0 },
      { base: "in", triHeight: "in", wedgeLength: "ft" },
    )).toBeCloseTo(2.5, 6);
  });

  it("Concrete Weight: 1 yd³ at 150 lb/ft³ = 4,050 lb = 1.83705 metric tonnes", () => {
    expect(value(
      "concrete-weight-calculator", "netWeight",
      { volume: 1, density: 150, waste: 0 },
      { volume: "yd3", density: "lb/ft3" },
    )).toBeCloseTo(4050, 6);
    expect(value(
      "concrete-weight-calculator", "netTonnes",
      { volume: 1, density: 150, waste: 0 },
      { volume: "yd3", density: "lb/ft3" },
    )).toBeCloseTo(1.8370490985, 6);
  });

  it("Concrete Weight: supports volume, area-depth, dimensions, presets and primary units", () => {
    expect(value(
      "concrete-weight-calculator", "primaryWeight",
      { weightMode: 0, volume: 1, densityBasis: 0, density: 150, outputUnit: 0, waste: 0 },
      { volume: "yd3", density: "lb/ft3" },
    )).toBeCloseTo(4050, 6);

    expect(value(
      "concrete-weight-calculator", "netWeight",
      { weightMode: 3, area: 100, areaThickness: 4, quantity: 1, densityBasis: 0, density: 150, waste: 0 },
      { area: "ft2", areaThickness: "in", density: "lb/ft3" },
    )).toBeCloseTo(5000, 6);

    expect(value(
      "concrete-weight-calculator", "netWeight",
      { weightMode: 1, length: 10, width: 10, depth: 6, quantity: 1, densityBasis: 0, density: 150, waste: 0 },
      { length: "ft", width: "ft", depth: "in", density: "lb/ft3" },
    )).toBeCloseTo(7500, 6);

    expect(value(
      "concrete-weight-calculator", "netWeight",
      { weightMode: 0, volume: 1, densityBasis: 2, density: 999, waste: 0 },
      { volume: "yd3", density: "lb/ft3" },
    )).toBeCloseTo(3105, 6);

    expect(value(
      "concrete-weight-calculator", "primaryWeight",
      { weightMode: 0, volume: 1, densityBasis: 2, outputUnit: 3, waste: 0 },
      { volume: "yd3" },
    )).toBeCloseTo(1.40840430885, 8);
  });

  it("Concrete Weight: metric density and liter conversions are dimensionally correct", () => {
    const imperial = run(
      "concrete-weight-calculator",
      { weightMode: 0, volume: 1, densityBasis: 0, density: 150, outputUnit: 1, waste: 0 },
      { volume: "yd3", density: "lb/ft3" },
    );
    expect(imperial.rows.find(x => x.key === "densityMetric")?.value).toBeCloseTo(2402.769506094, 6);
    expect(imperial.rows.find(x => x.key === "netL")?.value).toBeCloseTo(764.554858, 5);
    expect(imperial.rows.find(x => x.key === "primaryWeight")?.value).toBeCloseTo(1837.0490985, 5);

    const metric = run(
      "concrete-weight-calculator",
      { weightMode: 0, volume: 1, densityBasis: 0, density: 2400, outputUnit: 1, waste: 0 },
      { volume: "m3", density: "kg/m3" },
    );
    expect(metric.rows.find(x => x.key === "primaryWeight")?.value).toBeCloseTo(2400, 5);
    expect(metric.rows.find(x => x.key === "densityMetric")?.value).toBeCloseTo(2400, 5);
    expect(metric.rows.find(x => x.key === "netL")?.value).toBeCloseTo(1000, 5);
  });

  it("Concrete Weight: extra material allowance is separate from measured weight", () => {
    const r = run(
      "concrete-weight-calculator",
      { weightMode: 0, volume: 1, densityBasis: 1, outputUnit: 0, waste: 10 },
      { volume: "yd3" },
    );
    expect(r.rows.find(x => x.key === "netWeight")?.value).toBeCloseTo(4050, 6);
    expect(r.rows.find(x => x.key === "orderWeight")?.value).toBeCloseTo(4455, 6);
    expect(r.rows.find(x => x.key === "primaryWeight")?.value).toBeCloseTo(4050, 6);
  });

  it("Concrete Cost: bag price uses rounded whole-bag quantity before pricing", () => {
    const r = run(
      "concrete-cost-calculator",
      { costMode: 0, length: 10, width: 10, depth: 12, quantity: 1, waste: 0, yield: 0.6, density: 150, price: 5, delivery: 0, shortLoadFee: 0, pumpFee: 0, reinforcement: 0, formwork: 0, finishing: 0, tax: 0 },
      { length: "ft", width: "ft", depth: "in", yield: "ft3", density: "lb/ft3", price: "USD/bag" },
    );
    expect(r.rows.find(x => x.key === "bags80")?.value).toBe(167);
    expect(r.rows.find(x => x.key === "pricedQuantity")?.value).toBe(167);
    expect(r.rows.find(x => x.key === "materials")?.value).toBeCloseTo(835, 6);
    expect(r.rows.find(x => x.key === "primaryCost")?.value).toBeCloseTo(835, 6);
  });

  it("Concrete Cost: total keeps material tax and quoted project charges explicit", () => {
    const r = run(
      "concrete-cost-calculator",
      {
        costMode: 0, length: 10, width: 10, depth: 6, quantity: 1,
        waste: 10, yield: 0.6, density: 150, price: 160,
        delivery: 150, shortLoadFee: 75, pumpFee: 0,
        reinforcement: 200, formwork: 100, finishing: 400, tax: 8,
      },
      { length: "ft", width: "ft", depth: "in", yield: "ft3", density: "lb/ft3", price: "USD/yd3" },
    );
    expect(r.rows[0].key).toBe("primaryCost");
    expect(r.rows.find(x => x.key === "order")?.value).toBeCloseTo(55 / 27, 8);
    expect(r.rows.find(x => x.key === "materials")?.value).toBeCloseTo(325.925925926, 8);
    expect(r.rows.find(x => x.key === "tax")?.value).toBeCloseTo(26.074074074, 8);
    expect(r.rows.find(x => x.key === "projectCharges")?.value).toBeCloseTo(925, 8);
    expect(r.rows.find(x => x.key === "primaryCost")?.value).toBeCloseTo(1277, 8);
    expect(r.rows.find(x => x.key === "costPerSqFt")?.value).toBeCloseTo(12.77, 8);
  });

  it("Concrete Cost: all four geometry modes normalize to the expected volume", () => {
    const common = {
      waste: 0, yield: 0.6, density: 150, price: 100,
      delivery: 0, shortLoadFee: 0, pumpFee: 0,
      reinforcement: 0, formwork: 0, finishing: 0, tax: 0,
    };

    const rectangular = run(
      "concrete-cost-calculator",
      { ...common, costMode: 0, length: 10, width: 10, depth: 6, quantity: 1 },
      { length: "ft", width: "ft", depth: "in", yield: "ft3", density: "lb/ft3", price: "USD/yd3" },
    );
    expect(rectangular.rows.find(x => x.key === "ft3")?.value).toBeCloseTo(50, 8);

    const known = run(
      "concrete-cost-calculator",
      { ...common, costMode: 1, volume: 2 },
      { volume: "yd3", yield: "ft3", density: "lb/ft3", price: "USD/yd3" },
    );
    expect(known.rows.find(x => x.key === "ft3")?.value).toBeCloseTo(54, 8);
    expect(known.rows.find(x => x.key === "costPerSqFt")).toBeUndefined();

    const areaDepth = run(
      "concrete-cost-calculator",
      { ...common, costMode: 2, area: 100, areaThickness: 4, quantity: 1 },
      { area: "ft2", areaThickness: "in", yield: "ft3", density: "lb/ft3", price: "USD/yd3" },
    );
    expect(areaDepth.rows.find(x => x.key === "ft3")?.value).toBeCloseTo(100 / 3, 8);

    const round = run(
      "concrete-cost-calculator",
      { ...common, costMode: 3, diameter: 24, height: 10, quantity: 3 },
      { diameter: "in", height: "ft", yield: "ft3", density: "lb/ft3", price: "USD/yd3" },
    );
    expect(round.rows.find(x => x.key === "ft3")?.value).toBeCloseTo(30 * Math.PI, 8);
  });

  it("Concrete Cost: metric volume and metric price basis remain dimensionally correct", () => {
    const r = run(
      "concrete-cost-calculator",
      {
        costMode: 1, volume: 1, waste: 0, yield: 0.017, density: 2400, price: 200,
        delivery: 0, shortLoadFee: 0, pumpFee: 0,
        reinforcement: 0, formwork: 0, finishing: 0, tax: 0,
      },
      { volume: "m3", yield: "m3", density: "kg/m3", price: "USD/m3" },
    );
    expect(r.rows.find(x => x.key === "m3")?.value).toBeCloseTo(1, 8);
    expect(r.rows.find(x => x.key === "pricedQuantity")?.value).toBeCloseTo(1, 8);
    expect(r.rows.find(x => x.key === "primaryCost")?.value).toBeCloseTo(200, 8);
  });

  it("Concrete Mix: 1 m³, 1:2:3, dry factor 1.54 gives the expected material takeoff", () => {
    const r = run(
      "concrete-mix-calculator",
      {
        mixInputMode: 0, volume: 1, mixPreset: 1,
        dryFactor: 1.54, cementDensity: 1440, sandDensity: 1600, aggregateDensity: 1500,
        bagMass: 50, waterRatio: 0.5, waste: 0,
      },
      { volume: "m3" },
    );
    expect(r.rows[0].key).toBe("cementBags");
    expect(r.rows.find(x => x.key === "cementVol")?.value).toBeCloseTo(1.54 / 6, 6);
    expect(r.rows.find(x => x.key === "cementMass")?.value).toBeCloseTo(369.6, 5);
    expect(r.rows.find(x => x.key === "cementBags")?.value).toBe(8);
    expect(r.rows.find(x => x.key === "sandMass")?.value).toBeCloseTo(821.333333333, 5);
    expect(r.rows.find(x => x.key === "aggregateMass")?.value).toBeCloseTo(1155, 5);
    expect(r.rows.find(x => x.key === "waterVol")?.value).toBeCloseTo(184.8, 5);
    expect(r.rows.find(x => x.key === "waterGal")?.value).toBeCloseTo(48.818995276, 6);
  });

  it("Concrete Mix: dimensions mode and editable bulk densities stay dimensionally correct", () => {
    const r = run(
      "concrete-mix-calculator",
      {
        mixInputMode: 1, mixLength: 10, mixWidth: 10, mixDepth: 4, mixQuantity: 1,
        mixPreset: 1, dryFactor: 1.54,
        cementDensity: 1440, sandDensity: 1700, aggregateDensity: 1600,
        bagMass: 50, waterRatio: 0.5, waste: 0,
      },
      { mixLength: "ft", mixWidth: "ft", mixDepth: "in" },
    );
    expect(r.rows.find(x => x.key === "netMixedVol")?.value).toBeCloseTo(0.9438948864, 8);
    expect(r.rows.find(x => x.key === "cementMass")?.value).toBeCloseTo(348.863550013, 6);
    expect(r.rows.find(x => x.key === "cementBags")?.value).toBe(7);
    expect(r.rows.find(x => x.key === "sandMass")?.value).toBeCloseTo((1.453598125056 * 2 / 6) * 1700, 6);
    expect(r.rows.find(x => x.key === "aggregateMass")?.value).toBeCloseTo((1.453598125056 * 3 / 6) * 1600, 6);
  });

  it("Concrete Mix: custom ratio validates aggregate content and honors custom parts", () => {
    const custom = run(
      "concrete-mix-calculator",
      {
        mixInputMode: 0, volume: 1, mixPreset: 0,
        cementParts: 1, sandParts: 1.5, aggregateParts: 3,
        dryFactor: 1.54, cementDensity: 1440, sandDensity: 1600, aggregateDensity: 1500,
        bagMass: 50, waterRatio: 0.45, waste: 0,
      },
      { volume: "m3" },
    );
    expect(custom.rows.find(x => x.key === "totalParts")?.value).toBeCloseTo(5.5, 8);
    expect(custom.rows.find(x => x.key === "cementMass")?.value).toBeCloseTo((1.54 / 5.5) * 1440, 6);

    expect(() => run(
      "concrete-mix-calculator",
      {
        mixInputMode: 0, volume: 1, mixPreset: 0,
        cementParts: 1, sandParts: 0, aggregateParts: 0,
        dryFactor: 1.54, cementDensity: 1440, sandDensity: 1600, aggregateDensity: 1500,
        bagMass: 50, waterRatio: 0.5, waste: 0,
      },
      { volume: "m3" },
    )).toThrow(/aggregate component greater than zero/i);
  });

  it("Concrete Pour: one sub-minimum truck gets short-load fee and selected price basis is honored", () => {
    const r = run(
      "concrete-pour-calculator",
      { length: 10, width: 10, depth: 12, quantity: 1, waste: 0, yield: 0.6, truckCapacity: 10, minOrder: 5, shortLoadFee: 50, pumpRate: 30, price: 2 },
      { length: "ft", width: "ft", depth: "in", price: "USD/ft3" },
    );
    expect(r.rows.find(x => x.key === "trucks")?.value).toBe(1);
    expect(r.rows.find(x => x.key === "shortLoad")?.value).toBe(50);
    expect(r.rows.find(x => x.key === "totalCost")?.value).toBeCloseTo(250, 6);
  });

  it("Concrete Slab model: thickened edge uses normalized feet and applies to every slab", () => {
    expect(value(
      "concrete-slab-calculator", "ft3",
      { slabShape: 0, length: 10, width: 10, thickness: 4, quantity: 2, thickenedEdgeDepth: 12, thickenedEdgeWidth: 6, waste: 0 },
      { length: "ft", width: "ft", thickness: "in", thickenedEdgeDepth: "in", thickenedEdgeWidth: "in" },
    )).toBeCloseTo(93.333333333, 6);
  });

  it("Concrete Footing: strip quantity multiplies volume", () => {
    expect(value(
      "concrete-footing-calculator", "ft3",
      { footingShape: 0, length: 20, width: 12, depth: 12, quantity: 2, waste: 0 },
      { length: "ft", width: "in", depth: "in" },
    )).toBeCloseTo(40, 6);
  });

  it("Concrete Foundation: pier-only estimate works and 12 in diameter is treated as 1 ft once", () => {
    expect(value(
      "concrete-foundation-calculator", "ft3",
      {
        wallLength: 0, wallHeight: 0, wallThickness: 0, wallOpenings: 0,
        footingLength: 0, footingWidth: 0, footingDepth: 0,
        slabLength: 0, slabWidth: 0, slabThickness: 0,
        pierCount: 4, pierDiameter: 12, pierDepth: 4, waste: 0,
      },
      { wallThickness: "in", footingWidth: "in", footingDepth: "in", slabThickness: "in", pierDiameter: "in", pierDepth: "ft" },
    )).toBeCloseTo(4 * Math.PI, 6);
  });

  it("Concrete Wall: opening area is converted to opening volume and form areas are not doubled twice", () => {
    const r = run(
      "concrete-wall-calculator",
      { length: 40, height: 8, thickness: 8, openings: 20, waste: 0 },
      { length: "ft", height: "ft", thickness: "in", openings: "ft2" },
    );
    expect(r.rows.find(x => x.key === "ft3")?.value).toBeCloseTo(200, 6);
    expect(r.rows.find(x => x.key === "openingsVolume")?.value).toBeCloseTo(13.333333333, 6);
    expect(r.rows.find(x => x.key === "formArea")?.value).toBeCloseTo(320, 6);
    expect(r.rows.find(x => x.key === "formTotal")?.value).toBeCloseTo(640, 6);
  });

  it("Concrete Column: circular quantity stays correct", () => {
    expect(value(
      "concrete-column-calculator", "ft3",
      { columnShape: 0, diameter: 12, height: 8, quantity: 3, waste: 0 },
      { diameter: "in", height: "ft" },
    )).toBeCloseTo(6 * Math.PI, 6);
  });

  it("Concrete Curb: reverse 1 yd³ / 1.25 ft² = 21.6 linear ft", () => {
    expect(value(
      "concrete-curb-calculator", "linearFt",
      { curbMode: 1, curbStyle: 0, volume: 1, curbWidth: 6, curbHeight: 12, gutterWidth: 18, gutterThickness: 6, waste: 0 },
      { volume: "yd3", curbWidth: "in", curbHeight: "in", gutterWidth: "in", gutterThickness: "in" },
    )).toBeCloseTo(21.6, 6);
  });

  it("Concrete Stair: solid dimensions and waist-slab wedge are correct", () => {
    const solid = run(
      "concrete-stair-calculator",
      { stairModel: 0, width: 4, rise: 7, run: 11, steps: 4, landingLength: 0, landingWidth: 4, landingThickness: 0, waistThickness: 6, waste: 0 },
      { width: "ft", rise: "in", run: "in", waistThickness: "in", landingLength: "ft", landingWidth: "ft", landingThickness: "in" },
    );
    expect(solid.rows.find(x => x.key === "ft3")?.value).toBeCloseTo(21.388888889, 6);
    expect(solid.rows.find(x => x.key === "totalRise")?.value).toBeCloseTo(2.333333333, 6);
    expect(solid.rows.find(x => x.key === "totalRun")?.value).toBeCloseTo(3.666666667, 6);

    const waist = run(
      "concrete-stair-calculator",
      { stairModel: 1, width: 4, rise: 7, run: 11, steps: 4, waistThickness: 6, landingLength: 0, landingWidth: 4, landingThickness: 0, waste: 0 },
      { width: "ft", rise: "in", run: "in", waistThickness: "in" },
    );
    expect(waist.rows.find(x => x.key === "wedge")?.value).toBeCloseTo(4.277777778, 6);
    expect(waist.rows.find(x => x.key === "ft3")?.value).toBeCloseTo(12.970047651, 6);
  });

  it("Concrete Ramp: trapezoid volume and 1:12 slope magnitude are correct", () => {
    const r = run(
      "concrete-ramp-calculator",
      { length: 12, width: 4, rise: 12, lowThickness: 0, landingLength: 0, landingWidth: 0, landingThickness: 6, waste: 0 },
      { length: "ft", width: "ft", rise: "in", lowThickness: "in" },
    );
    expect(r.rows.find(x => x.key === "ft3")?.value).toBeCloseTo(24, 6);
    expect(r.rows.find(x => x.key === "slopeRatio")?.value).toBeCloseTo(1 / 12, 8);
  });

  it("Concrete Tube: annulus is correct and impossible wall thickness is rejected", () => {
    expect(value(
      "concrete-tube-calculator", "ft3",
      { outerDiameter: 12, innerDiameter: 8, wallThickness: 0, height: 8, quantity: 1, waste: 0 },
      { outerDiameter: "in", innerDiameter: "in", wallThickness: "in", height: "ft" },
    )).toBeCloseTo(3.490658504, 6);

    expect(() => run(
      "concrete-tube-calculator",
      { outerDiameter: 12, innerDiameter: 0, wallThickness: 6, height: 8, quantity: 1, waste: 0 },
      { outerDiameter: "in", innerDiameter: "in", wallThickness: "in", height: "ft" },
    )).toThrow(/Wall thickness must be less than half/);
  });

  it("Concrete Waste: waste and supplier increment round only the final order", () => {
    const r = run(
      "concrete-waste-calculator",
      { length: 10, width: 10, depth: 12, quantity: 1, wastePercent: 10, orderIncrement: 0.25 },
      { length: "ft", width: "ft", depth: "in" },
    );
    expect(r.rows.find(x => x.key === "net")?.value).toBeCloseTo(100 / 27, 6);
    expect(r.rows.find(x => x.key === "order")?.value).toBeCloseTo(110 / 27, 6);
    expect(r.rows.find(x => x.key === "ordered")?.value).toBeCloseTo(4.25, 6);
  });

  it("Concrete Crack Repair: 25 ft × 0.25 in × 0.5 in + 10% = 3 × 10.1 fl oz cartridges", () => {
    const r = run(
      "concrete-crack-repair-calculator",
      { length: 25, width: 0.25, depth: 0.5, quantity: 1, cartridge: 10.1, waste: 10 },
      { length: "ft", width: "in", depth: "in" },
    );
    expect(r.rows.find(x => x.key === "net")?.value).toBeCloseTo(37.5, 6);
    expect(r.rows.find(x => x.key === "floz")?.value).toBeCloseTo(22.857142857, 6);
    expect(r.rows.find(x => x.key === "cartridges")?.value).toBe(3);
  });
});
