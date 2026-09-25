import { describe, expect, it } from "vitest";
import { hubCalculators } from "../../data/hubCalculators";
import { calculators as legacyCalculators } from "../../data/calculators";

function checkMeta(cluster:string,count:number){
  const pages=hubCalculators.filter(p=>p.cluster===cluster);
  expect(pages).toHaveLength(count);
  expect(new Set(pages.map(p=>p.title)).size).toBe(count);
  expect(new Set(pages.map(p=>p.description)).size).toBe(count);
  for(const p of pages){
    expect(p.title.length,p.slug).toBeGreaterThanOrEqual(35);
    expect(p.title.length,p.slug).toBeLessThanOrEqual(70);
    expect(p.description.length,p.slug).toBeGreaterThanOrEqual(120);
    expect(p.description.length,p.slug).toBeLessThanOrEqual(180);
  }
  return pages;
}
function expectUniqueKeywords(pages:ReturnType<typeof checkMeta>){
  const owners=new Map<string,string[]>();
  for(const p of pages) for(const kw of p.keywords??[]){
    const k=kw.toLowerCase();
    owners.set(k,[...(owners.get(k)??[]),p.slug]);
  }
  const duplicates=[...owners.entries()].filter(([,slugs])=>slugs.length>1);
  expect(duplicates).toEqual([]);
}

describe("Mortar, grout & cement SEO quality",()=>{
  it("keeps 12 unique, SERP-sized pages",()=>{checkMeta("mortar",12);});
  it("separates major material intents",()=>{
    const p=new Map(checkMeta("mortar",12).map(x=>[x.slug,x]));
    expect(p.get("mortar-calculator")!.description).toMatch(/brick|block|mixed mortar volume/i);
    expect(p.get("mortar-mix-calculator")!.description).toMatch(/cement|lime|sand|ratio/i);
    expect(p.get("grout-quantity-calculator")!.description).toMatch(/tile|joint width|joint.*depth/i);
    expect(p.get("cement-bag-calculator")!.description).toMatch(/cement:sand:aggregate|dry batch/i);
    expect(p.get("cement-sand-ratio-calculator")!.description).toMatch(/sand.*tons|cement bags/i);
    expect(p.get("deck-mud-calculator")!.description).toMatch(/bed thickness|yield/i);
    expect(p.get("stucco-calculator")!.description).toMatch(/base-coat|finish-coat/i);
  });
  it("owns keywords cleanly inside the category",()=>expectUniqueKeywords(checkMeta("mortar",12)));
  it("does not claim to select mortar/grout structural specifications",()=>{
    const text=checkMeta("mortar",12).map(x=>x.title+" "+x.description).join("\n").toLowerCase();
    expect(text).not.toContain("required mortar type");
    expect(text).not.toContain("required grout strength");
    expect(text).not.toContain("code compliant mix");
  });
});

describe("Gravel, aggregate & dirt SEO quality",()=>{
  it("keeps 15 unique, SERP-sized pages",()=>{checkMeta("gravel",15);});
  it("separates volume, weight, depth and cost intents",()=>{
    const p=new Map(checkMeta("gravel",15).map(x=>[x.slug,x]));
    expect(p.get("gravel-calculator")!.description).toMatch(/yards|tons|optional cost/i);
    expect(p.get("gravel-weight-calculator")!.description).toMatch(/measured.*weight|kilograms|tonnes/i);
    expect(p.get("gravel-depth-calculator")!.description).toMatch(/coverage depth|volume or weight/i);
    expect(p.get("gravel-cost-calculator")!.description).toMatch(/tax|delivery|spreading/i);
    expect(p.get("crushed-stone-calculator")!.description).toMatch(/crusher run|crushed concrete/i);
    expect(p.get("topsoil-calculator")!.description).toMatch(/topsoil|bulk density/i);
  });
  it("owns keywords cleanly inside the category",()=>expectUniqueKeywords(checkMeta("gravel",15)));
  it("keeps the featured legacy Gravel Calculator metadata aligned with the upgraded hub entry",()=>{
    const hub=hubCalculators.find(p=>p.slug==="gravel-calculator");
    const legacy=legacyCalculators.find(p=>p.slug==="gravel-calculator");
    expect(legacy?.title).toBe(hub?.title);
    expect(legacy?.description).toBe(hub?.description);
    expect(legacy?.category).toBe(hub?.category);
    expect(legacy?.keywords).toEqual(hub?.keywords);
  });
  it("does not present density or depth as structural recommendations",()=>{
    const text=checkMeta("gravel",15).map(x=>x.title+" "+x.description).join("\n").toLowerCase();
    expect(text).not.toContain("required base depth");
    expect(text).not.toContain("code required gravel");
  });
});

describe("Excavation & earthwork SEO quality",()=>{
  it("keeps 10 unique, SERP-sized pages",()=>{checkMeta("excavation",10);});
  it("separates excavation, trench, backfill, balance and hauling intents",()=>{
    const p=new Map(checkMeta("excavation",10).map(x=>[x.slug,x]));
    expect(p.get("excavation-calculator")!.description).toMatch(/sloped sides|bank|loose/i);
    expect(p.get("excavation-cost-calculator")!.description).toMatch(/haul|truck trips|equipment/i);
    expect(p.get("trench-backfill-calculator")!.description).toMatch(/pipe|bedding|backfill/i);
    expect(p.get("cut-and-fill-calculator")!.description).toMatch(/export|import|bank/i);
    expect(p.get("dirt-removal-calculator")!.description).toMatch(/truck trips|disposal/i);
    expect(p.get("soil-weight-calculator")!.description).toMatch(/pounds|tons|kilograms/i);
  });
  it("owns keywords cleanly inside the category",()=>expectUniqueKeywords(checkMeta("excavation",10)));
  it("does not imply side slopes are safety recommendations",()=>{
    const text=checkMeta("excavation",10).map(x=>x.title+" "+x.description).join("\n").toLowerCase();
    expect(text).not.toContain("safe slope calculator");
    expect(text).not.toContain("osha compliant slope");
  });
});
