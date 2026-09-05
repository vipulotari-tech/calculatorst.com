import { toFeet, wasteFactor, ceilDiscrete } from "../../utils/units";

export function floorArea(opts: { length: number; lUnit: string; width: number; wUnit: string }) {
  const Lf = toFeet(opts.length, opts.lUnit);
  const Wf = toFeet(opts.width, opts.wUnit);
  return { Lf, Wf, area: Lf * Wf };
}

export function tileQuantity(opts: {
  areaSqFt: number;
  tileLength: number; tileLengthUnit: string;
  tileWidth: number; tileWidthUnit: string;
  groutJoint: number; groutUnit: string; // e.g., 1/8" =0.125 in
  wastePercent: number;
}) {
  const tl = toFeet(opts.tileLength, opts.tileLengthUnit);
  const tw = toFeet(opts.tileWidth, opts.tileWidthUnit);
  const gj = toFeet(opts.groutJoint, opts.groutUnit ?? "in");
  const effL = tl + gj;
  const effW = tw + gj;
  const tileArea = effL * effW;
  if (tileArea <= 0) return { tileArea: 0, tiles: 0, tilesW: 0, wasteF: 1 };
  const tiles = Math.ceil(opts.areaSqFt / tileArea);
  const w = wasteFactor(opts.wastePercent);
  return { tileArea, tiles, tilesW: ceilDiscrete(tiles * w), wasteF: w };
}

export function hardwoodBoxes(opts: {
  areaSqFt: number;
  coveragePerBox: number; // ft2 per box, e.g., 20
  wastePercent: number;
}) {
  const boxes = Math.ceil(opts.areaSqFt / opts.coveragePerBox);
  const w = wasteFactor(opts.wastePercent);
  return { boxes, boxesW: ceilDiscrete(boxes * w), wasteF: w };
}

export function carpet(opts: {
  length: number; lUnit: string;
  width: number; wUnit: string;
  rollWidthFt: number; // 12 typical
  wastePercent: number;
}) {
  const Lf = toFeet(opts.length, opts.lUnit);
  const Wf = toFeet(opts.width, opts.wUnit);
  const area = Lf * Wf;
  // Number of strips = ceil(width / rollWidth) etc. Simplified to area/roll logic but ensure seam handling:
  // If width <= rollWidth: one strip length = Lf
  // else need 2 strips etc. Use ceil(Wf / rollWidth) * Lf linear feet.
  const strips = Math.ceil(Wf / opts.rollWidthFt);
  const linearFt = strips * Lf;
  const sqYd = (linearFt * opts.rollWidthFt) / 9; // but actual needed = area plus waste
  // Alternative: carpet order by sq yd: area/9 * waste
  const sqYdNeeded = (area / 9) * wasteFactor(opts.wastePercent);
  return { area, strips, linearFt, sqYd, sqYdNeeded, wasteF: wasteFactor(opts.wastePercent) };
}

export function vinylLaminate(opts: {
  areaSqFt: number;
  coveragePerBox: number;
  wastePercent: number;
}) {
  return hardwoodBoxes(opts);
}

export function underlayment(opts: { areaSqFt: number; coveragePerRoll: number; wastePercent: number }) {
  const rolls = Math.ceil(opts.areaSqFt / opts.coveragePerRoll);
  const w = wasteFactor(opts.wastePercent);
  return { rolls, rollsW: ceilDiscrete(rolls * w), wasteF: w };
}

export function groutVolume(opts: {
  areaSqFt: number;
  tileArea: number; // eff area including grout
  jointWidthFt: number;
  tileThicknessFt?: number;
}) {
  // Grout volume approx: (joint width * tile thickness * total joint length)
  // Simplified placeholder: 0.1 ft3 per 100 ft2
  return { estimate: opts.areaSqFt * 0.001 };
}
