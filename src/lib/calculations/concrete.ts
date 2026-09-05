import { toFeet, wasteFactor, ceilDiscrete } from "../../utils/units";

// Rectangular volume: L*W*H → cu ft / cu yd, with waste once
export function rectVolume(opts: {
  length: number; lengthUnit: string;
  width: number; widthUnit: string;
  depth: number; depthUnit: string;
  wastePercent: number;
  quantity?: number; // number of slabs/sections
}) {
  const Lf = toFeet(opts.length, opts.lengthUnit);
  const Wf = toFeet(opts.width, opts.widthUnit);
  const Df = toFeet(opts.depth, opts.depthUnit);
  const qty = opts.quantity ?? 1;
  const sqft = Lf * Wf * qty;
  const cuFt = sqft * Df;
  const cuYd = cuFt / 27;
  const w = wasteFactor(opts.wastePercent);
  return {
    sqft, cuFt, cuYd,
    cuFtW: cuFt * w,
    cuYdW: cuYd * w,
    wasteF: w,
    // bag counts from cuFtW
    bags80: ceilDiscrete(cuFt * w / 0.60),
    bags60: ceilDiscrete(cuFt * w / 0.45),
    bags40: ceilDiscrete(cuFt * w / 0.30),
  };
}

// Column / cylinder: pi*(D/2)^2*H
export function columnVolume(opts: {
  diameter: number; diameterUnit: string;
  height: number; heightUnit: string;
  wastePercent: number;
}) {
  const Df = toFeet(opts.diameter, opts.diameterUnit);
  const Hf = toFeet(opts.height, opts.heightUnit);
  const radius = Df / 2;
  const area = Math.PI * radius * radius;
  const cuFt = area * Hf;
  const cuYd = cuFt / 27;
  const w = wasteFactor(opts.wastePercent);
  return { area, cuFt, cuYd, cuFtW: cuFt * w, cuYdW: cuYd * w, wasteF: w };
}

// Curb + gutter combined: Length * (curbArea + gutterArea)
export function curbVolume(opts: {
  length: number; lengthUnit: string;
  curbWidth: number; curbWidthUnit: string;
  curbHeight: number; curbHeightUnit: string;
  gutterWidth: number; gutterWidthUnit: string;
  gutterThickness: number; gutterThicknessUnit: string;
  wastePercent: number;
}) {
  const Lf = toFeet(opts.length, opts.lengthUnit);
  const cw = toFeet(opts.curbWidth, opts.curbWidthUnit);
  const ch = toFeet(opts.curbHeight, opts.curbHeightUnit);
  const gw = toFeet(opts.gutterWidth, opts.gutterWidthUnit);
  const gt = toFeet(opts.gutterThickness, opts.gutterThicknessUnit);
  const curbArea = cw * ch;
  const gutterArea = gw * gt;
  const totalArea = curbArea + gutterArea;
  const cuFt = Lf * totalArea;
  const cuYd = cuFt / 27;
  const w = wasteFactor(opts.wastePercent);
  return { curbArea, gutterArea, totalArea, cuFt, cuYd, cuFtW: cuFt * w, cuYdW: cuYd * w, wasteF: w };
}

// Stair: per step volume * steps
export function stairVolume(opts: {
  width: number; widthUnit: string; // stair width
  rise: number; riseUnit: string; // riser height
  run: number; runUnit: string; // tread depth
  steps: number;
  wastePercent: number;
}) {
  const Wf = toFeet(opts.width, opts.widthUnit);
  const Rise = toFeet(opts.rise, opts.riseUnit);
  const Run = toFeet(opts.run, opts.runUnit);
  const perStep = Run * Rise * Wf;
  const cuFt = perStep * opts.steps;
  const cuYd = cuFt / 27;
  const w = wasteFactor(opts.wastePercent);
  return { perStep, cuFt, cuYd, cuFtW: cuFt * w, cuYdW: cuYd * w, wasteF: w };
}

// Ramp / wedge: L*W*H /2  (triangular prism) + optional flat
export function rampVolume(opts: {
  length: number; lengthUnit: string;
  width: number; widthUnit: string;
  height: number; heightUnit: string; // max thickness
  wastePercent: number;
}) {
  const Lf = toFeet(opts.length, opts.lengthUnit);
  const Wf = toFeet(opts.width, opts.widthUnit);
  const Hf = toFeet(opts.height, opts.heightUnit);
  const cuFt = (Lf * Wf * Hf) / 2;
  const cuYd = cuFt / 27;
  const w = wasteFactor(opts.wastePercent);
  return { cuFt, cuYd, cuFtW: cuFt * w, cuYdW: cuYd * w, wasteF: w };
}

// Concrete weight from volume: 150 lb/ft3 (4050 lb/yd3, 2.025 ton/yd3)
export function concreteWeight(cuFt: number): { lb: number; tons: number } {
  const lb = cuFt * 150;
  return { lb, tons: lb / 2000 };
}

// Waste calculator passthrough: total = base * (1+waste) ; waste amount = base*waste%
export function wasteQuantity(base: number, wastePercent: number) {
  const w = wasteFactor(wastePercent);
  return { base, total: base * w, wasteAmount: base * (w - 1), wasteF: w };
}
