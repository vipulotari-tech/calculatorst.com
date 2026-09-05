import { toFeet, wasteFactor, ceilDiscrete } from "../../utils/units";

// Rebar weight per foot (lb/ft) per size #3-#11 per CRSI
export const REBAR_WEIGHT: Record<string, number> = {
  "3": 0.376,
  "4": 0.668,
  "5": 1.043,
  "6": 1.502,
  "7": 2.044,
  "8": 2.670,
  "9": 3.400,
  "10": 4.303,
  "11": 5.313,
};
export const REBAR_DIA_IN: Record<string, number> = {
  "3": 0.375,
  "4": 0.5,
  "5": 0.625,
  "6": 0.75,
  "7": 0.875,
  "8": 1.0,
  "9": 1.128,
  "10": 1.27,
  "11": 1.41,
};

// Count from length and spacing: ceil(length/spacing)+1
export function rebarCount(opts: {
  length: number; lengthUnit: string; // total length to cover (e.g., 20 ft wall)
  spacing: number; spacingUnit: string; // on-center (e.g., 16 in)
}) {
  const Lf = toFeet(opts.length, opts.lengthUnit);
  const Sf = toFeet(opts.spacing, opts.spacingUnit);
  if (Sf <= 0) return { count: 0, Lf, Sf };
  const count = Math.ceil(Lf / Sf) + 1;
  return { count, Lf, Sf };
}

export function rebarGrid(opts: {
  length: number; lengthUnit: string;
  width: number; widthUnit: string;
  spacingLong: number; spacingLongUnit: string; // e.g., 16 in
  spacingShort: number; spacingShortUnit: string;
  wastePercent: number;
}) {
  const cx = rebarCount({ length: opts.length, lengthUnit: opts.lengthUnit, spacing: opts.spacingLong, spacingUnit: opts.spacingLongUnit });
  const cy = rebarCount({ length: opts.width, lengthUnit: opts.widthUnit, spacing: opts.spacingShort, spacingUnit: opts.spacingShortUnit });
  // Grid: bars in one direction = countX * width length each, etc. Simplified: total bars = countX + countY
  // But total length = countX*width + countY*length
  const Lf = toFeet(opts.length, opts.lengthUnit);
  const Wf = toFeet(opts.width, opts.widthUnit);
  const totalBars = cx.count + cy.count;
  const totalLengthFt = cx.count * Wf + cy.count * Lf;
  const w = wasteFactor(opts.wastePercent);
  return { countX: cx.count, countY: cy.count, totalBars, totalLengthFt, totalLengthFtW: totalLengthFt * w, wasteF: w };
}

export function rebarWeight(opts: {
  totalLengthFt: number;
  size: string; // "4"
  wastePercent: number;
}) {
  const wPerFt = REBAR_WEIGHT[opts.size] ?? 0.668;
  const totalLb = opts.totalLengthFt * wPerFt;
  const w = wasteFactor(opts.wastePercent);
  const totalLbW = totalLb * w;
  return { wPerFt, totalLb, totalLbW, tons: totalLb/2000, tonsW: totalLbW/2000, wasteF: w };
}

export function rebarLengthTotal(opts: {
  count: number;
  eachLength: number; eachLengthUnit: string;
  wastePercent: number;
}) {
  const eachFt = toFeet(opts.eachLength, opts.eachLengthUnit);
  const total = opts.count * eachFt;
  const w = wasteFactor(opts.wastePercent);
  return { eachFt, total, totalW: total * w, wasteF: w };
}

export function lapLength(opts: { size: string; laps?: number }) {
  const dia = REBAR_DIA_IN[opts.size] ?? 0.5;
  // ACI 318 Class B splice ~ 40*d
  const lapIn = dia * 40;
  const lapFt = lapIn / 12;
  const totalLapFt = lapFt * (opts.laps ?? 1);
  return { dia, lapIn, lapFt, totalLapFt };
}

export function rebarCost(opts: { tonsW: number; pricePerTon: number }) {
  return { cost: opts.tonsW * opts.pricePerTon };
}

export function chairCount(opts: {
  areaSqFt: number; // slab area
  spacingFt: number; // chairs every 4 ft typical -> 1 per 16 sf? Use 4 ft o.c. both ways = 1 per 16 sf
  wastePercent: number;
}) {
  const count = Math.ceil(opts.areaSqFt / (opts.spacingFt * opts.spacingFt));
  const w = wasteFactor(opts.wastePercent);
  return { count, countW: ceilDiscrete(count * w), wasteF: w };
}
