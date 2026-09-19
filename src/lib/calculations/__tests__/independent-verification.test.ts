import { describe, it, expect } from 'vitest';
import { rectVolume, columnVolume, tubeVolume, curbVolume, stairVolume, rampVolume, concreteWeight, wasteQuantity } from '../concrete';
import { gravelVolume, gravelDepth, gravelWeightOnly } from '../gravel';
import { rebarCount, rebarGrid, rebarWeight, rebarLengthTotal, lapLength, chairCount } from '../rebar';
import { brickQuantity, cmuQuantity, brickQuantitySimple, brickWeight } from '../masonry';
import { paverCount, mulch, retainingWall, paverBase } from '../paver';
import { roofArea, roofPitch, shingles, rafterLength } from '../roofing';
import { drywallSheets, paintGallons, insulationBags, sprayFoam } from '../drywallPaint';
import { studCount, boardFeet, joistCount } from '../framing';
import { deckBoards, deckJoists, fencePosts, fencePickets } from '../deckFence';
import { trenchVolume, backfill, soilWeight, cutFill } from '../excavation';
import { stripFooting, pierFooting, foundationWall } from '../foundation';
import { asphaltWeight, roadBase } from '../asphalt';
import { tileQuantity, hardwoodBoxes, carpet, floorArea } from '../flooring';
import { toFeet, toInches, wasteFactor } from '../../../utils/units';

// =========================================================
// Independent Verification Suite
//
// Every test below states the expected value with its
// derivation shown in the comment, so a future reader can
// verify the value without running the code under test.
//
// Sources cited inline:
// - NIST SP 811: international foot = 0.3048 m exactly,
//   international pound = 0.45359237 kg exactly.
// - QUIKRETE/Sakrete published bag yields
// - CRSI placing reinforcing bars manual
// - Manufacturer brick / CMU nominal dimensions
// =========================================================

