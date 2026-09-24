import { describe, expect, it } from "vitest";
import { hubCalculators } from "../../data/hubCalculators";

const brick=hubCalculators.filter(c=>c.cluster==="brick");
const cmu=hubCalculators.filter(c=>c.cluster==="cmu");

describe("Brick & Masonry SEO metadata",()=>{
  it("keeps exactly 15 calculators",()=>{expect(brick).toHaveLength(15);});
  it("uses unique titles/descriptions with sane SERP lengths",()=>{
    expect(new Set(brick.map(p=>p.title)).size).toBe(brick.length);
    expect(new Set(brick.map(p=>p.description)).size).toBe(brick.length);
    for(const p of brick){
      expect(p.title.length,p.slug).toBeGreaterThanOrEqual(35);
      expect(p.title.length,p.slug).toBeLessThanOrEqual(70);
      expect(p.description.length,p.slug).toBeGreaterThanOrEqual(120);
      expect(p.description.length,p.slug).toBeLessThanOrEqual(180);
    }
  });
  it("keeps major brick intents distinct",()=>{
    const map=new Map(brick.map(p=>[p.slug,p]));
    expect(map.get("brick-mortar-calculator")!.description).toMatch(/mortar|bags|joint/i);
    expect(map.get("brick-weight-calculator")!.description).toMatch(/shipment weight|unit weight|pallet/i);
    expect(map.get("brick-paver-calculator")!.description).toMatch(/base|sand|edge/i);
    expect(map.get("brick-veneer-calculator")!.description).toMatch(/veneer|tie/i);
    expect(map.get("brick-joint-calculator")!.description).toMatch(/joint|N−1/i);
  });
  it("avoids pretending takeoff tools perform masonry design",()=>{
    const text=brick.map(p=>p.title+" "+p.description).join("\n").toLowerCase();
    expect(text).not.toContain("code compliant veneer");
    expect(text).not.toContain("required tie spacing");
    expect(text).not.toContain("structural brick design");
  });
  it("keeps patio and paver intents separate",()=>{
    const patio=brick.find(p=>p.slug==="brick-patio-calculator")!;
    const paver=brick.find(p=>p.slug==="brick-paver-calculator")!;
    expect(patio.description).toMatch(/rows|columns|count/i);
    expect(paver.description).toMatch(/base|bedding sand|edge/i);
  });
});

describe("Concrete Block & CMU SEO metadata",()=>{
  it("keeps exactly 10 calculators",()=>{expect(cmu).toHaveLength(10);});
  it("uses unique titles/descriptions with sane SERP lengths",()=>{
    expect(new Set(cmu.map(p=>p.title)).size).toBe(cmu.length);
    expect(new Set(cmu.map(p=>p.description)).size).toBe(cmu.length);
    for(const p of cmu){
      expect(p.title.length,p.slug).toBeGreaterThanOrEqual(35);
      expect(p.title.length,p.slug).toBeLessThanOrEqual(70);
      expect(p.description.length,p.slug).toBeGreaterThanOrEqual(120);
      expect(p.description.length,p.slug).toBeLessThanOrEqual(180);
    }
  });
  it("keeps quantity, mortar, grout, weight and reinforcement intents distinct",()=>{
    const map=new Map(cmu.map(p=>[p.slug,p]));
    expect(map.get("cmu-quantity-calculator")!.description).toMatch(/installed|order|spare/i);
    expect(map.get("concrete-block-mortar-calculator")!.description).toMatch(/mortar|bag|coverage/i);
    expect(map.get("cmu-grout-calculator")!.description).toMatch(/grout|cell|bond-beam/i);
    expect(map.get("concrete-block-weight-calculator")!.description).toMatch(/shipment weight|unit weight|pallet/i);
    expect(map.get("cmu-reinforcement-calculator")!.description).toMatch(/vertical|horizontal|rebar/i);
  });
  it("does not claim to select structural grout or reinforcement",()=>{
    const text=cmu.map(p=>p.title+" "+p.description).join("\n").toLowerCase();
    expect(text).not.toContain("required rebar spacing");
    expect(text).not.toContain("required grout spacing");
    expect(text).not.toContain("structural wall design calculator");
  });
  it("correctly describes CMU reinforcement instead of bags/volume",()=>{
    const p=cmu.find(x=>x.slug==="cmu-reinforcement-calculator")!;
    expect(p.title).toMatch(/reinforcement|rebar/i);
    expect(p.title).not.toMatch(/bags|volume/i);
    expect(p.description).toMatch(/rebar length|weight|spacing/i);
  });
});
