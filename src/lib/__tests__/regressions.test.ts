import { describe, expect, it } from 'vitest';
import { getModelForSlug, slugToModelKey } from '../calculator-registry';
import { factors, fmt, readInputs } from '../calculator-math';
import { searchCalculators, searchCatalog } from '../search';

function calculate(slug: string, changes: Record<string, number> = {}) {
  const model = getModelForSlug(slug);
  const raw = Object.fromEntries(model.fields.filter(f => !f.optional).map(f => [f.id, f.value ?? 100]));
  const units = Object.fromEntries(model.fields.map(f => [f.id, f.unit ?? '']));
  return model.calculate(readInputs(model.fields, {...raw,...changes},units),units);
}
describe('Page intent regression cases', () => {
  it('uses nominal CMU face area, not brick dimensions', () => {
    const res = calculate('concrete-block-calculator',{length:10,width:10,waste:0});
    expect(res.rows.find(r => r.key === 'units')?.value).toBe(113);
  });
  it('counts trusses across building length', () => {
    expect(calculate('roof-truss-calculator',{length:40,spacing:24,extra:0}).rows[0].value).toBe(21);
  });
  it('estimates compound containers from product coverage', () => {
    const res = calculate('drywall-joint-compound-calculator',{length:20,width:10,coverage:100,waste:10});
    expect(res.rows[0].value).toBe(3);
    expect(res.rows[0].unit).toBe('packages');
  });
  it('omits coarse aggregate from default cement/sand mixes', () => {
    expect(calculate('cement-sand-ratio-calculator').rows.find(r => r.key === 'aggregate')?.value).toBe(0);
  });
  it('does not silently dispatch unknown URLs to concrete', () => {
    expect(() => getModelForSlug('unknown-calculator')).toThrow();
  });
  it('retains nonzero tiny results', () => { expect(fmt(1e-8)).not.toBe('0'); });
});

describe('Every registered model: input contract and equivalent units', () => {
  for (const slug of Object.keys(slugToModelKey)) {
    it(slug, () => {
      const model = getModelForSlug(slug);
      const raw = Object.fromEntries(model.fields.filter(f => !f.optional).map(f => [f.id, f.value ?? 100]));
      const units = Object.fromEntries(model.fields.map(f => [f.id, f.unit ?? '']));
      const baseline = readInputs(model.fields,raw,units);
      for (const f of model.fields) {
        for (const bad of ['NaN','Infinity','abc','0x10',-1e30,1e30]) {
          expect(() => readInputs(model.fields,{...raw,[f.id]:bad},units)).toThrow();
        }
        if (!f.optional) expect(() => readInputs(model.fields,{...raw,[f.id]:''},units)).toThrow();
        if (f.integer) expect(() => readInputs(model.fields,{...raw,[f.id]:2.5},units)).toThrow();
        if (!f.dimension || f.dimension === 'number' || !f.units || f.optional) continue;
        for (const unit of f.units) {
          const equivalent = baseline[f.id] / factors[f.dimension][unit];
          const converted = readInputs(model.fields,{...raw,[f.id]:equivalent},{...units,[f.id]:unit});
          expect(converted[f.id]).toBeCloseTo(baseline[f.id],8);
        }
      }
    });
  }
});

describe('Search intent', () => {
  it('ranks related calculators for a short partial query', () => {
    const hits = searchCalculators('con');
    expect(hits.length).toBeGreaterThan(5);
    expect(hits.slice(0, 5).every(c => /concrete/i.test(`${c.h1} ${c.category}`))).toBe(true);
  });
  it.each(['concret','concerte','CONCRETE','concretes'])('finds concrete for %s', q => {
    expect(searchCalculators(q).some(c => c.slug === 'concrete-calculator')).toBe(true);
  });
  it.each([['sheetrock','drywall-calculator'],['cinder block','concrete-block-calculator'],['timber','lumber-calculator']])('matches %s', (q,slug) => {
    expect(searchCalculators(q).some(c => c.slug === slug)).toBe(true);
  });
  it('includes every published calculator', () => expect(searchCatalog).toHaveLength(205));
  it('returns useful empty results', () => expect(searchCalculators('zzzzzzzzz')).toEqual([]));
});
