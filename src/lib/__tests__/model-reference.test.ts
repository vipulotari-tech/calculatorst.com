import { describe, expect, it } from 'vitest';
import { allModels } from '../calculator-models';
import { getModelForSlug, slugToModelKey } from '../calculator-registry';
import { factors, readInputs } from '../calculator-math';
import { referenceCases } from '../../../audit/reference-cases';

describe('Independent reference scenarios for every production model family',()=>{
  it('covers every model without treating smoke tests as formula verification',()=>{
    expect(new Set(referenceCases.map(c=>c.model))).toEqual(new Set(Object.keys(allModels)));
  });
  for(const c of referenceCases)it(c.model,()=>{
    const m=allModels[c.model];
    const raw={...Object.fromEntries(m.fields.filter(f=>!f.optional).map(f=>[f.id,f.value])),waste:0,...c.input};
    const units={...Object.fromEntries(m.fields.map(f=>[f.id,f.unit??''])),...c.units};
    const rows=m.calculate(readInputs(m.fields,raw as Record<string,number>,units),units).rows;
    for(const [key,value]of Object.entries(c.expected)){
      const row=rows.find(r=>r.key===key);expect(row,`${c.model}/${key}`).toBeDefined();
      expect(row!.value,`${c.model}/${key}`).toBeCloseTo(value,9);
    }
  });
});

describe('Equivalent measurement units preserve actual output rows for every registered URL',()=>{
  for(const slug of Object.keys(slugToModelKey))it(slug,()=>{
    const m=getModelForSlug(slug);
    const raw=Object.fromEntries(m.fields.filter(f=>!f.optional).map(f=>[f.id,f.value??(f.id==='price'?10:1000)]));
    const units=Object.fromEntries(m.fields.map(f=>[f.id,f.unit??'']));
    const parsed=readInputs(m.fields,raw,units);const base=m.calculate(parsed,units).rows;
    for(const field of m.fields){
      if(!field.dimension||field.dimension==='number'||field.optional)continue;
      for(const unit of field.units??[]){
        const changed=readInputs(m.fields,{...raw,[field.id]:parsed[field.id]/factors[field.dimension][unit]},{...units,[field.id]:unit});
        const rows=m.calculate(changed,{...units,[field.id]:unit}).rows;
        expect(rows.map(r=>r.key)).toEqual(base.map(r=>r.key));
        rows.forEach((r,i)=>expect(r.value).toBeCloseTo(base[i].value,7));
      }
    }
  });
});
