import { toFeet, wasteFactor } from "../../utils/units";

// Asphalt density: 145 lb/ft3 = 3915 lb/yd3? Actually 1 yd3=27 ft3*145=3915 lb =1.9575 ton ; commonly quoted 2.025 t/yd3 (145*27/2000=1.9575) but industry uses 2.028. We'll use 2.025 for consistency with docs.
export const ASPHALT_TONS_PER_YD = 2.025;

export function asphaltWeight(opts: {
  length: number; lengthUnit: string;
  width: number; widthUnit: string;
  thickness: number; thicknessUnit: string;
  wastePercent: number;
}) {
  const Lf = toFeet(opts.length, opts.lengthUnit);
  const Wf = toFeet(opts.width, opts.widthUnit);
  const Tf = toFeet(opts.thickness, opts.thicknessUnit);
  const sqft = Lf * Wf;
  const cuFt = sqft * Tf;
  const cuYd = cuFt / 27;
  const w = wasteFactor(opts.wastePercent);
  const cuYdW = cuYd * w;
  const tons = cuYd * ASPHALT_TONS_PER_YD;
  const tonsW = tons * w;
  const lb = tons * 2000;
  const lbW = tonsW * 2000;
  return { sqft, cuFt, cuYd, cuYdW, tons, tonsW, lb, lbW, wasteF: w };
}

export function asphaltArea(opts: {
  length: number; lengthUnit: string;
  width: number; widthUnit: string;
}) {
  const Lf = toFeet(opts.length, opts.lengthUnit);
  const Wf = toFeet(opts.width, opts.widthUnit);
  return { sqft: Lf * Wf };
}

export function roadBase(opts: {
  length: number; lengthUnit: string;
  width: number; widthUnit: string;
  depth: number; depthUnit: string;
  wastePercent: number;
}) {
  const Lf = toFeet(opts.length, opts.lengthUnit);
  const Wf = toFeet(opts.width, opts.widthUnit);
  const Df = toFeet(opts.depth, opts.depthUnit);
  const cuFt = Lf * Wf * Df;
  const cuYd = cuFt / 27;
  const w = wasteFactor(opts.wastePercent);
  return { cuFt, cuYd, cuFtW: cuFt*w, cuYdW: cuYd*w, wasteF: w };
}
