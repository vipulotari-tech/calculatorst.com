// Centralized unit conversion — single source of truth for all calculators
// Base units: feet (length), sq ft (area), cu ft (volume), lb (weight)
// All conversions are linear/area/volume correct; never reuse linear factor for area/volume.

export const LENGTH_TO_FT: Record<string, number> = {
  ft: 1,
  in: 1 / 12,
  yd: 3,
  m: 3.28084,
  cm: 0.0328084,
  mm: 0.00328084,
};

export const AREA_TO_SQFT: Record<string, number> = {
  sqft: 1,
  ft2: 1,
  "ft²": 1,
  sqyd: 9,
  yd2: 9,
  "yd²": 9,
  sqm: 10.7639,
  m2: 10.7639,
  "m²": 10.7639,
  sqin: 1 / 144,
  in2: 1 / 144,
  "in²": 1 / 144,
  sqcm: 0.00107639,
  cm2: 0.00107639,
};

export const VOLUME_TO_CUFT: Record<string, number> = {
  ft3: 1,
  "ft³": 1,
  cuft: 1,
  yd3: 27,
  "yd³": 27,
  cuyd: 27,
  m3: 35.3147,
  "m³": 35.3147,
  cum: 35.3147,
  in3: 1 / 1728,
  "in³": 1 / 1728,
  cuin: 1 / 1728,
  liter: 0.0353147,
  l: 0.0353147,
  gallon: 0.133681,
  gal: 0.133681,
};

export const WEIGHT_TO_LB: Record<string, number> = {
  lb: 1,
  lbs: 1,
  kg: 2.20462,
  ton: 2000, // short ton (US)
  tons: 2000,
  tonne: 2204.62, // metric tonne
  t: 2204.62,
  oz: 1 / 16,
};

export function toFeet(value: number, unit: string): number {
  const f = LENGTH_TO_FT[unit];
  if (f !== undefined) return value * f;
  // fallback for already-normalized or unknown — return as-is but warn in dev
  return value;
}

export function fromFeet(valueFt: number, targetUnit: string): number {
  const f = LENGTH_TO_FT[targetUnit];
  if (f !== undefined) return valueFt / f;
  return valueFt;
}

export function toInches(value: number, unit: string): number {
  return toFeet(value, unit) * 12;
}

export function toSqFt(value: number, unit: string): number {
  const f = AREA_TO_SQFT[unit];
  if (f !== undefined) return value * f;
  // if unit is a length unit, caller mistakenly passed length to area — fallback to length^2
  const lf = LENGTH_TO_FT[unit];
  if (lf !== undefined) return value * lf * lf; // not used normally, defensive
  return value;
}

export function fromSqFt(valueSqFt: number, targetUnit: string): number {
  const f = AREA_TO_SQFT[targetUnit];
  if (f !== undefined) return valueSqFt / f;
  return valueSqFt;
}

export function toCuFt(value: number, unit: string): number {
  const f = VOLUME_TO_CUFT[unit];
  if (f !== undefined) return value * f;
  const lf = LENGTH_TO_FT[unit];
  if (lf !== undefined) return value * lf * lf * lf; // defensive
  return value;
}

export function fromCuFt(valueCuFt: number, targetUnit: string): number {
  const f = VOLUME_TO_CUFT[targetUnit];
  if (f !== undefined) return valueCuFt / f;
  return valueCuFt;
}

export function toLb(value: number, unit: string): number {
  const f = WEIGHT_TO_LB[unit];
  if (f !== undefined) return value * f;
  return value;
}

export function fromLb(valueLb: number, targetUnit: string): number {
  const f = WEIGHT_TO_LB[targetUnit];
  if (f !== undefined) return valueLb / f;
  return valueLb;
}

// Waste / percentage helpers — applied exactly once, after core math
export function wasteFactor(wastePercent: number): number {
  if (!isFinite(wastePercent) || wastePercent <= 0) return 1;
  return 1 + wastePercent / 100;
}
export function applyWaste(base: number, wastePercent: number): number {
  return base * wasteFactor(wastePercent);
}

// Rounding helpers
export function ceilDiscrete(value: number): number {
  // for items that cannot be split: bricks, bags, boards, etc.
  if (!isFinite(value)) return NaN;
  return Math.ceil(value - 1e-9); // tiny epsilon to avoid ceil(2.0000000001)=3
}

// Validation
export function isValidPositive(n: number): boolean {
  return isFinite(n) && n > 0;
}
export function isValidNonNegative(n: number): boolean {
  return isFinite(n) && n >= 0;
}

// Length/Area/Volume helpers that enforce dimensional correctness
// Example: volume from L,W,H each with own unit → cu ft
export function volumeCuFt(
  l: number, lUnit: string,
  w: number, wUnit: string,
  h: number, hUnit: string
): number {
  return toFeet(l, lUnit) * toFeet(w, wUnit) * toFeet(h, hUnit);
}
export function areaSqFt(
  l: number, lUnit: string,
  w: number, wUnit: string
): number {
  return toFeet(l, lUnit) * toFeet(w, wUnit);
}
