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
  quantity?: number;
}) {
  const Df = toFeet(opts.diameter, opts.diameterUnit);
  const Hf = toFeet(opts.height, opts.heightUnit);
  const qty = opts.quantity ?? 1;
  const radius = Df / 2;
  const area = Math.PI * radius * radius;
  const cuFt = area * Hf * qty;
  const cuYd = cuFt / 27;
  const w = wasteFactor(opts.wastePercent);
  return { area, cuFt, cuYd, cuFtW: cuFt * w, cuYdW: cuYd * w, wasteF: w, quantity: qty };
}

// Tube / Circular Slab (hollow cylinder): pi*((Do/2)^2 - (Di/2)^2)*H*Qty — matches calculator.net Circular Slab or Tube
export function tubeVolume(opts: {
  outerDiameter: number; outerDiameterUnit: string;
  innerDiameter: number; innerDiameterUnit: string;
  height: number; heightUnit: string;
  wastePercent: number;
  quantity?: number;
}) {
  const Do = toFeet(opts.outerDiameter, opts.outerDiameterUnit);
  const Di = toFeet(opts.innerDiameter ?? 0, opts.innerDiameterUnit ?? "in");
  const Hf = toFeet(opts.height, opts.heightUnit);
  const qty = opts.quantity ?? 1;
  const Ro = Do / 2;
  const Ri = Di / 2;
  const outerArea = Math.PI * Ro * Ro;
  const innerArea = Di > 0 ? Math.PI * Ri * Ri : 0;
  const area = Math.max(0, outerArea - innerArea);
  const cuFt = area * Hf * qty;
  const cuYd = cuFt / 27;
  const w = wasteFactor(opts.wastePercent);
  return { outerArea, innerArea, area, cuFt, cuYd, cuFtW: cuFt * w, cuYdW: cuYd * w, wasteF: w, quantity: qty };
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

// Stair: per step volume * steps + optional platform (landing) — platformDepth extra slab on top, matches calculator.net Platform Depth
export function stairVolume(opts: {
  width: number; widthUnit: string; // stair width
  rise: number; riseUnit: string; // riser height
  run: number; runUnit: string; // tread depth
  steps: number;
  wastePercent: number;
  platformDepth?: number;
  platformDepthUnit?: string;
}) {
  const Wf = toFeet(opts.width, opts.widthUnit);
  const Rise = toFeet(opts.rise, opts.riseUnit);
  const Run = toFeet(opts.run, opts.runUnit);
  const perStep = Run * Rise * Wf;
  const stepsCuFt = perStep * opts.steps;
  const PlatDf = opts.platformDepth ? toFeet(opts.platformDepth, opts.platformDepthUnit ?? "in") : 0;
  const platformCuFt = PlatDf > 0 ? PlatDf * Wf * Run : 0; // platform is run-depth slab
  const cuFt = stepsCuFt + platformCuFt;
  const cuYd = cuFt / 27;
  const w = wasteFactor(opts.wastePercent);
  return { perStep, stepsCuFt, platformCuFt, cuFt, cuYd, cuFtW: cuFt * w, cuYdW: cuYd * w, wasteF: w };
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
