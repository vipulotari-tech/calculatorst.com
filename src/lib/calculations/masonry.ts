import { toFeet, toInches, wasteFactor, ceilDiscrete } from "../../utils/units";

// Standard brick: 7.5" x 2.25" with joint 3/8" (0.375") → 7.875 x 2.625 = 20.67 in2 per brick face
// Effective bricks per ft2: 144 / 20.67 ≈ 6.97 (often quoted 6.8-7)
// CMU: 16" x 8" face with 3/8" joint → 16.375? Actually CMU 15.625+0.375 =16, 7.625+0.375=8 → 128 in2 → 144/128=1.125 per ft2

export interface BrickOpts {
  wallLength: number; wallLengthUnit: string;
  wallHeight: number; wallHeightUnit: string;
  brickLength: number; brickLengthUnit: string; // e.g., 7.5 in
  brickHeight: number; brickHeightUnit: string; // e.g., 2.25 in
  jointThickness: number; jointUnit: string; // e.g., 0.375 in
  wastePercent: number;
  openingsAreaSqFt?: number; // deduct
}

export function brickQuantity(opts: BrickOpts) {
  const wallLf = toFeet(opts.wallLength, opts.wallLengthUnit);
  const wallHf = toFeet(opts.wallHeight, opts.wallHeightUnit);
  const wallAreaSqFt = wallLf * wallHf - (opts.openingsAreaSqFt ?? 0);
  const wallAreaIn2 = wallAreaSqFt * 144;

  const blIn = toInches(opts.brickLength, opts.brickLengthUnit);
  const bhIn = toInches(opts.brickHeight, opts.brickHeightUnit);
  const jIn = toInches(opts.jointThickness, opts.jointUnit);

  const effLen = blIn + jIn;
  const effH = bhIn + jIn;
  const brickAreaIn2 = effLen * effH;

  const bricks = brickAreaIn2 > 0 ? Math.ceil(wallAreaIn2 / brickAreaIn2) : 0;
  const w = wasteFactor(opts.wastePercent);
  const bricksW = ceilDiscrete(bricks * w);

  const bricksPerSqFt = brickAreaIn2 > 0 ? 144 / brickAreaIn2 : 0;

  return { wallAreaSqFt, wallAreaIn2, brickAreaIn2, bricks, bricksW, bricksPerSqFt, wasteF: w, effLen, effH };
}

// Brick with only wall area + bricks per sq ft (alternative UI where inputs are simpler)
export function brickQuantitySimple(opts: {
  wallAreaSqFt: number;
  bricksPerSqFt: number; // e.g., 6.8
  wastePercent: number;
}) {
  const bricks = Math.ceil(opts.wallAreaSqFt * opts.bricksPerSqFt);
  const w = wasteFactor(opts.wastePercent);
  return { bricks, bricksW: ceilDiscrete(bricks * w), wasteF: w };
}

export function cmuQuantity(opts: {
  wallLength: number; wallLengthUnit: string;
  wallHeight: number; wallHeightUnit: string;
  wastePercent: number;
  openingsAreaSqFt?: number;
}) {
  const Lf = toFeet(opts.wallLength, opts.wallLengthUnit);
  const Hf = toFeet(opts.wallHeight, opts.wallHeightUnit);
  const wallArea = Lf * Hf - (opts.openingsAreaSqFt ?? 0);
  // CMU face 16x8 =128 in2 with joint → 1.125 per ft2
  const perSqFt = 1.125;
  const blocks = Math.ceil(wallArea * perSqFt);
  const w = wasteFactor(opts.wastePercent);
  return { wallArea, blocks, blocksW: ceilDiscrete(blocks * w), perSqFt, wasteF: w };
}

export function mortarVolumeForBrick(opts: {
  bricks: number; // without waste? use with waste for ordering
  brickLengthIn: number;
  brickHeightIn: number;
  jointIn: number;
  jointWidthIn?: number; // wythe thickness, e.g., 3.5"
}) {
  // Rough: mortar per brick = (brickAreaWithJoint - brickArea) * jointWidth
  // Simplified: per 1000 bricks ~ 5-7 ft3. Use geometric:
  const wallAreaForBricks = opts.bricks * (opts.brickLengthIn + opts.jointIn) * (opts.brickHeightIn + opts.jointIn); // in2
  // Not needed for most; return estimate 0.02 yd3 per 100 blocks for CMU context
  return { estimate: opts.bricks * 0.005 }; // placeholder ft3
}

export function brickWeight(opts: { quantity: number; unitWeightLb: number; wastePercent: number }) {
  const w = wasteFactor(opts.wastePercent);
  const lb = opts.quantity * opts.unitWeightLb;
  const lbW = lb * w;
  return { lb, lbW, tons: lb/2000, tonsW: lbW/2000, wasteF: w };
}

export function brickCost(opts: { quantityW: number; pricePerUnit: number }) {
  return { cost: opts.quantityW * opts.pricePerUnit };
}
