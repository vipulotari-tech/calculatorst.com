import { describe, expect, it } from "vitest";
import { getModelForSlug } from "../calculator-registry.ts";
import { readInputs } from "../calculator-math.ts";

function run(slug:string, overrides:Record<string,number>={}, unitOverrides:Record<string,string>={}) {
  const model=getModelForSlug(slug);
  const raw:Record<string,number>={};
  const units:Record<string,string>={};
  for(const field of model.fields){
    if(field.value!==undefined) raw[field.id]=field.value;
    else if(!field.optional) raw[field.id]=field.min!==undefined?field.min:1;
    if(field.unit) units[field.id]=field.unit;
  }
  Object.assign(raw,overrides); Object.assign(units,unitOverrides);
  return model.calculate(readInputs(model.fields,raw,units),units);
}
function val(slug:string,key:string,o:Record<string,number>={},u:Record<string,string>={}){
  const r=run(slug,o,u).rows.find(x=>x.key===key); if(!r) throw new Error("missing "+key+" for "+slug); return r.value;
}
const brickUnits={length:"ft",height:"ft",openings:"ft2",brickLength:"in",brickHeight:"in",brickDepth:"in",joint:"in"};
const blockUnits={length:"ft",height:"ft",openings:"ft2",blockLength:"in",blockHeight:"in",blockDepth:"in",joint:"in"};