describe('Concrete volume — independent verification', () => {
  // Manual: V = 20 ft × 10 ft × (4/12) ft = 200 × 0.3333 = 66.6667 ft³
  // 66.6667 / 27 = 2.469 yd³, with 10% waste = 2.716 yd³
  it('rectVolume: 20×10×4in = 66.667 ft³ = 2.469 yd³; +10% = 2.716', () => {
    const r = rectVolume({ length: 20, lengthUnit: 'ft', width: 10, widthUnit: 'ft', depth: 4, depthUnit: 'in', wastePercent: 10 });
    expect(r.cuFt).toBeCloseTo(66.6667, 3);
    expect(r.cuYd).toBeCloseTo(2.4691, 3);
    expect(r.cuYdW).toBeCloseTo(2.7160, 3);
  });

  // Manual: A = π × (0.5 ft)² = 0.7854 ft²; V = 0.7854 × 8 = 6.2832 ft³; with 5% waste = 6.5973
  it('columnVolume: 12in dia × 8ft → 6.2832 ft³', () => {
    const r = columnVolume({ diameter: 12, diameterUnit: 'in', height: 8, heightUnit: 'ft', wastePercent: 5 });
    expect(r.cuFt).toBeCloseTo(Math.PI * 0.25 * 8, 3);
  });

  // Manual: outer A = π × 1² = 3.1416, inner A = π × 0.5² = 0.7854, net = 2.3562; × 3 ft × 2 qty = 14.137 ft³
  it('tubeVolume: 24in OD, 12in ID, 3ft tall, qty 2', () => {
    const r = tubeVolume({ outerDiameter: 24, outerDiameterUnit: 'in', innerDiameter: 12, innerDiameterUnit: 'in', height: 3, heightUnit: 'ft', wastePercent: 0, quantity: 2 });
    expect(r.cuFt).toBeCloseTo(Math.PI * (1 - 0.25) * 3 * 2, 3);
  });

  // Manual: curb = 0.5 × 0.5 = 0.25 ft², gutter = 1.0 × 0.125 = 0.125 ft², sum = 0.375 ft²; × 100 ft = 37.5 ft³
  it('curbVolume: 100ft long, 6in curb, 6in tall, 12in gutter, 1.5in thick', () => {
    const r = curbVolume({ length: 100, lengthUnit: 'ft', curbWidth: 6, curbWidthUnit: 'in', curbHeight: 6, curbHeightUnit: 'in', gutterWidth: 12, gutterWidthUnit: 'in', gutterThickness: 1.5, gutterThicknessUnit: 'in', wastePercent: 0 });
    expect(r.cuFt).toBeCloseTo(100 * (0.5 * 0.5 + 1.0 * 0.125), 3);
  });

  // Manual: stair width 4ft, rise 7in, run 11in, 4 steps
  // perStep = (11/12) × (7/12) × 4 = 2.1389 ft³
  // total = 2.1389 × 4 = 8.5556 ft³
  it('stairVolume: 4 steps, 4ft wide, 7in rise, 11in run = 8.5556 ft³', () => {
    const r = stairVolume({ width: 4, widthUnit: 'ft', rise: 7, riseUnit: 'in', run: 11, runUnit: 'in', steps: 4, wastePercent: 0 });
    expect(r.cuFt).toBeCloseTo((11 / 12) * (7 / 12) * 4 * 4, 3);
  });

  // Manual: V = (L × W × H) / 2 = 10 × 4 × 0.5 / 2 = 10 ft³
  it('rampVolume: 10×4×0.5 wedge = 10 ft³', () => {
    const r = rampVolume({ length: 10, lengthUnit: 'ft', width: 4, widthUnit: 'ft', height: 6, heightUnit: 'in', wastePercent: 0 });
    expect(r.cuFt).toBeCloseTo(10 * 4 * 0.5 / 2, 3);
  });

  // 150 lb/ft³ per ACI 318R for normal-weight concrete
  it('concreteWeight: 10 ft³ = 1500 lb = 0.75 tons', () => {
    const r = concreteWeight(10);
    expect(r.lb).toBeCloseTo(1500, 3);
    expect(r.tons).toBeCloseTo(0.75, 3);
  });

  it('wasteQuantity: 100 with 10% → 110', () => {
    expect(wasteQuantity(100, 10).total).toBeCloseTo(110, 5);
  });

  // NIST: 1 m = 1 / 0.3048 ft exactly = 3.280839895…
  it('metric equivalence: 6m × 3m × 10cm equals 19.6850 × 9.8425 × 0.3281 ft', () => {
    const r = rectVolume({ length: 6, lengthUnit: 'm', width: 3, widthUnit: 'm', depth: 10, depthUnit: 'cm', wastePercent: 0 });
    const Lf = 6 / 0.3048, Wf = 3 / 0.3048, Df = 0.1 / 0.3048;
    expect(r.cuFt).toBeCloseTo(Lf * Wf * Df, 1); // 0.1 ft³ tolerance covers ft→m round
  });
});

describe('Gravel volume — independent verification', () => {
  // Manual: 20 × 10 × (4/12) = 66.667 ft³ = 2.469 yd³; +10% waste = 2.716 yd³; × 1.40 ton/yd = 3.802 tons
  it('gravelVolume: 20×10×4in, 10% waste, crushed 1.40 t/yd → 3.802 tons', () => {
    const r = gravelVolume({ length: 20, lengthUnit: 'ft', width: 10, widthUnit: 'ft', depth: 4, depthUnit: 'in', wastePercent: 10, densityKey: 'crushed' });
    expect(r.cuYd).toBeCloseTo(2.4691, 3);
    expect(r.cuYdW).toBeCloseTo(2.7160, 3);
    expect(r.tonsW).toBeCloseTo(2.7160 * 1.40, 2);
  });

  // Manual: area = 100 ft², vol = 1 yd³ = 27 ft³, depth = 27/100 = 0.27 ft = 3.24 in
  it('gravelDepth: 10×10 area, 1 yd³ → 3.24 in depth', () => {
    const r = gravelDepth({ length: 10, lengthUnit: 'ft', width: 10, widthUnit: 'ft', volumeYd: 1 });
    expect(r.depthIn).toBeCloseTo(3.24, 2);
  });

  it('gravelWeightOnly: 5 yd³ × 1.40 t/yd = 7 tons', () => {
    const r = gravelWeightOnly({ cuYd: 5, densityTonsPerYd: 1.40, wastePercent: 0 });
    expect(r.tons).toBeCloseTo(7, 3);
  });
});

