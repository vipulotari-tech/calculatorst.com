import { toFeet, wasteFactor, ceilDiscrete } from "../../utils/units";

export function studCount(opts: {
  wallLength: number; lengthUnit: string;
  spacing: number; spacingUnit: string; // 16in typical
  wastePercent: number;
  corners?: number; // add per corner
  openings?: number; // add per opening
}) {
  const Lf = toFeet(opts.wallLength, opts.lengthUnit);
  const Sf = toFeet(opts.spacing, opts.spacingUnit);
  const base = Sf > 0 ? Math.ceil(Lf / Sf) + 1 : 0;
  const extra = (opts.corners ?? 0) + (opts.openings ?? 0);
  const total = base + extra;
  const w = wasteFactor(opts.wastePercent);
  return { Lf, Sf, base, total, totalW: ceilDiscrete(total * w), wasteF: w };
}

export function boardFeet(opts: {
  thicknessIn: number;
  widthIn: number;
  lengthFt: number;
  lengthUnit?: string;
  quantity?: number;
}) {
  const Lf = opts.lengthUnit ? toFeet(opts.lengthFt, opts.lengthUnit) : opts.lengthFt;
  const bfPer = (opts.thicknessIn * opts.widthIn * (Lf*12)) / 144; // T*W*L(in)/144
  // Simpler: bf = T*W*L(ft)/12
  const bfAlt = (opts.thicknessIn * opts.widthIn * Lf) / 12;
  const qty = opts.quantity ?? 1;
  return { bfPer: bfAlt, total: bfAlt * qty };
}

export function joistCount(opts: {
  spanLength: number; lengthUnit: string;
  spacing: number; spacingUnit: string;
  wastePercent: number;
}) {
  const Lf = toFeet(opts.spanLength, opts.lengthUnit);
  const Sf = toFeet(opts.spacing, opts.spacingUnit);
  const count = Sf >0 ? Math.ceil(Lf / Sf) + 1 : 0;
  const w = wasteFactor(opts.wastePercent);
  return { Lf, Sf, count, countW: ceilDiscrete(count * w), wasteF: w };
}

// Header/Beam: simplified — returns required depth table lookup placeholder
export function headerDepth(opts: { spanFt: number; loadPsf?: number }) {
  // Rule of thumb: header depth (in) ≈ span(ft) * 1.5? Not exact. Provide formula.
  const depthIn = opts.spanFt * 1.0; // placeholder: 1" per ft span for estimation
  return { depthIn };
}
