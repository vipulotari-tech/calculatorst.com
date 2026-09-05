import { toFeet, wasteFactor, ceilDiscrete } from "../../utils/units";

export function drywallSheets(opts: {
  length: number; lUnit: string;
  width: number; wUnit: string;
  height: number; hUnit: string;
  openingsArea?: number; // ft2 dedup
  sheetArea?: number; // 32 for 4x8
  wastePercent: number;
}) {
  const Lf = toFeet(opts.length, opts.lUnit ?? "ft");
  const Wf = toFeet(opts.width, opts.wUnit ?? "ft");
  const Hf = toFeet(opts.height, opts.hUnit ?? "ft");
  const perimeter = 2*(Lf+Wf);
  const wallArea = perimeter * Hf - (opts.openingsArea ?? 0);
  const sheetA = opts.sheetArea ?? 32;
  const sheets = Math.ceil(wallArea / sheetA);
  const w = wasteFactor(opts.wastePercent);
  return { perimeter, wallArea, sheets, sheetsW: ceilDiscrete(sheets * w), wasteF: w };
}

export function paintGallons(opts: {
  wallArea: number; // ft2
  coats: number; // 2 typical
  coverage: number; // 350 paint, 300 primer
}) {
  const totalArea = opts.wallArea * opts.coats;
  const gallons = Math.ceil(totalArea / opts.coverage);
  return { totalArea, gallons };
}

export function insulationBags(opts: {
  areaSqFt: number;
  coveragePerBag: number; // e.g., 25 for R30
  wastePercent: number;
}) {
  const bags = Math.ceil(opts.areaSqFt / opts.coveragePerBag);
  const w = wasteFactor(opts.wastePercent);
  return { bags, bagsW: ceilDiscrete(bags * w), wasteF: w };
}

export function sprayFoam(opts: {
  areaSqFt: number;
  thicknessIn: number; // inches
  coveragePerKit?: number; // board feet per kit
}) {
  // Board foot = 1 ft2 *1" thick. So total board feet = area * thickness
  const boardFeet = opts.areaSqFt * opts.thicknessIn;
  const kits = opts.coveragePerKit ? Math.ceil(boardFeet / opts.coveragePerKit) : NaN;
  return { boardFeet, kits };
}
