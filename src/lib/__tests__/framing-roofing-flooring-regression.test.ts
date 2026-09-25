import { describe, expect, it } from 'vitest';
import { getModelForSlug } from '../calculator-registry';
import { InputError, readInputs } from '../calculator-math';

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

function value(slug: string, key: string, changes: Record<string, number> = {}, units: Record<string, string> = {}) {
  const result = calculate(slug, changes, units);
  const found = result.rows.find(row => row.key === key);
  expect(found, `${slug} should return row "${key}"`).toBeDefined();
  return found!.value;
}

describe('Framing & lumber — independent regression cases', () => {
  it('framing calculator separates studs, plates and total footage', () => {
    const r = calculate('framing-calculator',
      { length:20, height:8, spacing:16, extra:2, topPlates:2, bottomPlates:1, stockLength:16, waste:0 },
      { spacing:'in' });
    expect(r.rows.find(x => x.key === 'studs')?.value).toBe(18);
    expect(r.rows.find(x => x.key === 'plateFeet')?.value).toBeCloseTo(60, 8);
    expect(r.rows.find(x => x.key === 'net')?.value).toBeCloseTo(204, 8);
  });

  it('wall framing calculator matches the same wall takeoff geometry', () => {
    expect(value('wall-framing-calculator','studs',
      { length:20, height:8, spacing:16, extra:2, topPlates:2, bottomPlates:1, waste:0 },
      { spacing:'in' })).toBe(18);
    expect(value('wall-framing-calculator','net',
      { length:20, height:8, spacing:16, extra:2, topPlates:2, bottomPlates:1, waste:0 },
      { spacing:'in' })).toBeCloseTo(204, 8);
  });

  it('stud calculator counts end members and extras', () => {
    expect(value('stud-calculator','installed',
      { length:20, spacing:16, memberLength:8, extra:2, waste:0 },
      { spacing:'in' })).toBe(18);
    expect(value('stud-calculator','linear',
      { length:20, spacing:16, memberLength:8, extra:2, waste:0 },
      { spacing:'in' })).toBeCloseTo(144, 8);
  });

  it('stud spacing calculator divides the end-center distance into equal intervals', () => {
    expect(value('stud-spacing-calculator','spacing',{ length:20, quantity:16 })).toBeCloseTo(16, 8);
  });

  it('lumber calculator handles general repeated-member layouts', () => {
    expect(value('lumber-calculator','installed',{ length:20, spacing:2, memberLength:8, extra:1, waste:0 },{ spacing:'ft' })).toBe(12);
  });

  it('lumber cost supports per-piece pricing with tax, delivery and labor', () => {
    expect(value('lumber-cost-calculator','total',
      { quantity:20, pieceLength:8, waste:10, price:5, tax:10, delivery:20, labor:30 },
      { price:'USD/unit' })).toBeCloseTo(171, 8);
  });

  it('board-foot calculator uses 144 in³ per board foot and optional board-foot price', () => {
    expect(value('board-foot-calculator','net',
      { thickness:2, width:6, length:8, quantity:10, waste:10, price:5 },
      { thickness:'in', width:'in' })).toBeCloseTo(80, 8);
    expect(value('board-foot-calculator','order',
      { thickness:2, width:6, length:8, quantity:10, waste:10, price:5 },
      { thickness:'in', width:'in' })).toBeCloseTo(88, 8);
    expect(value('board-foot-calculator','cost',
      { thickness:2, width:6, length:8, quantity:10, waste:10, price:5 },
      { thickness:'in', width:'in' })).toBeCloseTo(440, 8);
  });

  it('board-foot cost calculator prices allowance-adjusted board feet', () => {
    expect(value('board-foot-cost-calculator','total',
      { thickness:2, width:6, length:8, quantity:10, waste:10, price:5, tax:10, delivery:20 },
      { thickness:'in', width:'in' })).toBeCloseTo(504, 8);
  });

  it('joist calculator counts members at a specified maximum spacing', () => {
    expect(value('joist-calculator','installed',
      { length:20, spacing:16, memberLength:12, extra:0, waste:0 },
      { spacing:'in' })).toBe(16);
  });

  it('joist spacing calculator solves equal center spacing', () => {
    expect(value('joist-spacing-calculator','spacing',{ length:20, quantity:16 })).toBeCloseTo(16, 8);
  });

  it('floor joist calculator keeps the same spacing math', () => {
    expect(value('floor-joist-calculator','installed',
      { length:20, spacing:16, memberLength:12, extra:0, waste:0 },
      { spacing:'in' })).toBe(16);
  });

  it('ceiling joist calculator keeps inches and feet normalized', () => {
    expect(value('ceiling-joist-calculator','installed',
      { length:20, spacing:16, memberLength:12, extra:0, waste:0 },
      { spacing:'in' })).toBe(16);
  });

  it('header calculator performs bending section-modulus math', () => {
    expect(value('header-size-calculator','section',
      { span:6, load:300, allowable:1000, breadth:3 },
      { breadth:'in' })).toBeCloseTo(16.2, 8);
    expect(value('header-size-calculator','depth',
      { span:6, load:300, allowable:1000, breadth:3 },
      { breadth:'in' })).toBeCloseTo(Math.sqrt(32.4), 8);
  });

  it('beam calculator uses consistent UDL reactions, moment and deflection units', () => {
    const r=calculate('beam-calculator',{ case:0, span:10, load:100, modulus:1600000, inertia:100 });
    expect(r.rows.find(x => x.key === 'reaction')?.value).toBeCloseTo(500, 8);
    expect(r.rows.find(x => x.key === 'moment')?.value).toBeCloseTo(1250, 8);
    expect(r.rows.find(x => x.key === 'deflection')?.value).toBeCloseTo(0.140625, 8);
  });

  it('beam load calculator converts tributary area loads to a line load', () => {
    expect(value('beam-load-calculator','load',{ area:100, dead:10, live:40, span:10, self:5 })).toBeCloseTo(5050, 8);
    expect(value('beam-load-calculator','line',{ area:100, dead:10, live:40, span:10, self:5 })).toBeCloseTo(505, 8);
  });

  it('linear-foot member pricing requires member length instead of silently returning $0', () => {
    const model=getModelForSlug('stud-calculator');
    const raw={ length:20, spacing:16, extra:0, waste:0, price:2 };
    const units={ length:'ft', spacing:'in', memberLength:'ft', price:'USD/ft' };
    const parsed=readInputs(model.fields,raw,units);
    expect(() => model.calculate(parsed,units)).toThrow(InputError);
  });
});

