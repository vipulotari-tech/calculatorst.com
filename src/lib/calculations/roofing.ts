import { toFeet, wasteFactor } from "../../utils/units";

// Roof pitch: rise/run → angle, slope, x:12
export function roofPitch(opts: { rise: number; riseUnit: string; run: number; runUnit: string }) {
  const riseIn = toFeet(opts.rise, opts.riseUnit) * 12;
  const runIn = toFeet(opts.run, opts.runUnit) * 12;
  if (runIn <= 0) return { slope: NaN, angle: NaN, x12: NaN, ratio: "—" };
  const slope = riseIn / runIn;
  const angle = Math.atan(slope) * 180 / Math.PI;
  const x12 = slope * 12;
  const ratio = `${riseIn.toFixed(2)}:${runIn.toFixed(2)}`;
  return { riseIn, runIn, slope, angle, x12, ratio, pct: slope*100 };
}

// Roof area from footprint, pitch, overhang
export function roofArea(opts: {
  length: number; lengthUnit: string;
  width: number; widthUnit: string;
  pitch: number; // rise per 12" run, e.g., 6
  overhang: number; overhangUnit: string; // each side
  sections?: number;
  wastePercent: number;
}) {
  const Lf = toFeet(opts.length, opts.lengthUnit);
  const Wf = toFeet(opts.width, opts.widthUnit);
  const over = toFeet(opts.overhang, opts.overhangUnit ?? "ft");
  const sec = opts.sections ?? 1;
  const footprint = (Lf + over*2) * (Wf + over*2) * sec;
  const mult = Math.sqrt(opts.pitch * opts.pitch + 144) / 12;
  const roof = footprint * mult;
  const w = wasteFactor(opts.wastePercent);
  const roofW = roof * w;
  return { footprint, mult, roof, roofW, squares: roof/100, squaresW: roofW/100, wasteF: w };
}

// Shingles: 3 bundles per square (33.3 ft2 per bundle), or 100 ft2 per square
export function shingles(opts: {
  roofSqFt: number; // or roofW
  wastePercent: number; // extra on top if not already included
  bundlesPerSquare?: number; // 3 typical
}) {
  const perSquare = opts.bundlesPerSquare ?? 3;
  const squares = opts.roofSqFt / 100;
  const bundles = Math.ceil(squares * perSquare * wasteFactor(opts.wastePercent));
  return { squares, bundles, wasteF: wasteFactor(opts.wastePercent) };
}

// Roof slope variant: same as pitch
export function roofSlope(rise: number, run: number) {
  return roofPitch({ rise, riseUnit: "in", run, runUnit: "in" });
}

// Rafter length: run * mult (same multiplier as area but for 2D)
// For a gable, rafter = (span/2 + overhang) * mult
export function rafterLength(opts: {
  span: number; spanUnit: string; // total building width
  pitch: number;
  overhang: number; overhangUnit: string;
}) {
  const spanF = toFeet(opts.span, opts.spanUnit);
  const over = toFeet(opts.overhang, opts.overhangUnit ?? "ft");
  const run = spanF/2 + over;
  const pitch = opts.pitch;
  const mult = Math.sqrt(pitch*pitch + 144)/12;
  const rafter = run * mult; // because run is horizontal, rafter is hyp
  // alternative: pythag
  const rise = (pitch/12)*run;
  const rafter2 = Math.sqrt(run*run + rise*rise);
  return { run, mult, rafter, rafter2 };
}
