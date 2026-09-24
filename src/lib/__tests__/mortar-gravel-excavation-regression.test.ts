import { describe, expect, it } from "vitest";
import { getModelForSlug } from "../calculator-registry.ts";
import { readInputs } from "../calculator-math.ts";

function run(slug:string, overrides:Record<string,number>={}, unitOverrides:Record<string,string>={}) {
  const model=getModelForSlug(slug);
  const raw:Record<string,number>={};
  const units:Record<string,string>={};
  for(const f of model.fields){
    if(f.value!==undefined) raw[f.id]=f.value;
    else if(!f.optional) raw[f.id]=f.min!==undefined?f.min:1;
    if(f.unit) units[f.id]=f.unit;
  }
  Object.assign(raw,overrides); Object.assign(units,unitOverrides);
  return model.calculate(readInputs(model.fields,raw,units),units);
}
function val(slug:string,key:string,o:Record<string,number>={},u:Record<string,string>={}){
  const r=run(slug,o,u).rows.find(x=>x.key===key); if(!r) throw new Error("missing "+key+" for "+slug); return r.value;
}
const dims={length:"ft",width:"ft",depth:"in",area:"ft2",volume:"ft3"};

describe("Mortar, grout & cement golden regressions",()=>{
  it("Mortar Calculator supports installed-unit coverage",()=>{
    const r=run("mortar-calculator",{mode:0,units:100,coverage:10,yield:0.5,bagWeight:80,waste:10,price:5},{yield:"ft3",price:"USD/bag"});
    expect(r.rows.find(x=>x.key==="bags")?.value).toBe(11);
    expect(r.rows.find(x=>x.key==="weight")?.value).toBe(880);
    expect(r.rows.find(x=>x.key==="cost")?.value).toBe(55);
  });
  it("Mortar Mix normalizes user ratio only",()=>{
    const r=run("mortar-mix-calculator",{volume:8,cementParts:1,limeParts:1,sandParts:6},{volume:"ft3"});
    expect(r.rows.find(x=>x.key==="cement")?.value).toBeCloseTo(1,8);
    expect(r.rows.find(x=>x.key==="lime")?.value).toBeCloseTo(1,8);
    expect(r.rows.find(x=>x.key==="sand")?.value).toBeCloseTo(6,8);
  });
  it("Mortar Quantity derives wall-joint volume and bags",()=>{
    const r=run("mortar-quantity-calculator",{length:10,height:10,openings:0,unitLength:11,unitHeight:11,joint:1,bedDepth:4,yield:0.5,waste:0,price:0},{length:"ft",height:"ft",openings:"ft2",unitLength:"in",unitHeight:"in",joint:"in",bedDepth:"in",yield:"ft3",price:"USD/bag"});
    expect(r.rows.find(x=>x.key==="mortar")?.value).toBeCloseTo(100*(4/12)*(23/144),8);
    expect(r.rows.find(x=>x.key==="bags")?.value).toBe(11);
  });
  it("Mortar Cost prices explicit bag scope",()=>{
    expect(val("mortar-cost-calculator","total",{bags:10,price:5,tax:10,delivery:20,labor:30},{price:"USD/bag"})).toBe(105);
  });
  it("Grout Calculator converts known mixed volume to bags",()=>{
    const r=run("grout-calculator",{volume:5,yield:0.5,bagWeight:80,waste:10,price:2},{volume:"ft3",yield:"ft3",price:"USD/bag"});
    expect(r.rows.find(x=>x.key==="bags")?.value).toBe(11);
    expect(r.rows.find(x=>x.key==="cost")?.value).toBe(22);
  });
  it("Grout Quantity uses tile and joint geometry",()=>{
    const r=run("grout-quantity-calculator",{areaMode:1,area:100,tileLength:11,tileWidth:11,jointWidth:1,jointDepth:0.25,yield:0.1,waste:10,price:0},{area:"ft2",tileLength:"in",tileWidth:"in",jointWidth:"in",jointDepth:"in",yield:"ft3",price:"USD/bag"});
    const net=100*(0.25/12)*(23/144);
    expect(r.rows.find(x=>x.key==="volume")?.value).toBeCloseTo(net,8);
    expect(r.rows.find(x=>x.key==="bags")?.value).toBe(Math.ceil(net*1.1/0.1));
  });
  it("Grout Cost prices bag scope",()=>{expect(val("grout-cost-calculator","total",{bags:10,price:5,tax:10,delivery:20,labor:30},{price:"USD/bag"})).toBe(105);});
  it("Cement Calculator converts cement volume to whole bags",()=>{
    const r=run("cement-calculator",{volume:10,yield:1,bagWeight:94,waste:10,price:10},{volume:"ft3",yield:"ft3",price:"USD/bag"});
    expect(r.rows.find(x=>x.key==="bags")?.value).toBe(11);
    expect(r.rows.find(x=>x.key==="weight")?.value).toBe(1034);
    expect(r.rows.find(x=>x.key==="cost")?.value).toBe(110);
  });
  it("Cement Bag Calculator derives cement share from 1:2:3 dry ratio",()=>{
    const r=run("cement-bag-calculator",{volume:60,cementParts:1,sandParts:2,aggregateParts:3,bagYield:1,waste:10,price:10},{volume:"ft3",bagYield:"ft3",price:"USD/bag"});
    expect(r.rows.find(x=>x.key==="cement")?.value).toBeCloseTo(10,8);
    expect(r.rows.find(x=>x.key==="sand")?.value).toBeCloseTo(20,8);
    expect(r.rows.find(x=>x.key==="aggregate")?.value).toBeCloseTo(30,8);
    expect(r.rows.find(x=>x.key==="bags")?.value).toBe(11);
  });
  it("Cement Bag Calculator can convert placed volume to dry batch volume",()=>{
    const r=run("cement-bag-calculator",{batchMode:1,volume:60,dryFactor:1.5,cementParts:1,sandParts:2,aggregateParts:3,bagYield:1,waste:0,price:0},{volume:"ft3",bagYield:"ft3",price:"USD/bag"});
    expect(r.rows.find(x=>x.key==="dryBatch")?.value).toBeCloseTo(90,8);
    expect(r.rows.find(x=>x.key==="cement")?.value).toBeCloseTo(15,8);
    expect(r.rows.find(x=>x.key==="sand")?.value).toBeCloseTo(30,8);
    expect(r.rows.find(x=>x.key==="aggregate")?.value).toBeCloseTo(45,8);
    expect(r.rows.find(x=>x.key==="bags")?.value).toBe(15);
  });
  it("Cement Sand Ratio has zero coarse aggregate and material cost",()=>{
    const r=run("cement-sand-ratio-calculator",{volume:50,cementParts:1,sandParts:4,bagYield:1,sandDensity:100,waste:10,cementBagPrice:10,sandTonPrice:50},{volume:"ft3",bagYield:"ft3"});
    expect(r.rows.find(x=>x.key==="aggregateVol")?.value).toBe(0);
    expect(r.rows.find(x=>x.key==="bags")?.value).toBe(11);
    expect(r.rows.find(x=>x.key==="sandWeight")?.value).toBeCloseTo(2.2,8);
    expect(r.rows.find(x=>x.key==="cost")?.value).toBeCloseTo(220,8);
  });
  it("Deck Mud uses average thickness and product yield",()=>{
    const r=run("deck-mud-calculator",{length:10,width:10,thickness:1.2,yield:0.5,waste:0,price:0},{length:"ft",width:"ft",thickness:"in",yield:"ft3",price:"USD/bag"});
    expect(r.rows.find(x=>x.key==="net")?.value).toBeCloseTo(10,8);
    expect(r.rows.find(x=>x.key==="bags")?.value).toBe(20);
  });
  it("Stucco separates base and finish bags",()=>{
    const r=run("stucco-calculator",{length:10,height:10,openings:0,baseCoats:2,baseCoverage:20,finishCoats:1,finishCoverage:50,waste:0},{length:"ft",height:"ft",openings:"ft2",baseCoverage:"ft2",finishCoverage:"ft2"});
    expect(r.rows.find(x=>x.key==="base")?.value).toBe(10);
    expect(r.rows.find(x=>x.key==="finish")?.value).toBe(2);
    expect(r.rows.find(x=>x.key==="total")?.value).toBe(12);
  });
});

