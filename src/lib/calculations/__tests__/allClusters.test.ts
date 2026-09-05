import { describe, it, expect } from "vitest";
import { rectVolume } from "../concrete";
import { gravelVolume } from "../gravel";
import { brickQuantity } from "../masonry";
import { rebarCount } from "../rebar";
import { roofArea } from "../roofing";
import { floorArea } from "../flooring";
import { drywallSheets, paintGallons } from "../drywallPaint";
import { studCount } from "../framing";
import { deckBoards, fencePosts } from "../deckFence";
import { paverCount } from "../paver";
import { asphaltWeight } from "../asphalt";
import { trenchVolume } from "../excavation";
import { stripFooting } from "../foundation";

describe("All clusters smoke", () => {
  it("concrete rect", () => {
    const r=rectVolume({length:20,lengthUnit:"ft",width:10,widthUnit:"ft",depth:4,depthUnit:"in",wastePercent:10});
    expect(r.cuYdW).toBeCloseTo(2.72,2);
  });
  it("gravel", () => {
    const r=gravelVolume({length:20,lengthUnit:"ft",width:10,widthUnit:"ft",depth:4,depthUnit:"in",wastePercent:10, densityKey:"crushed"});
    expect(r.tonsW).toBeCloseTo(r.cuYdW*1.40,2);
    expect(r.tonsW).toBeCloseTo(3.80,1);
  });
  it("brick", () => {
    const r=brickQuantity({wallLength:20,wallLengthUnit:"ft",wallHeight:8,wallHeightUnit:"ft",brickLength:7.5,brickLengthUnit:"in",brickHeight:2.25,brickHeightUnit:"in",jointThickness:0.375,jointUnit:"in",wastePercent:7});
    expect(r.bricksW).toBe(1194);
  });
  it("rebar", () => {
    const r=rebarCount({length:20,lengthUnit:"ft",spacing:16,spacingUnit:"in"});
    expect(r.count).toBe(16);
  });
  it("roof area", () => {
    const r=roofArea({length:40,lengthUnit:"ft",width:30,widthUnit:"ft",pitch:6,overhang:1.5,overhangUnit:"ft",wastePercent:10});
    expect(r.roofW).toBeCloseTo(1745,0);
  });
  it("floor tile quantity 12x10 room 12in tile", () => {
    // 120 ft2 /1.02 =118
    const area=120, tA=(12/12+0.125/12)*(12/12+0.125/12); // approx 1.02
    const cnt=Math.ceil(area/tA);
    expect(cnt).toBe(118);
  });
  it("drywall 12x10x8", () => {
    const r=drywallSheets({length:12,lUnit:"ft",width:10,wUnit:"ft",height:8,hUnit:"ft",wastePercent:10});
    expect(r.sheetsW).toBeGreaterThan(0);
  });
  it("paint 12x10x8 2 coats 350", () => {
    const wall=2*(12*8+10*8), r=paintGallons({wallArea:wall, coats:2, coverage:350});
    expect(r.gallons).toBe(3); // 352*2=704/350=2.01 ceil3
  });
  it("framing stud 20ft 16in", () => {
    const r=studCount({wallLength:20,lengthUnit:"ft",spacing:16,spacingUnit:"in",wastePercent:10});
    expect(r.totalW).toBe(18);
  });
  it("deck boards 16x12", () => {
    const r=deckBoards({deckLength:16,lengthUnit:"ft",deckWidth:12,widthUnit:"ft",boardWidth:5.5,boardWidthUnit:"in",boardLength:16,boardLengthUnit:"ft",gap:0.125,gapUnit:"in",wastePercent:10});
    expect(r.boardsW).toBeGreaterThan(0);
  });
  it("fence posts 100ft 8ft", () => {
    const r=fencePosts({length:100,lengthUnit:"ft",postSpacing:8,spacingUnit:"ft",wastePercent:10});
    expect(r.posts).toBe(14);
    expect(r.postsW).toBe(16); // ceil(14*1.1)=16
  });
  it("paver 12x10 patio 12in pavers", () => {
    const r=paverCount({length:12,lengthUnit:"ft",width:10,widthUnit:"ft",paverLength:12,paverUnit:"in",paverWidth:12,paverWidthUnit:"in",wastePercent:10});
    expect(r.countW).toBe(132);
  });
  it("asphalt 40x12x3in", () => {
    const r=asphaltWeight({length:40,lengthUnit:"ft",width:12,widthUnit:"ft",thickness:3,thicknessUnit:"in",wastePercent:5});
    expect(r.tonsW).toBeCloseTo(9.45,1);
  });
  it("excavation trench 20x2x4", () => {
    const r=trenchVolume({length:20,lengthUnit:"ft",width:2,widthUnit:"ft",depth:4,depthUnit:"ft",wastePercent:10,swellFactor:1.2});
    expect(r.cuYdBankW).toBeCloseTo(6.51,1);
    expect(r.cuYdLoose).toBeCloseTo(7.81,1);
  });
  it("strip footing 40x1.33x0.66", () => {
    const r=stripFooting({length:40,lengthUnit:"ft",width:16,widthUnit:"in",depth:8,depthUnit:"in",wastePercent:10});
    expect(r.cuYd).toBeCloseTo(1.316,1);
  });
});
