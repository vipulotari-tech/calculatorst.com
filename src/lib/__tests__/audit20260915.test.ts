import { describe, expect, it } from 'vitest';
import { getModelForSlug, slugToModelKey } from '../calculator-registry';
import { getCalculatorContent } from '../calculator-content';
import { readInputs } from '../calculator-math';

function calculate(slug: string, changes: Record<string, number> = {}, selected: Record<string, string> = {}) {
  const m = getModelForSlug(slug);
  const raw = Object.fromEntries(m.fields.filter(f => !f.optional).map(f => [f.id, f.value ?? (f.id === 'price' ? 10 : 100)]));
  const units = {...Object.fromEntries(m.fields.map(f => [f.id, f.unit ?? ''])), ...selected};
  return m.calculate(readInputs(m.fields, {...raw, ...changes}, units), units).rows;
}
const value = (rows: ReturnType<typeof calculate>, key: string) => rows.find(r => r.key === key)!.value;

describe('Independent fence takeoff regressions', () => {
  it('fence-calculator: combined posts, panels, spares and panel pricing stay aligned', () => {
    const exact = calculate('fence-calculator', {length:80, spacing:8, waste:0});
    expect(value(exact,'posts')).toBe(11);
    expect(value(exact,'panels')).toBe(10);
    const remainder = calculate('fence-calculator', {length:81, spacing:8, waste:10, extraPosts:2});
    expect(value(remainder,'posts')).toBe(14);
    expect(value(remainder,'panels')).toBe(11);
    expect(value(remainder,'postOrder')).toBe(16);
    expect(value(remainder,'panelOrder')).toBe(13);
    expect(value(remainder,'spacing')).toBeCloseTo(81/11,10);
    expect(value(calculate('fence-calculator',{price:10}),'cost')).toBe(150);
    expect(value(calculate('fence-calculator',{price:10},{price:'USD/ft'}),'cost')).toBe(1000);
  });
  it('fence-post-calculator: isolates post count, equalized spacing, spares and post pricing', () => {
    const exact=calculate('fence-post-calculator',{length:80,spacing:8,waste:0,extraPosts:0});
    expect(value(exact,'posts')).toBe(11);
    expect(value(exact,'sections')).toBe(10);
    expect(value(exact,'order')).toBe(11);
    expect(value(exact,'spacing')).toBeCloseTo(8,10);
    const remainder=calculate('fence-post-calculator',{length:81,spacing:8,waste:10,extraPosts:2});
    expect(value(remainder,'posts')).toBe(14);
    expect(value(remainder,'sections')).toBe(11);
    expect(value(remainder,'order')).toBe(16);
    expect(value(remainder,'spacing')).toBeCloseTo(81/11,10);
    expect(value(calculate('fence-post-calculator',{length:80,spacing:8,waste:0,price:10}),'cost')).toBe(110);
    const metric=calculate('fence-post-calculator',{length:24.384,spacing:2.4384,waste:0,extraPosts:0},{length:'m',spacing:'m'});
    expect(value(metric,'posts')).toBe(11);
    expect(value(metric,'sections')).toBe(10);
  });
  it('fence-panel-calculator: isolates panel coverage, supporting posts, spares and panel pricing', () => {
    const exact=calculate('fence-panel-calculator',{length:80,panelWidth:8,waste:0,extraPosts:0});
    expect(value(exact,'panels')).toBe(10);
    expect(value(exact,'posts')).toBe(11);
    expect(value(exact,'order')).toBe(10);
    expect(value(exact,'coverage')).toBeCloseTo(80,10);
    const remainder=calculate('fence-panel-calculator',{length:81,panelWidth:8,waste:10,extraPosts:2});
    expect(value(remainder,'panels')).toBe(11);
    expect(value(remainder,'posts')).toBe(14);
    expect(value(remainder,'order')).toBe(13);
    expect(value(remainder,'extra')).toBeCloseTo(7,10);
    expect(value(calculate('fence-panel-calculator',{length:80,panelWidth:8,waste:0,price:10}),'cost')).toBe(100);
    const metric=calculate('fence-panel-calculator',{length:24.384,panelWidth:2.4384,waste:0,extraPosts:0},{length:'m',panelWidth:'m'});
    expect(value(metric,'panels')).toBe(10);
    expect(value(metric,'posts')).toBe(11);
  });
  it('counts pickets with gaps only between pickets', () => {
    expect(value(calculate('fence-picket-calculator',{length:100,width:5.5,gap:0,waste:0}),'installed')).toBe(219);
    const rows=calculate('fence-picket-calculator',{length:100,width:5.5,gap:0,waste:10});
    expect(value(rows,'pickets')).toBe(241);
    expect(value(calculate('fence-picket-calculator',{length:11.5,width:5.5,gap:0.5,waste:0},{length:'in'}),'installed')).toBe(2);
  });
  it('subtracts square post displacement from round concrete holes', () => {
    const rows=calculate('fence-concrete-calculator',{quantity:1,diameter:12,depth:24,postWidth:6,yield:0.5,waste:0});
    expect(value(rows,'per')).toBeCloseTo(Math.PI/2-0.5,12);
    expect(value(rows,'bags')).toBe(3);
    expect(()=>calculate('fence-concrete-calculator',{diameter:6,postWidth:6})).toThrow();
  });
  it('deducts hinge and latch clearances for single and double gates', () => {
    expect(value(calculate('gate-calculator',{opening:48,leaves:1,hinge:0.5,latch:0.5}),'width')).toBeCloseTo(47,12);
    expect(value(calculate('gate-calculator',{opening:96,leaves:2,hinge:0.5,latch:1}),'width')).toBeCloseTo(47,12);
  });
});

describe('Published worked examples remain aligned with form contract', () => {
  for (const slug of Object.keys(slugToModelKey)) {
    it(slug, () => {
      const c = getCalculatorContent(slug, getModelForSlug(slug));
      expect(c.example.rows.length).toBeGreaterThan(0);
      expect(c.example.rows.every(r=>Number.isFinite(r.value))).toBe(true);
      expect(c.inputs.length).toBe(c.fields.length);
      expect(c.instructions.join(' ')).toContain('Reset restores');
    });
  }
  it('does not advertise pickets or concrete on the fence panel form', () => {
    const c=getCalculatorContent('Fence Calculator',getModelForSlug('fence-calculator'));
    expect(c.outputs.join(' ')).not.toMatch(/pickets|concrete|joists|rails/i);
    expect(value(c.example.rows,'posts')).toBe(14);
    expect(value(c.example.rows,'panels')).toBe(13);
  });
});