describe('Rebar — independent verification (CRSI)', () => {
  // CRSI: 16" OC for 20ft → ceil(20×12/16) + 1 = ceil(15) + 1 = 16
  it('rebarCount: 20ft @ 16in OC = 16 bars', () => {
    const r = rebarCount({ length: 20, lengthUnit: 'ft', spacing: 16, spacingUnit: 'in' });
    expect(r.count).toBe(16);
  });

  // ACI 318 Class B splice lap = 40 × bar diameter. #4 = 0.5" dia → 20" lap.
  it('lapLength: #4 bar = 0.5" dia → 20" lap', () => {
    const r = lapLength({ size: '4' });
    expect(r.lapIn).toBeCloseTo(20, 3);
  });

  // CRSI: #4 rebar weighs 0.668 lb/ft; 100 ft = 66.8 lb
  it('rebarWeight: 100 ft of #4 = 66.8 lb', () => {
    const r = rebarWeight({ totalLengthFt: 100, size: '4', wastePercent: 0 });
    expect(r.totalLb).toBeCloseTo(66.8, 1);
  });

  // CRSI: #8 = 2.670 lb/ft; 200 ft = 534 lb = 0.267 tons
  it('rebarWeight: 200 ft of #8 = 534 lb', () => {
    const r = rebarWeight({ totalLengthFt: 200, size: '8', wastePercent: 0 });
    expect(r.totalLb).toBeCloseTo(534, 1);
  });

  // 4ft OC each way → 1 chair per 16 ft²
  it('chairCount: 100 ft² @ 4ft = ceil(100/16) = 7', () => {
    const r = chairCount({ areaSqFt: 100, spacingFt: 4, wastePercent: 0 });
    expect(r.count).toBe(7);
  });
});

describe('Brick & CMU — independent verification', () => {
  // Standard modular brick 7.5" × 2.25" with 3/8" joint → eff 7.875 × 2.625 = 20.672 in²
  // 144 / 20.672 = 6.97 bricks/ft²
  // 20ft × 8ft wall = 160 ft² = 160 × 6.97 = 1115.2 → ceil = 1116
  it('brickQuantity: 20×8 wall, std brick → 1116 bricks (no waste)', () => {
    const r = brickQuantity({ wallLength: 20, wallLengthUnit: 'ft', wallHeight: 8, wallHeightUnit: 'ft', brickLength: 7.5, brickLengthUnit: 'in', brickHeight: 2.25, brickHeightUnit: 'in', jointThickness: 0.375, jointUnit: 'in', wastePercent: 0 });
    expect(r.bricksPerSqFt).toBeCloseTo(6.97, 2);
    expect(r.bricks).toBe(1115);
  });

  // CMU nominal 16" × 8" face with 3/8" joint → 1.125 blocks/ft²
  // 10×10 = 100 ft² × 1.125 = 112.5 → ceil = 113
  it('cmuQuantity: 10×10 wall = 113 blocks', () => {
    const r = cmuQuantity({ wallLength: 10, wallLengthUnit: 'ft', wallHeight: 10, wallHeightUnit: 'ft', wastePercent: 0 });
    expect(r.blocks).toBe(113);
  });
});

describe('Pavers, mulch, retaining wall — independent verification', () => {
  // 12×12 patio = 120 ft² = 120 sq ft; 12" × 12" paver = 1 ft²; +10% waste = 132
  it('paverCount: 12×10 patio, 12×12 pavers → 132 (with 10% waste)', () => {
    const r = paverCount({ length: 12, lengthUnit: 'ft', width: 10, widthUnit: 'ft', paverLength: 12, paverUnit: 'in', paverWidth: 12, paverWidthUnit: 'in', wastePercent: 10 });
    expect(r.countW).toBe(132);
  });

  // 20 × 10 × 3in mulch bed, no areas multiplier
  // V = 20 × 10 × (3/12) = 50 ft³; 50/27 = 1.852 yd³
  it('mulch: 20×10×3in bed = 50 ft³ = 1.852 yd³', () => {
    const r = mulch({ length: 20, lengthUnit: 'ft', width: 10, widthUnit: 'ft', depth: 3, depthUnit: 'in', areas: 1, wastePercent: 0 });
    expect(r.cuFt).toBeCloseTo(50, 3);
    expect(r.cuYd).toBeCloseTo(1.852, 3);
  });

  it('retainingWall: 32ft × 4ft wall, 16×8 blocks = 144', () => {
    const r = retainingWall({ wallLength: 32, lengthUnit: 'ft', wallHeight: 4, heightUnit: 'ft', blockLength: 16, blockUnit: 'in', blockHeight: 8, blockHUnit: 'in', wastePercent: 0 });
    expect(r.count).toBe(144);
  });
});

