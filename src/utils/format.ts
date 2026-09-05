export function fmt(n: number, dec = 2): string {
  if (!isFinite(n)) return "—";
  // dec=0 → integer, dec=2 → force 2 decimals (for yd³/ft³), else up to dec without forced trailing zeros
  const minFrac = dec === 0 ? 0 : dec === 2 ? 2 : 0;
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: dec,
    minimumFractionDigits: minFrac,
  }).format(n);
}
export function fmtPrecise(n: number, dec = 3): string {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: dec, minimumFractionDigits: 0 }).format(n);
}
export function fmtCurrency(n: number): string {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
export function fmtInt(n: number): string {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n));
}
