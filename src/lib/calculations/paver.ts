import { toFeet, wasteFactor, ceilDiscrete } from "../../utils/units";

export function paverCount(opts: {
  length: number; lengthUnit: string;
  width: number; widthUnit: string;
  paverLength: number; paverUnit: string;
  paverWidth: number; paverWidthUnit: string;
  wastePercent: number;
}) {
  const Lf = toFeet(opts.length, opts.lengthUnit);
  const Wf = toFeet(opts.width, opts.widthUnit);
  const pl = toFeet(opts.paverLength, opts.paverUnit);
  const pw = toFeet(opts.paverWidth, opts.paverWidthUnit);
  const area = Lf * Wf;
  const paverArea = pl * pw;
  if (paverArea <=0) return { area, paverArea:0, count:0, countW:0, wasteF: wasteFactor(opts.wastePercent) };
  const count = Math.ceil(area / paverArea);
  const w = wasteFactor(opts.wastePercent);
  return { area, paverArea, count, countW: ceilDiscrete(count * w), wasteF: w };
}

export function paverBase(opts: {
  areaSqFt: number;
  depth: number; depthUnit: string;
  wastePercent: number;
}) {
  const Df = toFeet(opts.depth, opts.depthUnit);
  const cuFt = opts.areaSqFt * Df;
  const cuYd = cuFt / 27;
  const w = wasteFactor(opts.wastePercent);
  return { cuFt, cuYd, cuFtW: cuFt*w, cuYdW: cuYd*w, wasteF: w };
}

export function paverJointSand(opts: {
  areaSqFt: number;
  jointSandDepthIn?: number; // placeholder for joint sand volume calc — simplified as 0.02 * area? Not needed.
}) {
  // Joint sand often estimated as 1 bag (50lb) per 100 ft2
  const bags = Math.ceil(opts.areaSqFt / 100);
  return { bags };
}

export function mulch(opts: {
  length: number; lengthUnit: string;
  width: number; widthUnit: string;
  depth: number; depthUnit: string;
  areas: number;
  wastePercent: number;
  bagCuFt?: number;
}) {
  const Lf = toFeet(opts.length, opts.lengthUnit);
  const Wf = toFeet(opts.width, opts.widthUnit);
  const Df = toFeet(opts.depth, opts.depthUnit);
  const area = Lf * Wf;
  const cuFt = area * Df * opts.areas;
  const cuYd = cuFt / 27;
  const w = wasteFactor(opts.wastePercent);
  return { area, cuFt, cuYd, cuFtW: cuFt*w, cuYdW: cuYd*w, wasteF: w };
}

export function retainingWall(opts: {
  wallLength: number; lengthUnit: string;
  wallHeight: number; heightUnit: string;
  blockLength: number; blockUnit: string; // e.g., 16 in
  blockHeight: number; blockHUnit: string; // e.g., 8 in
  wastePercent: number;
}) {
  const Lf = toFeet(opts.wallLength, opts.lengthUnit);
  const Hf = toFeet(opts.wallHeight, opts.heightUnit);
  const bl = toFeet(opts.blockLength, opts.blockUnit);
  const bh = toFeet(opts.blockHeight, opts.blockHUnit);
  const wallArea = Lf * Hf;
  const blockArea = bl * bh;
  const count = blockArea>0 ? Math.ceil(wallArea / blockArea) : 0;
  const w = wasteFactor(opts.wastePercent);
  return { wallArea, blockArea, count, countW: ceilDiscrete(count * w), wasteF: w };
}
