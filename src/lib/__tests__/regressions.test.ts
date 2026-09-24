import { describe, expect, it } from 'vitest';
import { getModelForSlug, slugToModelKey } from '../calculator-registry';
import { factors, fmt, readInputs } from '../calculator-math';
import { searchCalculators, searchCatalog } from '../search';
import { hubCalculators, hubCategories } from '../../data/hubCalculators';
import { calculators as legacyCalculators } from '../../data/calculators';

function calculate(slug: string, changes: Record<string, number> = {}) {
  const model = getModelForSlug(slug);
  const raw = Object.fromEntries(model.fields.filter(f => !f.optional).map(f => [f.id, f.value ?? 100]));
  const units = Object.fromEntries(model.fields.map(f => [f.id, f.unit ?? '']));
  return model.calculate(readInputs(model.fields, {...raw,...changes},units),units);
}
describe('Page intent regression cases', () => {
  it('uses nominal CMU face area, not brick dimensions', () => {
    const res = calculate('concrete-block-calculator',{length:10,height:10,waste:0});
    expect(res.rows.find(r => r.key === 'installed')?.value).toBe(113);
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
    expect(calculate('cement-sand-ratio-calculator').rows.find(r => r.key === 'aggregateVol')?.value).toBeCloseTo(0, 7);
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
  it('includes every published calculator', () => expect(searchCatalog).toHaveLength(204));
  it('returns useful empty results', () => expect(searchCalculators('zzzzzzzzz')).toEqual([]));
});


describe('Traffic-priority distinct calculator models', () => {
  it('calculates excavation cost from bank and loose-volume rate bases', () => {
    const res=calculate('excavation-cost-calculator',{length:10,width:10,depth:2,swell:20,bankRate:10,haulRate:5,equipment:100,labor:50});
    expect(res.rows.find(r=>r.key==='bank')?.value).toBeCloseTo(200/27,8);
    expect(res.rows.find(r=>r.key==='loose')?.value).toBeCloseTo((200/27)*1.2,8);
    expect(res.rows.find(r=>r.key==='total')?.value).toBeCloseTo((200/27)*10+(200/27)*1.2*5+150,8);
  });
  it('gives wall framing studs plus plate and stud linear footage', () => {
    const res=calculate('wall-framing-calculator',{length:20,height:8,spacing:16,extra:2,topPlates:2,bottomPlates:1,waste:0});
    expect(res.rows.find(r=>r.key==='studs')?.value).toBe(18);
    expect(res.rows.find(r=>r.key==='net')?.value).toBeCloseTo(204,8);
  });
  it('normalizes a user-entered mortar cement lime sand ratio', () => {
    const res=calculate('mortar-mix-calculator',{volume:10,cementParts:1,limeParts:1,sandParts:6});
    // The form's default volume unit is yd³, so 10 yd³ = 270 ft³ before ratio splitting.
    expect(res.rows.find(r=>r.key==='cement')?.value).toBeCloseTo(33.75,8);
    expect(res.rows.find(r=>r.key==='lime')?.value).toBeCloseTo(33.75,8);
    expect(res.rows.find(r=>r.key==='sand')?.value).toBeCloseTo(202.5,8);
  });
});


describe('Drywall intent separation', () => {
  it('calculates known surface area from actual sheet dimensions', () => {
    const res=calculate('drywall-sheet-calculator',{area:480,sheetLength:8,sheetWidth:4,waste:10});
    expect(res.rows.find(r=>r.key==='sheets')?.value).toBe(17);
    expect(res.rows.find(r=>r.key==='sheetArea')?.value).toBeCloseTo(32,8);
    expect(res.rows.find(r=>r.key==='purchased')?.value).toBeCloseTo(544,8);
  });
});


describe('Mortar intent separation', () => {
  it('derives mortar quantity from wall and unit geometry', () => {
    const res=calculate('mortar-quantity-calculator',{length:10,height:10,openings:0,unitLength:11,unitHeight:11,joint:1,bedDepth:4,yield:1,waste:0});
    expect(res.rows.find(r=>r.key==='area')?.value).toBeCloseTo(100,8);
    expect(res.rows.find(r=>r.key==='mortar')?.value).toBeCloseTo(2300/432,8);
    expect(res.rows.find(r=>r.key==='bags')?.value).toBe(6);
  });
});


describe('Crushed stone traffic-priority calculator', () => {
  it('supports dimensions and returns yards plus tons', () => {
    const res=calculate('crushed-stone-calculator',{mode:0,length:3,width:3,depth:36,density:1.5,waste:0});
    expect(res.rows.find(r=>r.key==='order')?.value).toBeCloseTo(1,8);
    expect(res.rows.find(r=>r.key==='tons')?.value).toBeCloseTo(1.5,8);
  });
});


describe('Roofing shingle intent separation', () => {
  it('lets the main estimator use known sloped roof area', () => {
    const res=calculate('roofing-shingle-calculator',{mode:1,roofArea:100,coverage:25,waste:0});
    expect(res.rows.find(r=>r.key==='packages')?.value).toBe(4);
    expect(res.rows.find(r=>r.key==='squares')?.value).toBeCloseTo(1,8);
  });
  it('keeps shingle cost focused on material total', () => {
    const res=calculate('shingle-cost-calculator',{roofArea:100,coverage:25,waste:0,price:10,delivery:20,tax:10});
    expect(res.rows.find(r=>r.key==='total')?.value).toBeCloseTo(64,8);
  });
});


describe('Gravel weight traffic-priority calculator', () => {
  it('calculates weight directly from measured dimensions', () => {
    const res=calculate('gravel-weight-calculator',{mode:0,length:3,width:3,depth:36,density:1.5});
    expect(res.rows.find(r=>r.key==='volume')?.value).toBeCloseTo(1,8);
    expect(res.rows.find(r=>r.key==='tons')?.value).toBeCloseTo(1.5,8);
    expect(res.rows.find(r=>r.key==='weight')?.value).toBeCloseTo(3000,8);
  });
});


describe('Parking lot cost intent separation', () => {
  it('uses asphalt tonnage and entered cost scope', () => {
    const res=calculate('parking-lot-cost-calculator',{length:10,width:10,depth:3,density:144,waste:0,price:100,delivery:50,labor:150,tax:10});
    expect(res.rows.find(r=>r.key==='tons')?.value).toBeCloseTo(1.8,8);
    expect(res.rows.find(r=>r.key==='total')?.value).toBeCloseTo(398,8);
  });
});


describe('SEO catalog integrity', () => {
  const catalog = [...new Map([...hubCalculators, ...legacyCalculators].map(c => [c.slug, c])).values()];

  it('keeps exactly one published entry per calculator', () => {
    expect(catalog).toHaveLength(204);
    expect(new Set(catalog.map(c => c.slug)).size).toBe(catalog.length);
  });

  it('keeps titles, H1s and owned keywords unique', () => {
    expect(new Set(catalog.map(c => c.title.toLowerCase())).size).toBe(catalog.length);
    expect(new Set(catalog.map(c => c.h1.toLowerCase())).size).toBe(catalog.length);
    const keywords = catalog.flatMap(c => (c.keywords ?? []).map(keyword => keyword.toLowerCase()));
    expect(new Set(keywords).size).toBe(keywords.length);
  });

  it('keeps calculator titles free of stale year labels', () => {
    expect(catalog.every(c => !c.title.includes('(2026)'))).toBe(true);
  });

  it('keeps category counts synchronized with the catalog', () => {
    const aliases: Record<string, string> = {
      'slab-patio-driveway': 'slab',
      'brick-masonry': 'brick',
      'concrete-block': 'cmu',
      'mortar-grout-cement': 'mortar',
      'drywall-paint': 'drywall',
      'deck-fence': 'deck-fence',
    };
    for (const category of hubCategories) {
      const cluster = aliases[category.slug] ?? category.slug;
      expect(catalog.filter(c => c.cluster === cluster).length).toBe(category.count);
    }
  });
});