describe('Roofing — independent regression cases', () => {
  const simpleRoof = { mode:0, length:40, width:30, pitch:6, overhang:1, quantity:1, waste:0 };
  const roofArea = 42 * 32 * Math.sqrt(1.25);

  it('roofing calculator derives sloped surface and whole material packages', () => {
    const r=calculate('roofing-calculator',{
      ...simpleRoof, shingleCoverage:100/3, underlaymentCoverage:400, sheathingCoverage:32,
      shinglePrice:0, underlaymentPrice:0, sheathingPrice:0
    });
    expect(r.rows.find(x => x.key === 'roof')?.value).toBeCloseTo(roofArea, 8);
    expect(r.rows.find(x => x.key === 'bundles')?.value).toBe(46);
    expect(r.rows.find(x => x.key === 'rolls')?.value).toBe(4);
    expect(r.rows.find(x => x.key === 'sheets')?.value).toBe(47);
  });

  it('roof area calculator keeps measured area separate from allowance', () => {
    expect(value('roof-area-calculator','roof',simpleRoof)).toBeCloseTo(roofArea, 8);
    expect(value('roof-area-calculator','order',{...simpleRoof,waste:10})).toBeCloseTo(roofArea*1.1, 8);
  });

  it('roof pitch calculator returns 6:12, 50% and 26.565° for 6 over 12', () => {
    const r=calculate('roof-pitch-calculator',{ mode:0, rise:6, run:12 },{ rise:'in', run:'in' });
    expect(r.rows.find(x => x.key === 'pitch')?.value).toBeCloseTo(6, 8);
    expect(r.rows.find(x => x.key === 'percent')?.value).toBeCloseTo(50, 8);
    expect(r.rows.find(x => x.key === 'angle')?.value).toBeCloseTo(26.565051177, 8);
  });

  it('roof pitch angle mode returns 12:12 at 45 degrees', () => {
    expect(value('roof-pitch-calculator','pitch',{ mode:1, angleInput:45 })).toBeCloseTo(12, 8);
  });

  it('roof slope calculator returns the same rise/run geometry', () => {
    expect(value('roof-slope-calculator','pitch',{ rise:6, run:12 },{ rise:'in', run:'in' })).toBeCloseTo(6, 8);
  });

  it('roofing shingle calculator supports known sloped roof area', () => {
    expect(value('roofing-shingle-calculator','packages',
      { mode:1, roofArea:100, coverage:25, waste:0 })).toBe(4);
  });

  it('shingle quantity calculator converts area to packages and squares', () => {
    expect(value('shingle-quantity-calculator','packages',{ roofArea:100, coverage:25, waste:0 })).toBe(4);
    expect(value('shingle-quantity-calculator','squares',{ roofArea:100, coverage:25, waste:0 })).toBeCloseTo(1, 8);
  });

  it('shingle cost prices rounded whole packages', () => {
    expect(value('shingle-cost-calculator','total',
      { roofArea:100, coverage:25, waste:0, price:10, delivery:20, tax:10 })).toBeCloseTo(64, 8);
  });

  it('generic roofing material calculator rounds packages and optional package cost', () => {
    expect(value('roofing-material-calculator','packages',
      { mode:1, roofArea:100, coverage:25, waste:0, price:10 })).toBe(4);
    expect(value('roofing-material-calculator','cost',
      { mode:1, roofArea:100, coverage:25, waste:0, price:10 })).toBeCloseTo(40, 8);
  });

  it('underlayment calculator uses entered net roll coverage', () => {
    expect(value('roofing-underlayment-calculator','packages',
      { mode:1, roofArea:100, coverage:50, waste:0, price:10 })).toBe(2);
  });

  it('roof sheathing rounds actual sheet coverage to whole panels', () => {
    expect(value('roof-sheathing-calculator','sheets',
      { mode:1, roofArea:100, sheetLength:8, sheetWidth:4, waste:0, price:20 })).toBe(4);
  });

  it('roof rafter calculator combines line length and pair count', () => {
    const r=calculate('roof-rafter-calculator',
      { span:30, buildingLength:40, pitch:6, overhang:1, ridge:0, spacing:24, extraPairs:0, waste:0 },
      { ridge:'in', spacing:'in' });
    expect(r.rows.find(x => x.key === 'pairs')?.value).toBe(21);
    expect(r.rows.find(x => x.key === 'installed')?.value).toBe(42);
    expect(r.rows.find(x => x.key === 'length')?.value).toBeCloseTo(16*Math.sqrt(1.25), 8);
  });

  it('rafter length calculator handles ridge deduction and horizontal overhang', () => {
    expect(value('rafter-length-calculator','length',
      { span:30, pitch:6, overhang:1, ridge:0 },{ ridge:'in' })).toBeCloseTo(16*Math.sqrt(1.25), 8);
  });

  it('roof truss calculator includes both end positions', () => {
    expect(value('roof-truss-calculator','installed',
      { length:40, spacing:24, extra:0, waste:0 },{ spacing:'in' })).toBe(21);
  });

  it('roof flashing calculator accounts for overlap only between pieces', () => {
    expect(value('roof-flashing-calculator','installed',
      { length:40, stock:10, overlap:3, waste:0 },{ overlap:'in' })).toBe(5);
  });

  it('roof waste calculator applies a single explicit area allowance', () => {
    expect(value('roof-waste-calculator','order',{ area:1000, waste:10 })).toBeCloseTo(1100, 8);
    expect(value('roof-waste-calculator','extra',{ area:1000, waste:10 })).toBeCloseTo(100, 8);
  });
});

