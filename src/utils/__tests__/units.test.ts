import { describe, it, expect } from "vitest";
import { toFeet, toSqFt, toCuFt, toLb, wasteFactor, areaSqFt, volumeCuFt } from "../units";

describe("units", () => {
  it("length: 12in =1ft, 3ft=1yd, 1m=3.28084ft", () => {
    expect(toFeet(12,"in")).toBeCloseTo(1,5);
    expect(toFeet(1,"yd")).toBeCloseTo(3,5);
    expect(toFeet(1,"m")).toBeCloseTo(3.28084,5);
    expect(toFeet(100,"cm")).toBeCloseTo(3.28084,4);
    expect(toFeet(1000,"mm")).toBeCloseTo(3.28084,4);
  });
  it("area: 9 ft2 =1 yd2, 10.7639 ft2=1 m2", () => {
    expect(toSqFt(1,"sqyd")).toBeCloseTo(9,3);
    expect(toSqFt(1,"sqm")).toBeCloseTo(10.7639,3);
    expect(toSqFt(144,"sqin")).toBeCloseTo(1,3);
  });
  it("volume: 27 ft3=1 yd3", () => {
    expect(toCuFt(1,"yd3")).toBe(27);
    expect(toCuFt(1,"m3")).toBeCloseTo(35.3147,3);
  });
  it("weight: 1 ton=2000lb, 1kg=2.20462lb", () => {
    expect(toLb(1,"ton")).toBe(2000);
    expect(toLb(1,"kg")).toBeCloseTo(2.20462,3);
  });
  it("waste factor", () => {
    expect(wasteFactor(10)).toBe(1.10);
    expect(wasteFactor(0)).toBe(1);
    expect(wasteFactor(7)).toBeCloseTo(1.07,3);
  });
  it("dimensional correctness: area from 12in*12in =1ft2 not 1ft", () => {
    expect(areaSqFt(12,"in",12,"in")).toBeCloseTo(1,3);
  });
  it("volume from 12in*12in*12in =1ft3", () => {
    expect(volumeCuFt(12,"in",12,"in",12,"in")).toBeCloseTo(1,3);
  });
  it("never use linear for area: 1yd =3ft but 1yd2=9ft2", () => {
    expect(toSqFt(1,"sqyd")).not.toBe(toFeet(1,"yd"));
    expect(toSqFt(1,"sqyd")).toBe(9);
  });
});
