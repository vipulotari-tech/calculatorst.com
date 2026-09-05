import { toFeet, wasteFactor, ceilDiscrete } from "../../utils/units";

export const GRAVEL_DENSITY: Record<string, number> = {
  pea: 1.35,
  crushed: 1.40,
  river: 1.33,
  limestone: 1.60,
  granite: 1.42,
  sand: 1.30,
  topsoil: 1.20,
  filldirt: 1.25,
  aggregate: 1.40,
};

export function gravelVolume(opts: {
  length: number; lengthUnit: string;
  width: number; widthUnit: string;
  depth: number; depthUnit: string;
  wastePercent: number;
  densityKey?: string; // pea, crushed, etc.
  densityTonsPerYd?: number; // override
}) {
  const Lf = toFeet(opts.length, opts.lengthUnit);
  const Wf = toFeet(opts.width, opts.widthUnit);
  const Df = toFeet(opts.depth, opts.depthUnit);
  const cuFt = Lf * Wf * Df;
  const cuYd = cuFt / 27;
  const w = wasteFactor(opts.wastePercent);
  const cuYdW = cuYd * w;
  const cuFtW = cuFt * w;
  const tonsPerYd = opts.densityTonsPerYd ?? GRAVEL_DENSITY[opts.densityKey ?? "crushed"] ?? 1.40;
  const tons = cuYd * tonsPerYd;
  const tonsW = cuYdW * tonsPerYd;
  const lb = tons * 2000;
  const lbW = tonsW * 2000;
  return { cuFt, cuYd, cuFtW, cuYdW, tons, tonsW, lb, lbW, tonsPerYd, wasteF: w, sqft: Lf * Wf };
}

export function gravelWeightOnly(opts: {
  cuYd: number;
  densityTonsPerYd: number;
  wastePercent: number;
}) {
  const w = wasteFactor(opts.wastePercent);
  const tons = opts.cuYd * opts.densityTonsPerYd;
  const tonsW = tons * w;
  return { tons, tonsW, lb: tons*2000, lbW: tonsW*2000, wasteF: w };
}

export function gravelDepth(opts: {
  length: number; lengthUnit: string;
  width: number; widthUnit: string;
  volumeYd: number; // yd3
}) {
  const Lf = toFeet(opts.length, opts.lengthUnit);
  const Wf = toFeet(opts.width, opts.widthUnit);
  const area = Lf * Wf; // sq ft
  const cuFt = opts.volumeYd * 27;
  const depthFt = area > 0 ? cuFt / area : 0;
  const depthIn = depthFt * 12;
  return { area, cuFt, depthFt, depthIn };
}

export function gravelCost(opts: {
  tonsW: number; cuYdW: number;
  price: number; priceUnit: "yd" | "ton";
}) {
  if (!isFinite(opts.price) || opts.price <= 0) return { cost: NaN };
  const cost = opts.priceUnit === "ton" ? opts.tonsW * opts.price : opts.cuYdW * opts.price;
  return { cost };
}
