export function fmt(n: number, dec = 2): string {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: dec,
    minimumFractionDigits: dec === 0 ? 0 : dec === 2 ? 2 : 0,
  }).format(n);
}
export function fmtCurrency(n: number): string {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}
export function fmtInt(n: number): string {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(n));
}
