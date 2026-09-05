import { toFeet, wasteFactor } from "../../utils/units";

export function stripFooting(opts: {
  length: number; lengthUnit: string;
  width: number; widthUnit: string;
  depth: number; depthUnit: string;
  count?: number;
  wastePercent: number;
}) {
  const Lf = toFeet(opts.length, opts.lengthUnit);
  const Wf = toFeet(opts.width, opts.widthUnit);
  const Df = toFeet(opts.depth, opts.depthUnit);
  const cnt = opts.count ?? 1;
  const cuFtPer = Lf * Wf * Df;
  const cuFt = cuFtPer * cnt;
  const cuYd = cuFt / 27;
  const w = wasteFactor(opts.wastePercent);
  return { cuFtPer, cuFt, cuYd, cuFtW: cuFt*w, cuYdW: cuYd*w, wasteF: w };
}

export function padFooting(opts: {
  length: number; lengthUnit: string;
  width: number; widthUnit: string;
  depth: number; depthUnit: string;
  count: number;
  wastePercent: number;
}) {
  return stripFooting({ ...opts, count: opts.count });
}

export function pierFooting(opts: {
  diameter: number; diameterUnit: string;
  height: number; heightUnit: string;
  count: number;
  wastePercent: number;
}) {
  const Df = toFeet(opts.diameter, opts.diameterUnit);
  const Hf = toFeet(opts.height, opts.heightUnit);
  const radius = Df/2;
  const area = Math.PI * radius * radius;
  const cuFtPer = area * Hf;
  const cuFt = cuFtPer * opts.count;
  const cuYd = cuFt /27;
  const w = wasteFactor(opts.wastePercent);
  return { area, cuFtPer, cuFt, cuYd, cuFtW: cuFt*w, cuYdW: cuYd*w, wasteF:w };
}

export function foundationWall(opts: {
  perimeter: number; perimeterUnit: string; // or length
  height: number; heightUnit: string;
  thickness: number; thicknessUnit: string;
  wastePercent: number;
}) {
  const Pf = toFeet(opts.perimeter, opts.perimeterUnit);
  const Hf = toFeet(opts.height, opts.heightUnit);
  const Tf = toFeet(opts.thickness, opts.thicknessUnit);
  const cuFt = Pf * Hf * Tf;
  const cuYd = cuFt /27;
  const w = wasteFactor(opts.wastePercent);
  return { cuFt, cuYd, cuFtW: cuFt*w, cuYdW: cuYd*w, wasteF:w, area: Pf*Hf };
}

export function foundationExcavation(opts: {
  length: number; lengthUnit: string;
  width: number; widthUnit: string;
  depth: number; depthUnit: string;
  wastePercent: number;
}) {
  const Lf = toFeet(opts.length, opts.lengthUnit);
  const Wf = toFeet(opts.width, opts.widthUnit);
  const Df = toFeet(opts.depth, opts.depthUnit);
  const cuFt = Lf * Wf * Df;
  const cuYd = cuFt /27;
  const w = wasteFactor(opts.wastePercent);
  return { cuFt, cuYd, cuYdW: cuYd*w, wasteF:w, area: Lf*Wf };
}