describe("Brick & Masonry + CMU golden-value regression suite",()=>{
  it("Brick Calculator supports known wall geometry, wythes, weight and cost",()=>{
    const r=run("brick-calculator",{mode:0,length:10,height:10,openings:0,brickLength:11,brickHeight:11,brickDepth:4,joint:1,wythes:2,waste:10,unitWeight:5,price:2},{...brickUnits,price:"USD/unit"});
    expect(r.rows.find(x=>x.key==="installed")?.value).toBe(200);
    expect(r.rows.find(x=>x.key==="order")?.value).toBe(220);
    expect(r.rows.find(x=>x.key==="weight")?.value).toBe(1100);
    expect(r.rows.find(x=>x.key==="cost")?.value).toBe(440);
  });
  it("Brick Wall reports courses, opening-adjusted quantity, mortar and shipment weight",()=>{
    const r=run("brick-wall-calculator",{length:10,height:10,openings:10,brickLength:11,brickHeight:11,brickDepth:4,joint:1,wythes:1,waste:0,mortarCoverage:10,unitWeight:5,price:0},brickUnits);
    expect(r.rows.find(x=>x.key==="courses")?.value).toBe(10);
    expect(r.rows.find(x=>x.key==="perCourse")?.value).toBe(10);
    expect(r.rows.find(x=>x.key==="installed")?.value).toBe(90);
    expect(r.rows.find(x=>x.key==="mortarBags")?.value).toBe(9);
    expect(r.rows.find(x=>x.key==="netArea")?.value).toBe(90);
    expect(r.rows.find(x=>x.key==="weight")?.value).toBe(450);
    expect(r.rows.find(x=>x.key==="tons")?.value).toBeCloseTo(0.225,8);
  });
  it("Brick Wall preserves mixed-unit geometry",()=>{
    const r=run("brick-wall-calculator",{length:3.048,height:3.048,openings:0,brickLength:279.4,brickHeight:27.94,brickDepth:4,joint:25.4,wythes:1,waste:0,mortarCoverage:10,unitWeight:5,price:0},{length:"m",height:"m",openings:"m2",brickLength:"mm",brickHeight:"cm",brickDepth:"in",joint:"mm"});
    expect(r.rows.find(x=>x.key==="installed")?.value).toBe(100);
    expect(r.rows.find(x=>x.key==="mortarBags")?.value).toBe(10);
  });
  it("Brick Quantity separates installed bricks from allowance",()=>{
    const r=run("brick-quantity-calculator",{length:10,height:10,openings:0,brickLength:11,brickHeight:11,joint:1,wythes:1,waste:10},{length:"ft",height:"ft",openings:"ft2",brickLength:"in",brickHeight:"in",joint:"in"});
    expect(r.rows.find(x=>x.key==="installed")?.value).toBe(100);
    expect(r.rows.find(x=>x.key==="order")?.value).toBe(110);
    expect(r.rows.find(x=>x.key==="extra")?.value).toBe(10);
  });
  it("Brick Cost prices opening-adjusted bricks, mortar, tax, delivery and labor explicitly",()=>{
    const r=run("brick-cost-calculator",{length:10,height:10,openings:10,brickLength:11,brickHeight:11,brickDepth:4,joint:1,wythes:1,waste:10,price:2,blocksPerMortarBag:10,mortarBagPrice:5,tax:10,delivery:20,labor:30},{...brickUnits,price:"USD/unit"});
    expect(r.rows.find(x=>x.key==="installed")?.value).toBe(90);
    expect(r.rows.find(x=>x.key==="order")?.value).toBe(99);
    expect(r.rows.find(x=>x.key==="extra")?.value).toBe(9);
    expect(r.rows.find(x=>x.key==="mortarBags")?.value).toBe(9);
    expect(r.rows.find(x=>x.key==="netArea")?.value).toBe(90);
    expect(r.rows.find(x=>x.key==="materials")?.value).toBe(243);
    expect(r.rows.find(x=>x.key==="total")?.value).toBe(317.3);
    expect(r.rows.find(x=>x.key==="costPerArea")?.value).toBeCloseTo(317.3/90,8);
  });
  it("Brick Cost rejects zero mortar coverage before division",()=>{
    expect(()=>run("brick-cost-calculator",{blocksPerMortarBag:0})).toThrow();
  });
  it("Brick Mortar derives geometric joint volume and bag quantity",()=>{
    const r=run("brick-mortar-calculator",{length:10,height:10,openings:0,brickLength:11,brickHeight:11,brickDepth:4,joint:1,wythes:1,bagYield:0.5,waste:0,price:0},brickUnits);
    const wall=100*(4/12);
    const brick=100*(11/12)*(11/12)*(4/12);
    const mortar=wall-brick;
    expect(r.rows.find(x=>x.key==="mortar")?.value).toBeCloseTo(mortar,8);
    expect(r.rows.find(x=>x.key==="bags")?.value).toBe(Math.ceil(mortar/0.5));
  });
  it("Brick Veneer estimates one-wythe bricks and planning tie grid",()=>{
    const r=run("brick-veneer-calculator",{length:10,height:10,openings:0,brickLength:11,brickHeight:11,brickDepth:4,joint:1,waste:0,unitWeight:5,tieSpacingH:24,tieSpacingV:24,price:0},{...brickUnits,tieSpacingH:"in",tieSpacingV:"in"});
    expect(r.rows.find(x=>x.key==="installed")?.value).toBe(100);
    expect(r.rows.find(x=>x.key==="ties")?.value).toBe(36);
  });
  it("Brick Patio rounds layout rows and columns",()=>{
    const r=run("brick-patio-calculator",{length:10,width:10,unitLength:11,unitWidth:11,joint:1,waste:10,price:2},{length:"ft",width:"ft",unitLength:"in",unitWidth:"in",joint:"in",price:"USD/unit"});
    expect(r.rows.find(x=>x.key==="installed")?.value).toBe(100);
    expect(r.rows.find(x=>x.key==="order")?.value).toBe(110);
    expect(r.rows.find(x=>x.key==="cost")?.value).toBe(220);
  });
  it("Brick Paver adds compacted base, bedding sand and perimeter",()=>{
    const r=run("brick-paver-calculator",{length:10,width:10,unitLength:11,unitWidth:11,joint:1,waste:0,baseDepth:4,sandDepth:1,price:0},{length:"ft",width:"ft",unitLength:"in",unitWidth:"in",joint:"in",baseDepth:"in",sandDepth:"in"});
    expect(r.rows.find(x=>x.key==="installed")?.value).toBe(100);
    expect(r.rows.find(x=>x.key==="base")?.value).toBeCloseTo((100*4/12)/27,8);
    expect(r.rows.find(x=>x.key==="sand")?.value).toBeCloseTo((100/12)/27,8);
    expect(r.rows.find(x=>x.key==="edge")?.value).toBe(40);
  });
  it("Masonry Calculator handles generic unit modules",()=>{
    expect(val("masonry-calculator","order",{length:10,height:10,openings:0,unitLength:11,unitHeight:11,joint:1,wythes:1,waste:0,unitWeight:5,price:0},{length:"ft",height:"ft",openings:"ft2",unitLength:"in",unitHeight:"in",joint:"in"})).toBe(100);
  });
  it("Masonry Wall reports gross courses",()=>{
    const r=run("masonry-wall-calculator",{length:10,height:10,openings:0,unitLength:11,unitHeight:11,joint:1,wythes:1,waste:0,unitWeight:5,price:0},{length:"ft",height:"ft",openings:"ft2",unitLength:"in",unitHeight:"in",joint:"in"});
    expect(r.rows.find(x=>x.key==="courses")?.value).toBe(10);
    expect(r.rows.find(x=>x.key==="perCourse")?.value).toBe(10);
    expect(r.rows.find(x=>x.key==="order")?.value).toBe(100);
  });
  it("Masonry Cost keeps entered cost scope explicit",()=>{
    const r=run("masonry-cost-calculator",{length:10,height:10,openings:0,unitLength:11,unitHeight:11,joint:1,wythes:1,waste:0,unitWeight:5,price:2,tax:10,delivery:20,labor:30},{length:"ft",height:"ft",openings:"ft2",unitLength:"in",unitHeight:"in",joint:"in",price:"USD/unit"});
    expect(r.rows.find(x=>x.key==="order")?.value).toBe(100);
    expect(r.rows.find(x=>x.key==="total")?.value).toBe(270);
  });
  it("Masonry Block uses block face modules",()=>{
    expect(val("masonry-block-calculator","order",{length:10,height:10,openings:0,unitLength:11,unitHeight:11,joint:1,waste:0,unitWeight:35,price:0},{length:"ft",height:"ft",openings:"ft2",unitLength:"in",unitHeight:"in",joint:"in"})).toBe(100);
  });
  it("Brick Weight uses brick count × unit weight, not bulk density",()=>{
    const r=run("brick-weight-calculator",{quantity:100,unitWeight:5,waste:10,palletCapacity:50});
    expect(r.rows.find(x=>x.key==="order")?.value).toBe(110);
    expect(r.rows.find(x=>x.key==="weight")?.value).toBe(550);
    expect(r.rows.find(x=>x.key==="pallets")?.value).toBe(3);
  });
  it("Brick Waste rounds final purchasing quantity once",()=>{
    const r=run("brick-waste-calculator",{quantity:1000,waste:10});
    expect(r.rows.find(x=>x.key==="extra")?.value).toBeCloseTo(100,8);
    expect(r.rows.find(x=>x.key==="order")?.value).toBe(1100);
  });
  it("Brick Joint solves internal joint width using N-1 joints",()=>{
    expect(val("brick-joint-calculator","joint",{length:25,brickLength:8,quantity:3},{length:"in",brickLength:"in"})).toBeCloseTo(0.5,8);
  });

  it("Concrete Block Calculator respects specified CMU module",()=>{
    const r=run("concrete-block-calculator",{length:10,height:10,openings:0,blockLength:11,blockHeight:11,blockDepth:8,joint:1,waste:0,unitWeight:35,price:2},{...blockUnits,price:"USD/unit"});
    expect(r.rows.find(x=>x.key==="installed")?.value).toBe(100);
    expect(r.rows.find(x=>x.key==="courses")?.value).toBe(10);
    expect(r.rows.find(x=>x.key==="weight")?.value).toBe(3500);
    expect(r.rows.find(x=>x.key==="cost")?.value).toBe(200);
  });
  it("CMU Calculator custom mode uses specified face dimensions",()=>{
    const r=run("cmu-calculator",{length:10,height:10,openings:0,sizeMode:2,blockLength:11,blockHeight:11,joint:1,waste:0,unitWeight:35,price:0},{length:"ft",height:"ft",openings:"ft2",blockLength:"in",blockHeight:"in",joint:"in"});
    expect(r.rows.find(x=>x.key==="installed")?.value).toBe(100);
    expect(r.rows.find(x=>x.key==="courses")?.value).toBe(10);
  });
  it("CMU Wall deducts openings once",()=>{
    const r=run("cmu-wall-calculator",{length:10,height:10,openings:10,blockLength:11,blockHeight:11,blockDepth:8,joint:1,waste:0,unitWeight:35,price:0},blockUnits);
    expect(r.rows.find(x=>x.key==="installed")?.value).toBe(90);
    expect(r.rows.find(x=>x.key==="openingUnits")?.value).toBe(10);
  });
  it("CMU Quantity separates installed and spare blocks",()=>{
    const r=run("cmu-quantity-calculator",{length:10,height:10,openings:0,blockLength:11,blockHeight:11,joint:1,waste:10},{length:"ft",height:"ft",openings:"ft2",blockLength:"in",blockHeight:"in",joint:"in"});
    expect(r.rows.find(x=>x.key==="installed")?.value).toBe(100);
    expect(r.rows.find(x=>x.key==="order")?.value).toBe(110);
  });
  it("CMU Cost includes block and mortar material scope",()=>{
    const r=run("cmu-cost-calculator",{length:10,height:10,openings:0,blockLength:11,blockHeight:11,blockDepth:8,joint:1,waste:0,unitWeight:35,price:2,blocksPerMortarBag:10,mortarBagPrice:5,tax:10,delivery:20,labor:30},{...blockUnits,price:"USD/unit"});
    expect(r.rows.find(x=>x.key==="order")?.value).toBe(100);
    expect(r.rows.find(x=>x.key==="mortarBags")?.value).toBe(10);
    expect(r.rows.find(x=>x.key==="materials")?.value).toBe(250);
    expect(r.rows.find(x=>x.key==="total")?.value).toBe(325);
  });
  it("Concrete Block Wall matches CMU wall geometry",()=>{
    expect(val("concrete-block-wall-calculator","order",{length:10,height:10,openings:0,blockLength:11,blockHeight:11,blockDepth:8,joint:1,waste:0,unitWeight:35,price:0},blockUnits)).toBe(100);
  });
  it("Concrete Block Weight uses block count × manufacturer unit weight",()=>{
    const r=run("concrete-block-weight-calculator",{quantity:100,unitWeight:35,waste:10,palletCapacity:50});
    expect(r.rows.find(x=>x.key==="order")?.value).toBe(110);
    expect(r.rows.find(x=>x.key==="weight")?.value).toBe(3850);
    expect(r.rows.find(x=>x.key==="pallets")?.value).toBe(3);
  });
  it("Concrete Block Mortar uses product blocks-per-bag coverage",()=>{
    const r=run("concrete-block-mortar-calculator",{mode:0,units:100,coverage:10,waste:10,price:5},{price:"USD/bag"});
    expect(r.rows.find(x=>x.key==="bags")?.value).toBe(11);
    expect(r.rows.find(x=>x.key==="cost")?.value).toBe(55);
  });
  it("CMU Grout separates vertical core and bond-beam grout",()=>{
    const r=run("cmu-grout-calculator",{groutedBlocks:100,cellsPerBlock:1,cellVolume:0.1,bondBeamLength:10,bondBeamArea:0.5,waste:10,bagYield:0.5,price:2},{bondBeamLength:"ft",bondBeamArea:"ft2",price:"USD/bag"});
    expect(r.rows.find(x=>x.key==="vertical")?.value).toBeCloseTo(10,8);
    expect(r.rows.find(x=>x.key==="bondBeam")?.value).toBeCloseTo(5,8);
    expect(r.rows.find(x=>x.key==="ft3")?.value).toBeCloseTo(16.5,8);
    expect(r.rows.find(x=>x.key==="bags")?.value).toBe(33);
    expect(r.rows.find(x=>x.key==="cost")?.value).toBe(66);
  });
  it("CMU Reinforcement separates vertical and horizontal bar runs",()=>{
    const r=run("cmu-reinforcement-calculator",{length:20,height:8,verticalSpacing:4,horizontalSpacing:4,size:4,verticalBarsPerCell:1,horizontalBarsPerCourse:1,waste:10,price:1},{length:"ft",height:"ft",verticalSpacing:"ft",horizontalSpacing:"ft",price:"USD/ft"});
    expect(r.rows.find(x=>x.key==="verticalLocations")?.value).toBe(6);
    expect(r.rows.find(x=>x.key==="horizontalRuns")?.value).toBe(3);
    expect(r.rows.find(x=>x.key==="verticalLength")?.value).toBe(48);
    expect(r.rows.find(x=>x.key==="horizontalLength")?.value).toBe(60);
    expect(r.rows.find(x=>x.key==="orderLength")?.value).toBeCloseTo(118.8,8);
    expect(r.rows.find(x=>x.key==="weight")?.value).toBeCloseTo(118.8*0.668,8);
    expect(r.rows.find(x=>x.key==="cost")?.value).toBeCloseTo(118.8,8);
  });
});
