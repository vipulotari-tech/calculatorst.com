export function toFeet(value: number, unit: string): number {
  if (unit === "ft") return value;
  if (unit === "in") return value / 12;
  if (unit === "yd") return value * 3;
  if (unit === "m") return value * 3.28084;
  if (unit === "cm") return value * 0.0328084;
  if (unit === "mm") return value * 0.00328084;
  return value;
}
export function toInches(value: number, unit: string): number {
  if (unit === "in") return value;
  if (unit === "ft") return value * 12;
  if (unit === "yd") return value * 36;
  if (unit === "cm") return value * 0.393701;
  if (unit === "mm") return value * 0.0393701;
  if (unit === "m") return value * 39.3701;
  return value;
}
export function toSqFt(value: number, unit: string): number {
  // for area units
  if (unit === "sqft" || unit === "ft2") return value;
  if (unit === "sqm" || unit === "m2") return value * 10.7639;
  if (unit === "sqyd" || unit === "yd2") return value * 9;
  return value;
}
