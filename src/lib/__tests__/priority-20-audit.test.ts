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
    else if (!field.optional) raw[field.id] = field.min !== undefined ? Math.max(field.min, 1) : 1;
    if (field.unit) units[field.id] = field.unit;
  }

  Object.assign(raw, changes);
  Object.assign(units, unitChanges);
  return model.calculate(readInputs(model.fields, raw, units), units);
}

function value(
  slug: string,
  key: string,
  changes: Record<string, number> = {},
  units: Record<string, string> = {},
) {
  const result = calculate(slug, changes, units);
  const row = result.rows.find((candidate) => candidate.key === key);
  expect(row, `${slug} should return result row "${key}"`).toBeDefined();
  expect(Number.isFinite(row!.value)).toBe(true);
  return row!.value;
}

describe('Priority 20 construction calculator math audit', () => {
  it('01–02 Concrete + Paint: geometry, allowance, coats and whole-container rounding', () => {
    const concrete = {
      shape: 0, length: 20, width: 10, depth: 4, quantity: 1,
      waste: 10, density: 150, yield: 0.6,
    };
    const cuFt = 20 * 10 * (4 / 12);
    expect(value('concrete-calculator', 'net', concrete, { depth: 'in' })).toBeCloseTo(cuFt / 27, 10);
    expect(value('concrete-calculator', 'order', concrete, { depth: 'in' })).toBeCloseTo(cuFt * 1.10 / 27, 10);

    const paint = {
      length: 12, width: 10, height: 8, openings: 0, coats: 2,
      coverage: 350, container: 1, waste: 0,
    };
    const wallArea = 2 * (12 + 10) * 8;
    expect(value('paint-calculator', 'area', paint)).toBeCloseTo(wallArea, 10);
    expect(value('paint-calculator', 'gallons', paint)).toBeCloseTo(wallArea * 2 / 350, 10);
    expect(value('paint-calculator', 'containers', paint)).toBe(3);
  });

  it('03–04 Gravel + Mulch: compaction/waste separation and bag rounding', () => {
    const gravel = {
      mode: 0, length: 20, width: 10, depth: 4, material: 1,
      compaction: 15, waste: 10,
    };
    const netYd3 = (20 * 10 * (4 / 12)) / 27;
    const afterCompaction = netYd3 * 1.15;
    const order = afterCompaction * 1.10;
    expect(value('gravel-calculator', 'net', gravel, { depth: 'in' })).toBeCloseTo(netYd3, 10);
    expect(value('gravel-calculator', 'compaction', gravel, { depth: 'in' })).toBeCloseTo(afterCompaction, 10);
    expect(value('gravel-calculator', 'order', gravel, { depth: 'in' })).toBeCloseTo(order, 10);
    expect(value('gravel-calculator', 'tons', gravel, { depth: 'in' })).toBeCloseTo(order * 1.40, 10);

    const mulch = { length: 20, width: 10, depth: 3, quantity: 1, bag: 2, waste: 10 };
    const mulchOrderFt3 = 20 * 10 * (3 / 12) * 1.10;
    expect(value('mulch-calculator', 'ft3', mulch, { depth: 'in', bag: 'ft3' })).toBeCloseTo(mulchOrderFt3, 10);
    expect(value('mulch-calculator', 'order', mulch, { depth: 'in', bag: 'ft3' })).toBeCloseTo(mulchOrderFt3 / 27, 10);
    expect(value('mulch-calculator', 'bags', mulch, { depth: 'in', bag: 'ft3' })).toBe(Math.ceil(mulchOrderFt3 / 2));
  });

  it('05–06 Roofing + Roof Pitch: slope multiplier, package rounding and reverse geometry basis', () => {
    const roofing = {
      mode: 0, length: 40, width: 30, pitch: 6, overhang: 1.5, quantity: 1,
      shingleCoverage: 100 / 3, underlaymentCoverage: 400, sheathingCoverage: 32,
      waste: 10, shinglePrice: 0, underlaymentPrice: 0, sheathingPrice: 0,
    };
    const roof = (40 + 3) * (30 + 3) * Math.hypot(1, 6 / 12);
    const roofOrder = roof * 1.10;
    expect(value('roofing-calculator', 'roof', roofing)).toBeCloseTo(roof, 10);
    expect(value('roofing-calculator', 'squares', roofing)).toBeCloseTo(roofOrder / 100, 10);
    expect(value('roofing-calculator', 'bundles', roofing)).toBe(Math.ceil(roofOrder / (100 / 3)));

    const pitch = { mode: 0, rise: 6, run: 12 };
    expect(value('roof-pitch-calculator', 'pitch', pitch, { rise: 'in', run: 'in' })).toBeCloseTo(6, 10);
    expect(value('roof-pitch-calculator', 'angle', pitch, { rise: 'in', run: 'in' })).toBeCloseTo(26.565051177, 8);
    expect(value('roof-pitch-calculator', 'percent', pitch, { rise: 'in', run: 'in' })).toBeCloseTo(50, 10);
    expect(value('roof-pitch-calculator', 'multiplier', pitch, { rise: 'in', run: 'in' })).toBeCloseTo(Math.sqrt(1.25), 10);
  });

  it('07–08 Flooring + Carpet: exclusions, separate allowances, packages and roll-strip purchase area', () => {
    const flooring = {
      length: 22, width: 15, openings: 30, pattern: 5, waste: 8, coverage: 24,
    };
    const net = 22 * 15 - 30;
    const patternArea = net * 1.05;
    const orderArea = patternArea * 1.08;
    expect(value('flooring-calculator', 'net', flooring)).toBeCloseTo(net, 10);
    expect(value('flooring-calculator', 'order', flooring)).toBeCloseTo(orderArea, 10);
    expect(value('flooring-calculator', 'packages', flooring)).toBe(Math.ceil(orderArea / 24));

    const carpet = { length: 18, width: 25, rollWidth: 12, waste: 8 };
    const strips = Math.ceil(25 / 12);
    const linear = strips * 18 * 1.08;
    const purchasedFt2 = linear * 12;
    expect(value('carpet-calculator', 'strips', carpet)).toBe(3);
    expect(value('carpet-calculator', 'linear', carpet)).toBeCloseTo(linear, 10);
    expect(value('carpet-calculator', 'order', carpet)).toBeCloseTo(purchasedFt2 / 9, 10);
    expect(value('carpet-calculator', 'offcuts', carpet)).toBeCloseTo(purchasedFt2 - 18 * 25, 10);
  });

  it('09–10 Tile + Concrete Slab: joint-aware grid, box rounding, thickened edge and supplier increment', () => {
    const tile = {
      mode: 0, length: 18, width: 12, tileLength: 24, tileWidth: 12,
      joint: 0.125, tilesPerBox: 6, waste: 10,
    };
    expect(value('tile-calculator', 'rows', tile, { tileLength: 'in', tileWidth: 'in', joint: 'in' })).toBe(12);
    expect(value('tile-calculator', 'columns', tile, { tileLength: 'in', tileWidth: 'in', joint: 'in' })).toBe(9);
    expect(value('tile-calculator', 'tiles', tile, { tileLength: 'in', tileWidth: 'in', joint: 'in' })).toBe(119);
    expect(value('tile-calculator', 'boxes', tile, { tileLength: 'in', tileWidth: 'in', joint: 'in' })).toBe(20);

    const slab = {
      slabShape: 0, length: 12, width: 10, thickness: 4, quantity: 1,
      thickenedEdgeDepth: 8, thickenedEdgeWidth: 12, subbaseDepth: 4,
      orderIncrement: 0.25, waste: 10, density: 150, yield: 0.6,
    };
    const fieldFt3 = 12 * 10 * (4 / 12);
    const edgeFt3 = 2 * (12 + 10) * (12 / 12) * ((8 - 4) / 12);
    const calculatedOrder = (fieldFt3 + edgeFt3) * 1.10 / 27;
    const rounded = Math.ceil((calculatedOrder - 1e-12) / 0.25) * 0.25;
    expect(value('concrete-slab-calculator', 'net', slab, {
      thickness: 'in', thickenedEdgeDepth: 'in', thickenedEdgeWidth: 'in', subbaseDepth: 'in',
    })).toBeCloseTo((fieldFt3 + edgeFt3) / 27, 10);
    expect(value('concrete-slab-calculator', 'roundedOrder', slab, {
      thickness: 'in', thickenedEdgeDepth: 'in', thickenedEdgeWidth: 'in', subbaseDepth: 'in',
    })).toBeCloseTo(rounded, 10);
  });

  it('11–12 Drywall + Fence: optional ceiling/openings, whole sheets, sections and spare orders', () => {
    const drywall = {
      length: 12, width: 10, height: 8, openings: 40, ceiling: 1,
      coverage: 32, waste: 10,
    };
    const area = 2 * (12 + 10) * 8 + 12 * 10 - 40;
    expect(value('drywall-calculator', 'area', drywall)).toBeCloseTo(area, 10);
    expect(value('drywall-calculator', 'order', drywall)).toBeCloseTo(area * 1.10, 10);
    expect(value('drywall-calculator', 'sheets', drywall)).toBe(15);

    const fence = { length: 72, spacing: 8, extraPosts: 2, waste: 10 };
    expect(value('fence-calculator', 'panels', fence)).toBe(9);
    expect(value('fence-calculator', 'posts', fence)).toBe(12);
    expect(value('fence-calculator', 'panelOrder', fence)).toBe(10);
    expect(value('fence-calculator', 'postOrder', fence)).toBe(14);
    expect(value('fence-calculator', 'spacing', fence)).toBeCloseTo(8, 10);
  });

  it('13–14 Deck + Paver: layout rounding, joist/fastener math and spare whole-unit purchase', () => {
    const deck = {
      length: 20, width: 12, boardWidth: 5.5, boardLength: 16, gap: 0.125,
      spacing: 16, fasteners: 2, waste: 10,
    };
    const deckUnits = { boardWidth: 'in', gap: 'in', spacing: 'in' };
    expect(value('deck-calculator', 'rows', deck, deckUnits)).toBe(26);
    expect(value('deck-calculator', 'base', deck, deckUnits)).toBe(52);
    expect(value('deck-calculator', 'boards', deck, deckUnits)).toBe(58);
    expect(value('deck-calculator', 'joists', deck, deckUnits)).toBe(16);
    expect(value('deck-calculator', 'fasteners', deck, deckUnits)).toBe(973);

    const paver = {
      length: 12, width: 10, paverLength: 12, paverWidth: 6, joint: 0, waste: 10,
    };
    const paverUnits = { paverLength: 'in', paverWidth: 'in', joint: 'in' };
    expect(value('paver-calculator', 'rows', paver, paverUnits)).toBe(20);
    expect(value('paver-calculator', 'columns', paver, paverUnits)).toBe(12);
    expect(value('paver-calculator', 'installed', paver, paverUnits)).toBe(240);
    expect(value('paver-calculator', 'order', paver, paverUnits)).toBe(264);
    expect(value('paver-calculator', 'spares', paver, paverUnits)).toBe(24);
  });

  it('15–16 Asphalt + Brick: compacted density conversion, waste, brick module, wythes and whole units', () => {
    const asphalt = {
      length: 20, width: 10, depth: 4, quantity: 1, density: 145, waste: 10,
    };
    const asphaltUnits = { depth: 'in', density: 'lb/ft3' };
    const netFt3 = 20 * 10 * (4 / 12);
    const orderFt3 = netFt3 * 1.10;
    expect(value('asphalt-calculator', 'net', asphalt, asphaltUnits)).toBeCloseTo(netFt3 / 27, 10);
    expect(value('asphalt-calculator', 'order', asphalt, asphaltUnits)).toBeCloseTo(orderFt3 / 27, 10);
    expect(value('asphalt-calculator', 'tons', asphalt, asphaltUnits)).toBeCloseTo(orderFt3 * 145 / 2000, 10);

    const brick = {
      mode: 0, length: 20, height: 8, openings: 20,
      brickLength: 7.625, brickHeight: 2.25, brickDepth: 3.625, joint: 0.375,
      wythes: 1, waste: 10, unitWeight: 4.3,
    };
    const brickUnits = {
      brickLength: 'in', brickHeight: 'in', brickDepth: 'in', joint: 'in',
    };
    expect(value('brick-calculator', 'area', brick, brickUnits)).toBeCloseTo(140, 10);
    expect(value('brick-calculator', 'installed', brick, brickUnits)).toBe(960);
    expect(value('brick-calculator', 'order', brick, brickUnits)).toBe(1056);
    expect(value('brick-calculator', 'weight', brick, brickUnits)).toBeCloseTo(1056 * 4.3, 10);
  });

  it('17–18 Concrete Block + Rebar: installed modules, course/grid counts, stock rounding and weight', () => {
    const block = {
      length: 20, height: 8, openings: 16,
      blockLength: 15.625, blockHeight: 7.625, blockDepth: 7.625, joint: 0.375,
      waste: 10, unitWeight: 35,
    };
    const blockUnits = {
      blockLength: 'in', blockHeight: 'in', blockDepth: 'in', joint: 'in',
    };
    expect(value('concrete-block-calculator', 'netArea', block, blockUnits)).toBeCloseTo(144, 10);
    expect(value('concrete-block-calculator', 'installed', block, blockUnits)).toBe(162);
    expect(value('concrete-block-calculator', 'order', block, blockUnits)).toBe(179);
    expect(value('concrete-block-calculator', 'courses', block, blockUnits)).toBe(12);
    expect(value('concrete-block-calculator', 'perCourse', block, blockUnits)).toBe(15);
    expect(value('concrete-block-calculator', 'weight', block, blockUnits)).toBe(6265);

    const rebar = {
      length: 20, width: 10, cover: 2, spacing: 16, size: 4,
      stockLength: 20, waste: 10,
    };
    const rebarUnits = { cover: 'in', spacing: 'in' };
    expect(value('rebar-calculator', 'bars', rebar, rebarUnits)).toBe(25);
    expect(value('rebar-calculator', 'acrossL', rebar, rebarUnits)).toBe(16);
    expect(value('rebar-calculator', 'acrossW', rebar, rebarUnits)).toBe(9);
    expect(value('rebar-calculator', 'netLength', rebar, rebarUnits)).toBeCloseTo(331.6666666667, 8);
    expect(value('rebar-calculator', 'orderLength', rebar, rebarUnits)).toBeCloseTo(364.8333333333, 8);
    expect(value('rebar-calculator', 'stockPieces', rebar, rebarUnits)).toBe(19);
    expect(value('rebar-calculator', 'weight', rebar, rebarUnits)).toBeCloseTo(243.7086666667, 8);
  });

  it('19–20 Excavation + Earthwork: sloped excavation integral and bank/loose/compacted states', () => {
    const excavation = {
      length: 20, width: 10, depth: 4, sideSlope: 0.5, quantity: 1, swell: 20,
    };
    const bankFt3 = 20 * 10 * 4
      + 0.5 * (20 + 10) * 4 ** 2
      + (4 / 3) * 0.5 ** 2 * 4 ** 3;
    expect(value('excavation-calculator', 'bank', excavation)).toBeCloseTo(bankFt3 / 27, 10);
    expect(value('excavation-calculator', 'loose', excavation)).toBeCloseTo(bankFt3 / 27 * 1.20, 10);
    expect(value('excavation-calculator', 'topLength', excavation)).toBeCloseTo(24, 10);
    expect(value('excavation-calculator', 'topWidth', excavation)).toBeCloseTo(14, 10);

    const earthwork = {
      mode: 0, length: 100, width: 50, depth: 2, swell: 20, shrink: 10,
    };
    const bankYd3 = 100 * 50 * 2 / 27;
    expect(value('earthwork-calculator', 'bank', earthwork)).toBeCloseTo(bankYd3, 10);
    expect(value('earthwork-calculator', 'loose', earthwork)).toBeCloseTo(bankYd3 * 1.20, 10);
    expect(value('earthwork-calculator', 'compacted', earthwork)).toBeCloseTo(bankYd3 * 0.90, 10);
  });
  it('Brick rejects a zero net wall area instead of returning a zero-material estimate', () => {
    const model = getModelForSlug('brick-calculator');
    const raw: Record<string, number> = {};
    const units: Record<string, string> = {};
    for (const field of model.fields) {
      if (field.value !== undefined) raw[field.id] = field.value;
      if (field.unit) units[field.id] = field.unit;
    }
    raw.mode = 1;
    raw.knownArea = 0;
    expect(() => model.calculate(readInputs(model.fields, raw, units), units))
      .toThrow(/net wall area must be greater than zero/i);
  });

});
