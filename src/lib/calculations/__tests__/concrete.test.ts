import { describe, it, expect } from "vitest";
import { rectVolume, columnVolume, curbVolume, stairVolume, rampVolume, concreteWeight } from "../concrete";

describe("Concrete - rectVolume (generic concrete calculators)", () => {
  it("normal case: 20ft x 10ft x 4in with 10% waste", () => {
    const r = rectVolume({ length:20, lengthUnit:"ft", width:10, widthUnit:"ft", depth:4, depthUnit:"in", wastePercent:10 });
    expect(r.cuFt).toBeCloseTo(66.6667,2);
    expect(r.cuYd).toBeCloseTo(2.469,2);
    expect(r.cuYdW).toBeCloseTo(2.716,2);
    expect(r.cuFtW).toBeCloseTo(73.333,2);
    expect(r.bags80).toBe(Math.ceil(73.333/0.60)); // 123
  });
  it("decimal case", () => {
    const r = rectVolume({ length:12.5, lengthUnit:"ft", width:8.75, widthUnit:"ft", depth:3.5, depthUnit:"in", wastePercent:7 });
    const expectedCuFt = 12.5*8.75*(3.5/12); // 31.90
    expect(r.cuFt).toBeCloseTo(expectedCuFt,2);
    expect(r.cuYdW).toBeCloseTo(expectedCuFt/27*1.07,2);
  });
  it("metric units: 6m x 3m x 10cm", () => {
    const r = rectVolume({ length:6, lengthUnit:"m", width:3, widthUnit:"m", depth:10, depthUnit:"cm", wastePercent:0 });
    // 6m=19.685ft, 3m=9.8425ft, 10cm=0.328ft
    const Lf=6*3.28084, Wf=3*3.28084, Df=10*0.0328084;
    expect(r.cuFt).toBeCloseTo(Lf*Wf*Df,2);
  });
  it("zero depth returns 0", () => {
    const r = rectVolume({ length:10, lengthUnit:"ft", width:10, widthUnit:"ft", depth:0, depthUnit:"in", wastePercent:10 });
    expect(r.cuFt).toBe(0);
    expect(r.cuYdW).toBe(0);
  });
  it("waste 0% vs 10%", () => {
    const a = rectVolume({ length:10, lengthUnit:"ft", width:10, widthUnit:"ft", depth:4, depthUnit:"in", wastePercent:0 });
    const b = rectVolume({ length:10, lengthUnit:"ft", width:10, widthUnit:"ft", depth:4, depthUnit:"in", wastePercent:10 });
    expect(b.cuYdW).toBeCloseTo(a.cuYd*1.10,5);
  });
  it("invalid negative filtered? logic returns negative product but we treat as valid - expect negative handling", () => {
    const r = rectVolume({ length:-5, lengthUnit:"ft", width:10, widthUnit:"ft", depth:4, depthUnit:"in", wastePercent:10 });
    expect(r.cuFt).toBeCloseTo(-16.666,2);
  });
  it("unit conversion: 20yd x 10ft x 4in", () => {
    const r = rectVolume({ length:20, lengthUnit:"yd", width:10, widthUnit:"ft", depth:4, depthUnit:"in", wastePercent:0 });
    // 20yd=60ft
    expect(r.cuFt).toBeCloseTo(60*10*(4/12),2);
  });
});

describe("Concrete - columnVolume", () => {
  it("example: 12in diameter x 8ft tall", () => {
    const r = columnVolume({ diameter:12, diameterUnit:"in", height:8, heightUnit:"ft", wastePercent:5 });
    expect(r.area).toBeCloseTo(Math.PI*0.5*0.5,3); // 0.785
    expect(r.cuFt).toBeCloseTo(0.785*8,2); // 6.28
    expect(r.cuYd).toBeCloseTo(6.283/27,3); // 0.233
    expect(r.cuYdW).toBeCloseTo(0.233*1.05,3);
  });
  it("metric: 300mm diameter x 2m height", () => {
    const r = columnVolume({ diameter:300, diameterUnit:"mm", height:2, heightUnit:"m", wastePercent:0 });
    expect(r.cuFt).toBeGreaterThan(0);
  });
  it("zero height", () => {
    const r = columnVolume({ diameter:12, diameterUnit:"in", height:0, heightUnit:"ft", wastePercent:5 });
    expect(r.cuFt).toBe(0);
  });
});

describe("Concrete - curbVolume", () => {
  it("example: 20ft, 6x6 curb + 18x6 gutter", () => {
    const r = curbVolume({ length:20, lengthUnit:"ft", curbWidth:6, curbWidthUnit:"in", curbHeight:6, curbHeightUnit:"in", gutterWidth:18, gutterWidthUnit:"in", gutterThickness:6, gutterThicknessUnit:"in", wastePercent:10 });
    expect(r.curbArea).toBeCloseTo(0.25,3);
    expect(r.gutterArea).toBeCloseTo(0.75,3);
    expect(r.cuFt).toBeCloseTo(20,2);
    expect(r.cuYd).toBeCloseTo(0.7407,3);
    expect(r.cuYdW).toBeCloseTo(0.8148,3);
  });
});

describe("Concrete - stairVolume", () => {
  it("example: 4ft wide, 7in rise, 11in run, 4 steps", () => {
    const r = stairVolume({ width:4, widthUnit:"ft", rise:7, riseUnit:"in", run:11, runUnit:"in", steps:4, wastePercent:10 });
    const per = (11/12)*(7/12)*4; // 2.1389
    expect(r.perStep).toBeCloseTo(per,3);
    expect(r.cuFt).toBeCloseTo(per*4,2); // 8.55
    expect(r.cuYdW).toBeCloseTo(8.555/27*1.1,3);
  });
});

describe("Concrete - rampVolume", () => {
  it("10ft x 4ft x 6in wedge", () => {
    const r = rampVolume({ length:10, lengthUnit:"ft", width:4, widthUnit:"ft", height:6, heightUnit:"in", wastePercent:10 });
    expect(r.cuFt).toBeCloseTo(10*4*0.5/2,2); // 10
    expect(r.cuYdW).toBeCloseTo(10/27*1.1,3);
  });
});

describe("Concrete - weight", () => {
  it("weight from 66.67 ft3", () => {
    const w = concreteWeight(66.6667);
    expect(w.lb).toBeCloseTo(10000,0); // 66.67*150=10000
    expect(w.tons).toBeCloseTo(5,0);
  });
});