describe("Gravel, aggregate & dirt golden regressions",()=>{
  it("Gravel Calculator supports dimensions, presets, compaction and waste",()=>{
    const r=run("gravel-calculator",{mode:0,length:10,width:10,depth:12,material:5,customDensity:1.5,compaction:10,waste:10,price:10},{...dims,customDensity:"ton/yd3",price:"USD/yd3"});
    const measured=100/27, afterCompaction=measured*1.1, order=afterCompaction*1.1;
    expect(r.rows.find(x=>x.key==="net")?.value).toBeCloseTo(measured,8);
    expect(r.rows.find(x=>x.key==="compaction")?.value).toBeCloseTo(afterCompaction,8);
    expect(r.rows.find(x=>x.key==="order")?.value).toBeCloseTo(order,8);
    expect(r.rows.find(x=>x.key==="tons")?.value).toBeCloseTo(order*1.5,8);
    expect(r.rows.find(x=>x.key==="cost")?.value).toBeCloseTo(order*10,8);
  });
  it("Gravel Calculator supports known area and known volume modes",()=>{
    const byArea=run("gravel-calculator",{mode:1,area:100,depth:12,material:1,compaction:0,waste:0,price:0},{area:"ft2",depth:"in",price:"USD/yd3"});
    const byVolume=run("gravel-calculator",{mode:2,volume:100,material:1,compaction:0,waste:0,price:0},{volume:"ft3",price:"USD/yd3"});
    expect(byArea.rows.find(x=>x.key==="net")?.value).toBeCloseTo(100/27,8);
    expect(byVolume.rows.find(x=>x.key==="net")?.value).toBeCloseTo(100/27,8);
  });
  const general=["crushed-stone-calculator","aggregate-calculator","sand-calculator","fill-dirt-calculator","topsoil-calculator"];
  for(const slug of general) it(slug+" computes order volume, weight and optional cost",()=>{
    const r=run(slug,{mode:0,length:10,width:10,depth:12,density:1.5,waste:10,price:10},{...dims,density:"ton/yd3",price:"USD/yd3"});
    expect(r.rows.find(x=>x.key==="order")?.value).toBeCloseTo((100/27)*1.1,8);
    expect(r.rows.find(x=>x.key==="tons")?.value).toBeCloseTo((100/27)*1.1*1.5,8);
    expect(r.rows.find(x=>x.key==="cost")?.value).toBeCloseTo((100/27)*1.1*10,8);
  });
  const costs=["gravel-cost-calculator","crushed-stone-cost-calculator","sand-cost-calculator","fill-dirt-cost-calculator","topsoil-cost-calculator"];
  for(const slug of costs) it(slug+" includes tax delivery and labor",()=>{
    const r=run(slug,{mode:0,length:10,width:10,depth:12,density:1.5,waste:10,price:10,tax:10,delivery:20,labor:30},{...dims,density:"ton/yd3",price:"USD/yd3"});
    const materials=(100/27)*1.1*10;
    expect(r.rows.find(x=>x.key==="materials")?.value).toBeCloseTo(materials,8);
    expect(r.rows.find(x=>x.key==="total")?.value).toBeCloseTo(materials*1.1+50,8);
  });
  for(const slug of ["gravel-weight-calculator","aggregate-weight-calculator","sand-weight-calculator"]) it(slug+" converts dimensions to order weight",()=>{
    const r=run(slug,{mode:0,length:3,width:3,depth:36,density:1.5,waste:0},{...dims,density:"ton/yd3"});
    expect(r.rows.find(x=>x.key==="volume")?.value).toBeCloseTo(1,8);
    expect(r.rows.find(x=>x.key==="tons")?.value).toBeCloseTo(1.5,8);
    expect(r.rows.find(x=>x.key==="weight")?.value).toBeCloseTo(3000,8);
  });
  it("Gravel Depth solves coverage from available volume",()=>{
    const r=run("gravel-depth-calculator",{areaMode:1,area:100,supplyMode:0,volume:100},{area:"ft2",volume:"ft3"});
    expect(r.rows.find(x=>x.key==="depth")?.value).toBeCloseTo(12,8);
    expect(r.rows.find(x=>x.key==="volume")?.value).toBeCloseTo(100/27,8);
  });
});

