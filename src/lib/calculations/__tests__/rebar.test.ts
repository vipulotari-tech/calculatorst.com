import { describe, it, expect } from "vitest";
import { rebarCount, rebarWeight, rebarGrid, lapLength } from "../rebar";

describe("Rebar", () => {
  it("count 20ft /16in", () => {
    const r = rebarCount({ length:20, lengthUnit:"ft", spacing:16, spacingUnit:"in" });
    expect(r.count).toBe(16);
  });
  it("weight 16 bars #4 x20ft", () => {
    const total=16*20, r=rebarWeight({ totalLengthFt:total, size:"4", wastePercent:5 });
    expect(r.wPerFt).toBe(0.668);
    expect(r.totalLb).toBeCloseTo(213.76,1);
    expect(r.totalLbW).toBeCloseTo(224.44,1);
  });
  it("grid 20x10 slab 16in", () => {
    const r=rebarGrid({ length:20, lengthUnit:"ft", width:10, widthUnit:"ft", spacingLong:16, spacingLongUnit:"in", spacingShort:16, spacingShortUnit:"in", wastePercent:10 });
    expect(r.countX).toBe(16);
    expect(r.countY).toBe(9); // 10ft /1.33 ceil 8 +1 =9
    expect(r.totalLengthFt).toBeGreaterThan(0);
  });
  it("lap #4 2 laps", () => {
    const r=lapLength({ size:"4", laps:2 });
    expect(r.lapIn).toBeCloseTo(20,1); // 0.5*40=20
    expect(r.totalLapFt).toBeCloseTo(3.33,1);
  });
});