describe('Flooring & tile — independent regression cases', () => {
  it('flooring calculator rounds package coverage after allowances', () => {
    const r=calculate('flooring-calculator',
      { length:20, width:12, openings:0, pattern:0, waste:10, coverage:20 });
    expect(r.rows.find(x => x.key === 'packages')?.value).toBe(14);
    expect(r.rows.find(x => x.key === 'purchased')?.value).toBeCloseTo(280, 8);
  });

  it('flooring cost applies flooring allowance to flooring but pad/underlayment to net area', () => {
    const r=calculate('flooring-cost-calculator',
      { area:240, pattern:10, waste:10, price:2, underlayment:1, tax:10, delivery:20, labor:100 },
      { price:'USD/ft2' });
    expect(r.rows.find(x => x.key === 'order')?.value).toBeCloseTo(290.4, 8);
    expect(r.rows.find(x => x.key === 'underlayment')?.value).toBeCloseTo(240, 8);
    expect(r.rows.find(x => x.key === 'total')?.value).toBeCloseTo(1022.88, 8);
  });

  it('hardwood flooring calculator uses package coverage', () => {
    expect(value('hardwood-flooring-calculator','packages',
      { length:20, width:12, openings:0, pattern:0, waste:10, coverage:20 })).toBe(14);
  });

  it('hardwood flooring cost keeps underlayment on net installed area', () => {
    expect(value('hardwood-flooring-cost-calculator','underlayment',
      { area:240, pattern:10, waste:10, price:2, underlayment:1, tax:0, delivery:0, labor:0 },
      { price:'USD/ft2' })).toBeCloseTo(240, 8);
  });

  it('laminate flooring calculator uses whole-package rounding', () => {
    expect(value('laminate-flooring-calculator','packages',
      { length:20, width:12, openings:0, pattern:0, waste:10, coverage:20 })).toBe(14);
  });

  it('vinyl flooring calculator uses whole-package rounding', () => {
    expect(value('vinyl-flooring-calculator','packages',
      { length:20, width:12, openings:0, pattern:0, waste:10, coverage:20 })).toBe(14);
  });

  it('carpet calculator uses roll width and seam direction instead of room area alone', () => {
    const r=calculate('carpet-calculator',{ length:20, width:12, rollWidth:12, waste:10 });
    expect(r.rows.find(x => x.key === 'strips')?.value).toBe(1);
    expect(r.rows.find(x => x.key === 'linear')?.value).toBeCloseTo(22, 8);
    expect(r.rows.find(x => x.key === 'order')?.value).toBeCloseTo(264/9, 8);
  });

  it('carpet cost prices full purchased roll area plus net-area pad', () => {
    expect(value('carpet-cost-calculator','total',
      { length:20, width:12, rollWidth:12, waste:10, price:2, padPrice:1, tax:10, delivery:20, labor:100 },
      { price:'USD/ft2' })).toBeCloseTo(964.8, 8);
  });

  it('tile calculator rounds to whole boxes before area-based pricing', () => {
    const r=calculate('tile-calculator',
      { mode:0, length:12, width:10, tileLength:12, tileWidth:12, joint:0.125, tilesPerBox:10, waste:10, price:2 },
      { tileLength:'in', tileWidth:'in', joint:'in', price:'USD/ft2' });
    expect(r.rows.find(x => x.key === 'tiles')?.value).toBe(132);
    expect(r.rows.find(x => x.key === 'boxes')?.value).toBe(14);
    expect(r.rows.find(x => x.key === 'purchasedTiles')?.value).toBe(140);
    expect(r.rows.find(x => x.key === 'purchased')?.value).toBeCloseTo(140, 8);
    expect(r.rows.find(x => x.key === 'cost')?.value).toBeCloseTo(280, 8);
  });

  it('tile quantity calculator uses conservative straight-layout rows and columns', () => {
    const r=calculate('tile-quantity-calculator',
      { mode:0, length:12, width:10, tileLength:12, tileWidth:12, joint:0.125, tilesPerBox:10, waste:10 },
      { tileLength:'in', tileWidth:'in', joint:'in' });
    expect(r.rows.find(x => x.key === 'base')?.value).toBe(120);
    expect(r.rows.find(x => x.key === 'tiles')?.value).toBe(132);
    expect(r.rows.find(x => x.key === 'boxes')?.value).toBe(14);
  });

  it('tile cost prices the coverage actually purchased in whole boxes', () => {
    const r=calculate('tile-cost-calculator',
      { area:120, tileLength:12, tileWidth:12, tilesPerBox:10, waste:10, price:2, tax:10, delivery:20, labor:100 },
      { tileLength:'in', tileWidth:'in', price:'USD/ft2' });
    expect(r.rows.find(x => x.key === 'tiles')?.value).toBe(132);
    expect(r.rows.find(x => x.key === 'boxes')?.value).toBe(14);
    expect(r.rows.find(x => x.key === 'purchasedTiles')?.value).toBe(140);
    expect(r.rows.find(x => x.key === 'materials')?.value).toBeCloseTo(280, 8);
    expect(r.rows.find(x => x.key === 'total')?.value).toBeCloseTo(428, 8);
  });

  it('tile cost supports metric area pricing', () => {
    const purchasedM2=140/((1/0.3048)**2);
    expect(value('tile-cost-calculator','materials',
      { area:120, tileLength:12, tileWidth:12, tilesPerBox:10, waste:10, price:20, tax:0, delivery:0, labor:0 },
      { tileLength:'in', tileWidth:'in', price:'USD/m2' })).toBeCloseTo(purchasedM2*20, 8);
  });

  it('tile grout calculator derives joint volume and whole bags', () => {
    const r=calculate('tile-grout-calculator',
      { length:12, width:10, tileLength:12, tileWidth:12, joint:0.125, depth:0.375, density:1600, bagMass:5, waste:0 },
      { tileLength:'in', tileWidth:'in', joint:'in', depth:'in' });
    expect(r.rows.find(x => x.key === 'bags')?.value).toBe(1);
    expect(r.rows.find(x => x.key === 'liters')?.value).toBeCloseTo(2.1781610927, 8);
  });

  it('tile adhesive calculator uses manufacturer coverage and whole-container rounding', () => {
    expect(value('tile-adhesive-calculator','bags',
      { length:12, width:10, openings:0, coverage:50, waste:10 })).toBe(3);
  });

  it('flooring waste keeps pattern and cut/damage allowances explicit', () => {
    const r=calculate('flooring-waste-calculator',{ area:240, pattern:10, waste:10 });
    expect(r.rows.find(x => x.key === 'pattern')?.value).toBeCloseTo(264, 8);
    expect(r.rows.find(x => x.key === 'order')?.value).toBeCloseTo(290.4, 8);
    expect(r.rows.find(x => x.key === 'percent')?.value).toBeCloseTo(21, 8);
  });

  it('underlayment calculator rounds manufacturer net coverage to whole packages', () => {
    expect(value('underlayment-calculator','packages',
      { length:20, width:12, openings:0, coverage:100, waste:10 })).toBe(3);
  });

  it('flooring calculators reject exclusions larger than the measured floor', () => {
    const model=getModelForSlug('flooring-calculator');
    const raw={ length:10, width:10, openings:101, pattern:0, waste:0, coverage:20 };
    const units={ length:'ft', width:'ft', openings:'ft2', coverage:'ft2', price:'USD/unit' };
    const parsed=readInputs(model.fields,raw,units);
    expect(() => model.calculate(parsed,units)).toThrow(InputError);
  });
});