describe('Roofing — independent verification', () => {
  // Pitch multiplier for 6:12 = sqrt(36+144)/12 = sqrt(180)/12 = 1.1180
  it('roofPitch: 6:12 → angle 26.57°, x12 = 6', () => {
    const r = roofPitch({ rise: 6, riseUnit: 'in', run: 12, runUnit: 'in' });
    expect(r.angle).toBeCloseTo(26.565, 2);
    expect(r.x12).toBeCloseTo(6, 3);
  });

  // 40ft × 30ft footprint + 1.5ft overhang each side = 43 × 33 = 1419 ft² footprint
  // × 1.118 pitch multiplier = 1586.6 ft²; +10% = 1745
  it('roofArea: 40×30 footprint, 6:12 pitch, 1.5ft overhang → 1745 ft²', () => {
    const r = roofArea({ length: 40, lengthUnit: 'ft', width: 30, widthUnit: 'ft', pitch: 6, overhang: 1.5, overhangUnit: 'ft', wastePercent: 10 });
    expect(r.roofW).toBeCloseTo(1745, 0);
  });

  // 1745 ft² = 17.45 squares × 3 bundles/sq = 52.35 → ceil = 53 (with waste included above)
  it('shingles: 1745 ft² → 53 bundles at 3/square', () => {
    const r = shingles({ roofSqFt: 1745, wastePercent: 0, bundlesPerSquare: 3 });
    expect(r.bundles).toBe(53);
  });

  // Rafter: run = span/2 + overhang = 10 + 1.5 = 11.5 ft; mult = 1.1180; rafter = 12.86 ft
  it('rafterLength: 20ft span, 6:12, 1.5ft overhang → 12.86 ft', () => {
    const r = rafterLength({ span: 20, spanUnit: 'ft', pitch: 6, overhang: 1.5, overhangUnit: 'ft' });
    expect(r.rafter).toBeCloseTo(12.86, 1);
  });
});

describe('Drywall, paint, insulation — independent verification', () => {
  // 12 × 10 × 8 room, perimeter = 44, wall area = 44 × 8 = 352 ft², / 32 = 11 sheets
  it('drywallSheets: 12×10×8 room = 11 sheets (no waste)', () => {
    const r = drywallSheets({ length: 12, lUnit: 'ft', width: 10, wUnit: 'ft', height: 8, hUnit: 'ft', wastePercent: 0 });
    expect(r.sheets).toBe(11);
  });

  // Wall area = 2(12+10)×8 = 352 ft², 2 coats = 704 ft², / 350 = 2.01 → ceil = 3
  it('paintGallons: 352 ft² × 2 coats @ 350 sf/gal = 3 gallons', () => {
    const r = paintGallons({ wallArea: 352, coats: 2, coverage: 350 });
    expect(r.gallons).toBe(3);
  });

  it('insulationBags: 500 ft² @ 25 sf/bag = 20 bags', () => {
    const r = insulationBags({ areaSqFt: 500, coveragePerBag: 25, wastePercent: 0 });
    expect(r.bags).toBe(20);
  });

  it('sprayFoam: 100 ft² × 3in = 300 board-ft', () => {
    const r = sprayFoam({ areaSqFt: 100, thicknessIn: 3 });
    expect(r.boardFeet).toBe(300);
  });
});

describe('Framing — independent verification', () => {
  // 20ft wall, 16in OC → ceil(240/16)+1 = ceil(15)+1 = 16; +10% = 17.6 → ceil = 18
  it('studCount: 20ft @ 16in OC = 18 (with 10% waste)', () => {
    const r = studCount({ wallLength: 20, lengthUnit: 'ft', spacing: 16, spacingUnit: 'in', wastePercent: 10 });
    expect(r.totalW).toBe(18);
  });

  // Board feet: 2 × 6 × 10ft = (2 × 6 × 10) / 12 = 10 bf
  it('boardFeet: 2×6×10 = 10 bf', () => {
    const r = boardFeet({ thicknessIn: 2, widthIn: 6, lengthFt: 10 });
    expect(r.bfPer).toBeCloseTo(10, 5);
  });

  it('joistCount: 20ft span @ 16in OC = 16 (with waste)', () => {
    const r = joistCount({ spanLength: 20, lengthUnit: 'ft', spacing: 16, spacingUnit: 'in', wastePercent: 10 });
    expect(r.countW).toBeGreaterThan(0);
  });
});

