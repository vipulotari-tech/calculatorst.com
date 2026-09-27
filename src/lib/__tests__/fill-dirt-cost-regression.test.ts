import { describe, expect, it } from "vitest";
import { getModelForSlug } from "../calculator-registry.ts";
import { readInputs } from "../calculator-math.ts";

function run(overrides:Record<string,number>, unitOverrides:Record<string,string>) {
  const model=getModelForSlug("fill-dirt-cost-calculator");
  const raw:Record<string,number>={};
  const units:Record<string,string>={};
  for(const field of model.fields){
    if(field.value!==undefined) raw[field.id]=field.value;
    else if(!field.optional) raw[field.id]=field.min!==undefined?field.min:1;
    if(field.unit) units[field.id]=field.unit;
  }
  Object.assign(raw,overrides);
  Object.assign(units,unitOverrides);
  return model.calculate(readInputs(model.fields,raw,units),units);
}

describe("Fill Dirt Cost golden regressions",()=>{
  it("keeps compaction and purchasing waste independent",()=>{
    const r=run({mode:2,volume:27,material:0,compaction:15,waste:10,price:20,tax:5,delivery:50,labor:25},{volume:"ft3",price:"USD/yd3"});
    const order=1.15*1.10;
    expect(r.rows.find(x=>x.key==="order")?.value).toBeCloseTo(order,8);
    expect(r.rows.find(x=>x.key==="tons")?.value).toBeCloseTo(order*1.10,8);
    expect(r.rows.find(x=>x.key==="total")?.value).toBeCloseTo(order*20*1.05+75,8);
  });

  it("prices metric volume and custom supplier density",()=>{
    const metric=run({mode:2,volume:1,material:0,compaction:0,waste:0,price:100,tax:0,delivery:0,labor:0},{volume:"m3",price:"USD/m3"});
    expect(metric.rows.find(x=>x.key==="m3")?.value).toBeCloseTo(1,8);
    expect(metric.rows.find(x=>x.key==="total")?.value).toBeCloseTo(100,8);
    const custom=run({mode:2,volume:27,material:5,density:1.3,compaction:0,waste:0,price:10,tax:0,delivery:0,labor:0},{volume:"ft3",density:"ton/yd3",price:"USD/ton"});
    expect(custom.rows.find(x=>x.key==="tons")?.value).toBeCloseTo(1.3,8);
    expect(custom.rows.find(x=>x.key==="total")?.value).toBeCloseTo(13,8);
  });

  it("rejects zero custom density",()=>{
    expect(()=>run({mode:2,volume:27,material:5,density:0,compaction:0,waste:0,price:10,tax:0,delivery:0,labor:0},{volume:"ft3",density:"ton/yd3",price:"USD/ton"})).toThrow(/at least 0\.01|density must be greater than zero/i);
  });
});
