import { describe, expect, it } from 'vitest';
import { getModelForSlug } from '../calculator-registry';
import { readInputs } from '../calculator-math';

function calculate(
  slug: string,
  changes: Record<string, number> = {},
  unitChanges: Record<string, string> = {},
) {
  const model = getModelForSlug(slug);
  const raw: Record<string, number> = {};
  const units: Record<string, string> = {};

  for (const field of model.fields) {
    if (field.value !== undefined) raw[field.id] = field.value;
    else if (!field.optional) raw[field.id] = field.min ?? 1;
    if (field.unit) units[field.id] = field.unit;
  }

  Object.assign(raw, changes);
  Object.assign(units, unitChanges);
  const parsed = readInputs(model.fields, raw, units);
  return model.calculate(parsed, units);
}

function value(
  slug: string,
  key: string,
  changes: Record<string, number> = {},
  units: Record<string, string> = {},
) {
  const r = calculate(slug, changes, units);
  const found = r.rows.find((row) => row.key === key);
  expect(found, `${slug} should return row "${key}"`).toBeDefined();
  return found!.value;
}

describe('Drywall / paint / insulation regressions', () => {
  it('drywall screw calculator converts a fastening schedule to screws and boxes', () => {
    expect(value('drywall-screw-calculator', 'screws', { sheets: 10, perSheet: 32, perBox: 200, waste: 10 })).toBe(352);
    expect(value('drywall-screw-calculator', 'boxes', { sheets: 10, perSheet: 32, perBox: 200, waste: 10 })).toBe(2);
  });

  it('spray foam calculator uses board feet and rounds whole kits', () => {
    expect(value('spray-foam-calculator', 'boardFeet', { length: 10, width: 10, depth: 2, coverage: 200, waste: 10 }, { depth: 'in' })).toBeCloseTo(220, 8);
    expect(value('spray-foam-calculator', 'kits', { length: 10, width: 10, depth: 2, coverage: 200, waste: 10 }, { depth: 'in' })).toBe(2);
  });
});

describe('Deck / fence / gate regressions', () => {
  it('fence post calculator has a dedicated post-count workflow', () => {
    expect(value('fence-post-calculator', 'posts', { length: 100, spacing: 8, extraPosts: 0, waste: 10 })).toBe(14);
    expect(value('fence-post-calculator', 'order', { length: 100, spacing: 8, extraPosts: 0, waste: 10 })).toBe(16);
    expect(value('fence-post-calculator', 'spacing', { length: 100, spacing: 8, extraPosts: 0, waste: 10 })).toBeCloseTo(100 / 13, 8);
  });

  it('fence panel calculator separates panels, posts and nominal coverage', () => {
    expect(value('fence-panel-calculator', 'panels', { length: 100, panelWidth: 6, extraPosts: 0, waste: 10 })).toBe(17);
    expect(value('fence-panel-calculator', 'posts', { length: 100, panelWidth: 6, extraPosts: 0, waste: 10 })).toBe(18);
    expect(value('fence-panel-calculator', 'order', { length: 100, panelWidth: 6, extraPosts: 0, waste: 10 })).toBe(19);
    expect(value('fence-panel-calculator', 'extra', { length: 100, panelWidth: 6, extraPosts: 0, waste: 10 })).toBeCloseTo(2, 8);
  });

  it('gate calculator treats clearances as geometry, not a material takeoff', () => {
    expect(value('gate-calculator', 'width', { opening: 48, leaves: 1, hinge: 0.5, latch: 0.5, height: 6 }, { opening: 'in', hinge: 'in', latch: 'in' })).toBeCloseTo(47, 8);
  });
});

describe('Paver / landscaping regressions', () => {
  it('paver calculator uses paver terminology and straight-layout rows and columns', () => {
    expect(value('paver-calculator', 'installed', { length: 10, width: 10, paverLength: 12, paverWidth: 12, joint: 0, waste: 0 }, { paverLength: 'in', paverWidth: 'in', joint: 'in' })).toBe(100);
    expect(value('paver-calculator', 'order', { length: 10, width: 10, paverLength: 12, paverWidth: 12, joint: 0, waste: 10 }, { paverLength: 'in', paverWidth: 'in', joint: 'in' })).toBe(110);
  });

  it('generic landscaping material calculator is no longer mulch-specific', () => {
    expect(value('landscaping-calculator', 'order', { length: 10, width: 10, depth: 3, quantity: 1, bag: 2, waste: 0 }, { depth: 'in', bag: 'ft3' })).toBeCloseTo(25 / 27, 8);
    expect(value('landscaping-calculator', 'bags', { length: 10, width: 10, depth: 3, quantity: 1, bag: 2, waste: 0 }, { depth: 'in', bag: 'ft3' })).toBe(13);
  });

  it('paver joint sand uses a dedicated model rather than tile grout', () => {
    const model = getModelForSlug('paver-joint-sand-calculator');
    expect(model.sources).toEqual([]);
    const r = calculate('paver-joint-sand-calculator', {
      length: 10, width: 10, paverLength: 12, paverWidth: 12,
      joint: 0.125, depth: 1.5, density: 1600, bagMass: 20, waste: 0,
    }, { paverLength: 'in', paverWidth: 'in', joint: 'in', depth: 'in' });
    expect(r.rows.find((row) => row.key === 'bags')?.value).toBe(1);
    expect(r.rows.find((row) => row.key === 'weight')?.value).toBeGreaterThan(0);
  });

  it('retaining-wall calculator labels shared masonry fields for wall blocks', () => {
    const fields = getModelForSlug('retaining-wall-calculator').fields;
    expect(fields.find((f) => f.id === 'unitLength')?.label).toBe('Block face length');
    expect(fields.find((f) => f.id === 'unitHeight')?.label).toBe('Block face height');
    expect(fields.find((f) => f.id === 'joint')?.value).toBe(0);
  });
});

describe('Asphalt regressions', () => {
  it('general asphalt calculator uses an asphalt-specific editable density default', () => {
    const model = getModelForSlug('asphalt-calculator');
    const density = model.fields.find((f) => f.id === 'density');
    expect(density?.value).toBe(145);
    expect(density?.unit).toBe('lb/ft3');
    expect(value('asphalt-calculator', 'tons', { length: 20, width: 10, depth: 4, quantity: 1, density: 145, waste: 0 }, { depth: 'in', density: 'lb/ft3' })).toBeCloseTo((20 * 10 * (4 / 12) * 145) / 2000, 8);
  });

  it('asphalt thickness calculator reverse-calculates depth from mass, area and density', () => {
    expect(value('asphalt-thickness-calculator', 'depth', { length: 100, width: 10, mass: 10, density: 145 }, { mass: 'ton', density: 'lb/ft3' })).toBeCloseTo((20000 / 145 / 1000) * 12, 8);
  });

  it('parking-lot quantity and parking-lot cost remain separate intents', () => {
    expect(value('parking-lot-calculator', 'tons', { length: 100, width: 50, depth: 3, quantity: 1, density: 145, waste: 0 }, { depth: 'in', density: 'lb/ft3' })).toBeCloseTo(90.625, 8);
    expect(value('parking-lot-cost-calculator', 'total', { length: 100, width: 50, depth: 3, density: 145, waste: 0, price: 100, delivery: 500, labor: 1000, tax: 10 }, { depth: 'in', density: 'lb/ft3', price: 'USD/ton' })).toBeCloseTo(11468.75, 8);
  });
});
