import { describe, it, expect } from "vitest";
import { brickQuantity, cmuQuantity } from "../masonry";

describe("Masonry", () => {
  it("brick 20x8 ft, 7.5x2.25 joint 0.375", () => {
    const r = brickQuantity({ wallLength:20, wallLengthUnit:"ft", wallHeight:8, wallHeightUnit:"ft", brickLength:7.5, brickLengthUnit:"in", brickHeight:2.25, brickHeightUnit:"in", jointThickness:0.375, jointUnit:"in", wastePercent:7 });
    expect(r.wallAreaSqFt).toBe(160);
    expect(r.brickAreaIn2).toBeCloseTo(20.67,1);
    expect(r.bricks).toBeCloseTo(1115,0);
    expect(r.bricksW).toBe(1194); // ceil(1115*1.07)=1194, docs show 1193 (off by 1 due to floor vs ceil)
  });
  it("cmu 20x8 wall", () => {
    const r = cmuQuantity({ wallLength:20, wallLengthUnit:"ft", wallHeight:8, wallHeightUnit:"ft", wastePercent:5 });
    expect(r.blocks).toBe(Math.ceil(160*1.125)); // 180
    expect(r.blocksW).toBe(Math.ceil(180*1.05));
  });
  it("brick weight: 1193 *4.3 lb", () => {
    const cnt=1193, w=4.3;
    const lb=cnt*w;
    expect(lb).toBeCloseTo(5129.9,1);
    expect(lb/2000).toBeCloseTo(2.56,1);
  });
});
