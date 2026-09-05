import { describe, it, expect } from "vitest";
import { roofPitch, roofArea, shingles, rafterLength } from "../roofing";

describe("Roofing", () => {
  it("pitch 6/12", () => {
    const r=roofPitch({ rise:6, riseUnit:"in", run:12, runUnit:"in" });
    expect(r.slope).toBeCloseTo(0.5,3);
    expect(r.angle).toBeCloseTo(26.565,1);
    expect(r.x12).toBeCloseTo(6,2);
  });
  it("area 30x40 pitch 6 overhang 1.5", () => {
    const r=roofArea({ length:40, lengthUnit:"ft", width:30, widthUnit:"ft", pitch:6, overhang:1.5, overhangUnit:"ft", wastePercent:10 });
    expect(r.mult).toBeCloseTo(1.118,3);
    expect(r.footprint).toBeCloseTo(33*43,0); // 1419
    expect(r.roof).toBeCloseTo(1419*1.118,0);
    expect(r.squares).toBeCloseTo(15.86,1);
  });
  it("shingles 1586 ft2", () => {
    const r=shingles({ roofSqFt:1586, wastePercent:10 });
    expect(r.bundles).toBe(Math.ceil(15.86*1.1*3));
  });
  it("rafter 30 span 6:12", () => {
    const r=rafterLength({ span:30, spanUnit:"ft", pitch:6, overhang:1.5, overhangUnit:"ft" });
    expect(r.rafter).toBeCloseTo(16.5*1.118,1); // run 15+1.5=16.5
  });
});