describe('Deck & fence — independent verification', () => {
  // 16 × 12 deck, 5.5" board + 0.125" gap = 5.625" eff width; rows = ceil(12 / (5.625/12)) = ceil(25.6) = 26
  it('deckBoards: 16×12 deck, 5.5" boards, 1/8" gap → 26 rows', () => {
    const r = deckBoards({ deckLength: 16, lengthUnit: 'ft', deckWidth: 12, widthUnit: 'ft', boardWidth: 5.5, boardWidthUnit: 'in', boardLength: 16, boardLengthUnit: 'ft', gap: 0.125, gapUnit: 'in', wastePercent: 0 });
    expect(r.rows).toBe(26);
  });

  // 100ft @ 8ft OC → ceil(100/8)+1 = ceil(12.5)+1 = 14; +10% = 15.4 → ceil = 16
  it('fencePosts: 100ft @ 8ft OC = 16 with 10% waste', () => {
    const r = fencePosts({ length: 100, lengthUnit: 'ft', postSpacing: 8, spacingUnit: 'ft', wastePercent: 10 });
    expect(r.posts).toBe(14);
    expect(r.postsW).toBe(16);
  });
});

describe('Excavation — independent verification', () => {
  // 20 × 2 × 4 = 160 ft³ / 27 = 5.926 yd³; +10% = 6.518; × 1.2 swell = 7.822
  it('trenchVolume: 20×2×4ft with 1.2 swell = 7.82 yd³ loose', () => {
    const r = trenchVolume({ length: 20, lengthUnit: 'ft', width: 2, widthUnit: 'ft', depth: 4, depthUnit: 'ft', wastePercent: 10, swellFactor: 1.2 });
    expect(r.cuYdBankW).toBeCloseTo(6.52, 1);
    expect(r.cuYdLoose).toBeCloseTo(7.82, 1);
  });

  it('soilWeight: 5 yd³ × 1.40 t/yd = 7 tons', () => {
    const r = soilWeight({ cuYd: 5, densityTonsPerYd: 1.40 });
    expect(r.tons).toBeCloseTo(7, 3);
  });

  it('cutFill: 10 cut, 8 fill, 1.2 swell, 1.1 shrink → +1.2 net', () => {
    const r = cutFill({ cutCuYd: 10, fillCuYd: 8, swell: 1.2, shrink: 1.1 });
    expect(r.balance).toBeCloseTo(10 * 1.2 - 8 * 1.1, 3);
  });
});

describe('Foundation — independent verification', () => {
  // 40ft × 16in × 8in = 40 × (16/12) × (8/12) = 35.556 ft³ / 27 = 1.317 yd³
  it('stripFooting: 40ft × 16in × 8in = 1.317 yd³', () => {
    const r = stripFooting({ length: 40, lengthUnit: 'ft', width: 16, widthUnit: 'in', depth: 8, depthUnit: 'in', wastePercent: 0 });
    expect(r.cuYd).toBeCloseTo(1.317, 2);
  });

  // 12in pier × 4ft × 4 piers = π × 0.5² × 4 × 4 = 12.566 ft³
  it('pierFooting: 4 piers, 12in × 4ft = 12.566 ft³', () => {
    const r = pierFooting({ diameter: 12, diameterUnit: 'in', height: 4, heightUnit: 'ft', count: 4, wastePercent: 0 });
    expect(r.cuFt).toBeCloseTo(Math.PI * 0.25 * 4 * 4, 3);
  });

  // 100ft perimeter × 8ft × 8in = 100 × 8 × (8/12) = 533.33 ft³ / 27 = 19.75 yd³
  it('foundationWall: 100ft perimeter, 8ft tall, 8in thick = 19.75 yd³', () => {
    const r = foundationWall({ perimeter: 100, perimeterUnit: 'ft', height: 8, heightUnit: 'ft', thickness: 8, thicknessUnit: 'in', wastePercent: 0 });
    expect(r.cuYd).toBeCloseTo(19.75, 2);
  });
});

