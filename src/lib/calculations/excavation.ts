import { toFeet, wasteFactor } from "../../utils/units";

export function trenchVolume(opts: {
  length: number; lengthUnit: string;
  width: number; widthUnit: string;
  depth: number; depthUnit: string;
  wastePercent?: number; // over-excavation
  swellFactor?: number; // 1.2 typical (20% swell)
}) {
  const Lf = toFeet(opts.length, opts.lengthUnit);
  const Wf = toFeet(opts.width, opts.widthUnit);
  const Df = toFeet(opts.depth, opts.depthUnit);
  const cuFt = Lf * Wf * Df;
  const cuYd = cuFt / 27;
  const w = wasteFactor(opts.wastePercent ?? 0);
  const swell = opts.swellFactor ?? 1;
  // bank vs loose: bank cuYd * swell = loose
  const cuYdBankW = cuYd * w;
  const cuYdLoose = cuYdBankW * swell;
  return { cuFt, cuYd, cuYdBankW, cuYdLoose, wasteF: w, swell };
}

export function backfill(opts: {
  trenchCuYd: number;
  pipeDiameter: number; pipeDiameterUnit: string;
  pipeLength: number; pipeLengthUnit: string;
}) {
  const Df = toFeet(opts.pipeDiameter, opts.pipeDiameterUnit);
  const Lf = toFeet(opts.pipeLength, opts.pipeLengthUnit);
  const radius = Df/2;
  const pipeCuFt = Math.PI * radius * radius * Lf;
  const pipeCuYd = pipeCuFt / 27;
  const backfillYd = opts.trenchCuYd - pipeCuYd;
  return { pipeCuFt, pipeCuYd, backfillYd };
}

export function soilWeight(opts: {
  cuYd: number;
  densityTonsPerYd: number; // e.g., topsoil 1.2, clay 1.6
  wastePercent?: number;
}) {
  const w = wasteFactor(opts.wastePercent ?? 0);
  const tons = opts.cuYd * opts.densityTonsPerYd;
  return { tons, tonsW: tons * w, wasteF: w };
}

export function cutFill(opts: {
  cutCuYd: number;
  fillCuYd: number;
  swell?: number; // cut swell
  shrink?: number; // fill compaction shrink factor e.g., 1.1
}) {
  const cutLoose = opts.cutCuYd * (opts.swell ?? 1.2);
  const fillBank = opts.fillCuYd * (opts.shrink ?? 1);
  const balance = cutLoose - fillBank; // positive = excess, negative = need import
  return { cutLoose, fillBank, balance };
}
