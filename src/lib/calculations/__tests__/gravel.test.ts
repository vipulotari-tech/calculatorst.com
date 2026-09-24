import { describe, it, expect } from "vitest";
import { gravelVolume, gravelDepth, gravelCost } from "../gravel";

describe("Gravel", () => {
  it("gravel 20ft x 10ft x 4in crushed 1.40", () => {
    const r = gravelVolume({ length:20, lengthUnit:"ft", width:10, widthUnit:"ft", depth:4, depthUnit:"in", wastePercent:10, densityKey:"crushed" });
    expect(r.cuFt).toBeCloseTo(66.6667,2);
    expect(r.cuYd).toBeCloseTo(2.469,2);
    expect(r.cuYdW).toBeCloseTo(2.716,2);
    expect(r.tonsW).toBeCloseTo(2.716*1.40,2);
  });
  it("separates compaction allowance from waste", () => {
    const r = gravelVolume({ length:20, lengthUnit:"ft", width:10, widthUnit:"ft", depth:4, depthUnit:"in", compactionPercent:15, wastePercent:10, densityKey:"crushed" });
    expect(r.cuYdCompaction).toBeCloseTo(r.cuYd * 1.15, 8);
    expect(r.cuYdW).toBeCloseTo(r.cuYd * 1.15 * 1.10, 8);
    expect(r.tonsW).toBeCloseTo(r.cuYd * 1.15 * 1.10 * 1.40, 8);
  });
  it("supports cubic-meter pricing on final order quantity", () => {
    const r = gravelVolume({ length:20, lengthUnit:"ft", width:10, widthUnit:"ft", depth:4, depthUnit:"in", compactionPercent:10, wastePercent:5, densityKey:"pea" });
    const m3W = r.cuYdW * 0.764554857984;
    expect(gravelCost({ tonsW:r.tonsW, cuYdW:r.cuYdW, m3W, price:50, priceUnit:"m3" }).cost).toBeCloseTo(m3W * 50, 8);
  });
  it("pea gravel 1.35", () => {
    const r = gravelVolume({ length:20, lengthUnit:"ft", width:10, widthUnit:"ft", depth:4, depthUnit:"in", wastePercent:0, densityKey:"pea" });
    expect(r.tons).toBeCloseTo(2.469*1.35,2);
  });
  it("weight calculator density override", () => {
    const r = gravelVolume({ length:20, lengthUnit:"ft", width:10, widthUnit:"ft", depth:4, depthUnit:"in", wastePercent:5, densityTonsPerYd:1.40 });
    expect(r.tonsW).toBeCloseTo(r.cuYd*1.40*1.05,3);
  });
  it("depth calc: area 200 ft2, vol 2.47 yd3", () => {
    const r = gravelDepth({ length:20, lengthUnit:"ft", width:10, widthUnit:"ft", volumeYd:2.469 });
    expect(r.depthIn).toBeCloseTo(4,1);
  });
  it("sand weight 1.30", () => {
    const r = gravelVolume({ length:10, lengthUnit:"ft", width:10, widthUnit:"ft", depth:6, depthUnit:"in", wastePercent:0, densityKey:"sand" });
    expect(r.tons).toBeCloseTo((10*10*0.5/27)*1.30,2);
  });
});