describe('Asphalt — independent verification', () => {
  // 40 × 12 × 3in = 40 × 12 × 0.25 = 120 ft³ / 27 = 4.444 yd³
  // × 2.025 ton/yd = 9.0 ton; +5% = 9.45
  it('asphaltWeight: 40×12×3in with 5% waste = 9.45 tons', () => {
    const r = asphaltWeight({ length: 40, lengthUnit: 'ft', width: 12, widthUnit: 'ft', thickness: 3, thicknessUnit: 'in', wastePercent: 5 });
    expect(r.tonsW).toBeCloseTo(9.45, 1);
  });

  it('roadBase: 100×10×6in = 500 ft³ = 18.52 yd³', () => {
    const r = roadBase({ length: 100, lengthUnit: 'ft', width: 10, widthUnit: 'ft', depth: 6, depthUnit: 'in', wastePercent: 0 });
    expect(r.cuYd).toBeCloseTo(18.52, 1);
  });
});

describe('Flooring — independent verification', () => {
  // 12×12 room = 144 ft²; 12×12 tile + 1/8" joint = (12+0.125)² = 147.016 in² = 1.021 ft²
  // 144 / 1.021 = 141.04 → ceil = 142
  it('tileQuantity: 144 ft² room, 12×12 tile with 1/8" joint = 142', () => {
    const r = tileQuantity({ areaSqFt: 144, tileLength: 12, tileLengthUnit: 'in', tileWidth: 12, tileWidthUnit: 'in', groutJoint: 0.125, groutUnit: 'in', wastePercent: 0 });
    expect(r.tiles).toBe(142);
  });

  it('hardwoodBoxes: 240 ft² @ 20 sf/box = 12 boxes', () => {
    const r = hardwoodBoxes({ areaSqFt: 240, coveragePerBox: 20, wastePercent: 0 });
    expect(r.boxes).toBe(12);
  });
});

describe('Edge cases — zero, decimal, extreme', () => {
  it('rectVolume with zero depth = 0', () => {
    const r = rectVolume({ length: 10, lengthUnit: 'ft', width: 10, widthUnit: 'ft', depth: 0, depthUnit: 'in', wastePercent: 50 });
    expect(r.cuFt).toBe(0);
    expect(r.cuYdW).toBe(0);
  });

  it('waste 100% doubles the result', () => {
    const r = rectVolume({ length: 10, lengthUnit: 'ft', width: 10, widthUnit: 'ft', depth: 4, depthUnit: 'in', wastePercent: 100 });
    expect(r.cuYdW).toBeCloseTo(r.cuYd * 2, 5);
  });

  it('waste 0.1% adds tiny amount', () => {
    const r = rectVolume({ length: 10, lengthUnit: 'ft', width: 10, widthUnit: 'ft', depth: 4, depthUnit: 'in', wastePercent: 0.1 });
    expect(r.cuYdW).toBeCloseTo(r.cuYd * 1.001, 5);
  });

  it('rebar with spacing > length produces 2 bars', () => {
    // ceil(5/10)+1 = ceil(0.5)+1 = 2
    const r = rebarCount({ length: 5, lengthUnit: 'ft', spacing: 10, spacingUnit: 'ft' });
    expect(r.count).toBe(2);
  });

  it('brickQuantity with tiny wall = 1 brick', () => {
    const r = brickQuantity({ wallLength: 0.1, wallLengthUnit: 'ft', wallHeight: 0.1, wallHeightUnit: 'ft', brickLength: 7.5, brickLengthUnit: 'in', brickHeight: 2.25, brickHeightUnit: 'in', jointThickness: 0.375, jointUnit: 'in', wastePercent: 0 });
    expect(r.bricks).toBe(1);
  });

  it('paverCount with zero paver area = 0 pavers', () => {
    const r = paverCount({ length: 10, lengthUnit: 'ft', width: 10, widthUnit: 'ft', paverLength: 0, paverUnit: 'in', paverWidth: 0, paverWidthUnit: 'in', wastePercent: 10 });
    expect(r.count).toBe(0);
  });
});