describe("Excavation & earthwork golden regressions",()=>{
  it("Excavation Calculator includes entered side-slope geometry",()=>{
    const r=run("excavation-calculator",{length:10,width:10,depth:10,sideSlope:0.5,swell:20,price:2},{length:"ft",width:"ft",depth:"ft",price:"USD/yd3"});
    const ft3=1000+0.5*20*100+(4/3)*0.25*1000;
    expect(r.rows.find(x=>x.key==="bank")?.value).toBeCloseTo(ft3/27,8);
    expect(r.rows.find(x=>x.key==="loose")?.value).toBeCloseTo(ft3/27*1.2,8);
  });
  it("Excavation Cost separates bank excavation and loose haul rates",()=>{
    const r=run("excavation-cost-calculator",{length:10,width:10,depth:10,sideSlope:0,swell:20,bankRate:2,haulRate:3,truckCapacity:10,equipment:10,labor:20},{length:"ft",width:"ft",depth:"ft"});
    const bank=1000/27,loose=bank*1.2;
    expect(r.rows.find(x=>x.key==="trips")?.value).toBe(5);
    expect(r.rows.find(x=>x.key==="total")?.value).toBeCloseTo(bank*2+loose*3+30,8);
  });
  it("Trench Calculator handles side slopes and optional bank-yard cost",()=>{
    const r=run("trench-calculator",{length:100,bottomWidth:2,depth:4,sideSlope:0,swell:20,price:2},{length:"ft",bottomWidth:"ft",depth:"ft",price:"USD/yd3"});
    expect(r.rows.find(x=>x.key==="bank")?.value).toBeCloseTo(800/27,8);
    expect(r.rows.find(x=>x.key==="loose")?.value).toBeCloseTo(800/27*1.2,8);
  });
  it("Excavation quantity multiplies identical pits",()=>{
    const r=run("excavation-calculator",{length:10,width:10,depth:10,sideSlope:0,quantity:2,swell:20,price:0},{length:"ft",width:"ft",depth:"ft",price:"USD/yd3"});
    expect(r.rows.find(x=>x.key==="bank")?.value).toBeCloseTo(2000/27,8);
    expect(r.rows.find(x=>x.key==="loose")?.value).toBeCloseTo((2000/27)*1.2,8);
  });
  it("Trench quantity scales yards and metric volume consistently",()=>{
    const r=run("trench-calculator",{length:100,bottomWidth:2,depth:4,sideSlope:0,quantity:2,swell:20,price:0},{length:"ft",bottomWidth:"ft",depth:"ft",price:"USD/yd3"});
    expect(r.rows.find(x=>x.key==="bank")?.value).toBeCloseTo(1600/27,8);
    expect(r.rows.find(x=>x.key==="m3")?.value).toBeCloseTo(1600/(3.280839895013123**3),8);
  });
  it("Trench Volume reports bank and loose volume without pricing",()=>{
    const r=run("trench-volume-calculator",{length:100,bottomWidth:2,depth:4,sideSlope:0,swell:20},{length:"ft",bottomWidth:"ft",depth:"ft"});
    expect(r.rows.find(x=>x.key==="ft3")?.value).toBeCloseTo(800,8);
    expect(r.rows.find(x=>x.key==="loose")?.value).toBeCloseTo(800/27*1.2,8);
  });
  it("Trench Backfill deducts pipe and bedding then converts loose order",()=>{
    const r=run("trench-backfill-calculator",{length:100,width:2,depth:4,pipeDiameter:12,pipeCount:1,beddingDepth:6,looseToPlacedShrink:10,waste:10},{length:"ft",width:"ft",depth:"ft",pipeDiameter:"in",beddingDepth:"in"});
    const placed=800-100*Math.PI/4-100;
    const loose=placed/0.9;
    expect(r.rows.find(x=>x.key==="placed")?.value).toBeCloseTo(placed/27,8);
    expect(r.rows.find(x=>x.key==="order")?.value).toBeCloseTo(loose*1.1/27,8);
  });
  it("Earthwork shows bank loose and compacted equivalents",()=>{
    const r=run("earthwork-calculator",{mode:0,length:10,width:10,depth:10,swell:20,shrink:10,price:2},{length:"ft",width:"ft",depth:"ft",price:"USD/yd3"});
    expect(r.rows.find(x=>x.key==="bank")?.value).toBeCloseTo(1000/27,8);
    expect(r.rows.find(x=>x.key==="loose")?.value).toBeCloseTo(1000/27*1.2,8);
    expect(r.rows.find(x=>x.key==="compacted")?.value).toBeCloseTo(1000/27*0.9,8);
  });
  it("Cut and Fill converts compacted fill to bank basis before balance",()=>{
    const r=run("cut-and-fill-calculator",{cut:1200,fill:800,shrink:20,swell:20},{cut:"ft3",fill:"ft3"});
    expect(r.rows.find(x=>x.key==="required")?.value).toBeCloseTo(1000/27,8);
    expect(r.rows.find(x=>x.key==="export")?.value).toBeCloseTo(200/27,8);
    expect(r.rows.find(x=>x.key==="loose")?.value).toBeCloseTo(240/27,8);
  });
  it("Cut and Fill quick mode derives volumes from area and average depth",()=>{
    const r=run("cut-and-fill-calculator",{mode:1,cutArea:600,cutDepth:2,fillArea:400,fillDepth:2,shrink:20,swell:20},{cutArea:"ft2",cutDepth:"ft",fillArea:"ft2",fillDepth:"ft"});
    expect(r.rows.find(x=>x.key==="cut")?.value).toBeCloseTo(1200/27,8);
    expect(r.rows.find(x=>x.key==="fill")?.value).toBeCloseTo(800/27,8);
    expect(r.rows.find(x=>x.key==="required")?.value).toBeCloseTo(1000/27,8);
    expect(r.rows.find(x=>x.key==="export")?.value).toBeCloseTo(200/27,8);
  });
  it("Dirt Removal calculates loose truck trips and disposal cost",()=>{
    const r=run("dirt-removal-calculator",{length:10,width:10,depth:10,swell:20,truckCapacity:10,haulRate:3,tripFee:20},{length:"ft",width:"ft",depth:"ft"});
    const loose=1000/27*1.2;
    expect(r.rows.find(x=>x.key==="trips")?.value).toBe(5);
    expect(r.rows.find(x=>x.key==="cost")?.value).toBeCloseTo(loose*3+100,8);
  });
  it("Soil Volume supports dimensions and swell",()=>{
    const r=run("soil-volume-calculator",{mode:0,length:10,width:10,depth:10,swell:20},{length:"ft",width:"ft",depth:"ft"});
    expect(r.rows.find(x=>x.key==="bank")?.value).toBeCloseTo(1000/27,8);
    expect(r.rows.find(x=>x.key==="loose")?.value).toBeCloseTo(1000/27*1.2,8);
  });
  it("Soil Weight converts volume and editable density",()=>{
    const r=run("soil-weight-calculator",{mode:0,length:10,width:10,depth:1,density:100,waste:10},{length:"ft",width:"ft",depth:"ft"});
    expect(r.rows.find(x=>x.key==="weight")?.value).toBeCloseTo(11000,8);
    expect(r.rows.find(x=>x.key==="tons")?.value).toBeCloseTo(5.5,8);
  });
});
