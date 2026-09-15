import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { initLegacyValidation, legacyForms, numericError } from '../legacy-validation';

// Executes the shipped inline handlers, not a duplicate implementation of maths.
// Minimal event/element doubles deliberately do not claim browser/layout coverage.
class ElementDouble {
  value=''; textContent=''; dataset:Record<string,string>={}; attrs:Record<string,string>={};
  children:ElementDouble[]=[]; events:Record<string,{fn:Function,capture:boolean}[]>={};
  classes=new Set<string>(); className=''; id=''; tag='';
  classList={add:(s:string)=>this.classes.add(s),remove:(s:string)=>this.classes.delete(s),contains:(s:string)=>this.classes.has(s)};
  get min(){return this.attrs.min??'';} get max(){return this.attrs.max??'';} get step(){return this.attrs.step??'';}
  addEventListener(name:string,fn:Function,capture=false){(this.events[name]??=[]).push({fn,capture});}
  fire(name:string){let stopped=false; const e={preventDefault(){},stopImmediatePropagation(){stopped=true;}};for(const h of [...(this.events[name]??[])].sort((a,b)=>Number(b.capture)-Number(a.capture))){h.fn(e);if(stopped)break;}}
  append(el:ElementDouble){this.children.push(el);} focus(){} scrollIntoView(){} closest(){return null;}
  setAttribute(k:string,v:string){this.attrs[k]=v;} removeAttribute(k:string){delete this.attrs[k];}
  querySelectorAll(selector:string){return this.children.filter(e=>selector.includes('input')?e.tag==='input':e.attrs['aria-invalid']!==undefined);}
}
function load(name:string) {
  const source=readFileSync(new URL(`../../components/calculators/${name}.astro`,import.meta.url),'utf8');
  const elements=new Map<string,ElementDouble>();
  for(const match of source.matchAll(/<(\w+)\b([^>]*\bid="([^"]+)"[^>]*)>/g)) {
    const e=new ElementDouble();e.id=match[3];e.tag=match[1];
    for(const a of match[2].matchAll(/([\w-]+)="([^"]*)"/g))e.attrs[a[1]]=a[2];
    e.value=e.attrs.value??'';e.classes=new Set((e.attrs.class??'').split(/\s+/));elements.set(e.id,e);
  }
  for(const match of source.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
    const options=[...match[2].matchAll(/<option\b([^>]*)>/g)];
    const chosen=options.find(o=>/\bselected\b/.test(o[1]))??options[0];
    elements.get(match[1])!.value=chosen?.[1].match(/value="([^"]*)"/)?.[1]??'';
  }
  for(const match of source.matchAll(/<form\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/form>/g)) {
    elements.get(match[1])!.children=[...match[2].matchAll(/<input\b[^>]*id="([^"]+)"/g)].map(m=>elements.get(m[1])!);
  }
  const document={getElementById:(id:string)=>elements.get(id)??null,createElement:()=>new ElementDouble()};
  for(const script of source.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g))runInNewContext(script[1],{document,navigator:{clipboard:{writeText:async()=>{}}},setTimeout:()=>{},Intl,Math});
  vi.stubGlobal('document',document);initLegacyValidation();
  const form=[...elements.values()].find(e=>e.tag==='form')!;
  const result=elements.get(legacyForms[form.id])!;
  return {elements,form,result,set(values:Record<string,string|number>){for(const [id,v]of Object.entries(values)){if(!elements.has(id))throw Error(`Unknown field ${id}`);elements.get(id)!.value=String(v);}form.fire('input');},submit(){form.fire('submit');},text(id:string){return elements.get(id)!.textContent;}};
}
afterEach(()=>vi.unstubAllGlobals());
const cases: Array<{name:string;values:Record<string,string|number>;output:string;expected:string}> = [
  {name:'GravelCalculator',values:{'g-length':10,'g-width':10,'g-depth':12,'g-waste':0},output:'g-ft3',expected:'100.00'},
  {name:'ConcreteSlabCalculator',values:{'c-len':10,'c-wid':10,'c-thick':12,'c-waste':0},output:'c-ft3',expected:'100.00'},
  {name:'RoofPitchCalculator',values:{'rp-rise':6,'rp-run':12},output:'rp-x12',expected:'6 : 12'},
  {name:'PaverCalculator',values:{'pv-len':10,'pv-wid':10,'pv-waste':0},output:'pv-countw',expected:'100'},
  {name:'MulchCalculator',values:{'m-len':10,'m-wid':10,'m-depth':12,'m-waste':0},output:'m-ft3',expected:'100.00'},
  {name:'PeaGravelCalculator',values:{'p-length':10,'p-width':10,'p-depth':12,'p-waste':0},output:'p-ft3',expected:'100.00'},
  {name:'DrivewayGravelCalculator',values:{'d-len':10,'d-wid':10,'d-depth':12,'d-waste':0},output:'d-ft3',expected:'100.00'},
  {name:'DeckMaterialCalculator',values:{'dk-len':16,'dk-wid':11,'dk-gap':0,'dk-waste':0},output:'dk-boards',expected:'24'},
  {name:'RoofSquareFootageCalculator',values:{'rsq-len':10,'rsq-wid':10,'rsq-pitch':0,'rsq-over':0,'rsq-waste':0},output:'rsq-area',expected:'100.0'},
  {name:'FenceCostCalculator',values:{'f-len':100,'f-gates':0,'f-waste':0},output:'f-posts',expected:'14'},
];
describe('All ten dedicated production handlers',()=>{
  for(const c of cases)it(`${c.name}: computes, invalidates stale results, validates and resets`,()=>{
    const page=load(c.name);page.set(c.values);page.submit();
    expect(page.result,`${c.name} must be covered by legacyForms`).toBeDefined();
    expect(page.result.classes.has('hidden')).toBe(false);
    expect(page.text(c.output)).toBe(c.expected);
    const field=Object.keys(c.values)[0];page.set({[field]:-1});
    expect(page.result.classes.has('hidden')).toBe(true);page.submit();expect(page.result.classes.has('hidden')).toBe(true);
    expect(page.form.children.at(-1)!.textContent).not.toBe('');
    page.set(c.values);page.submit();expect(page.result.classes.has('hidden')).toBe(false);
    page.form.fire('reset');expect(page.result.classes.has('hidden')).toBe(true);
  });
});
describe('Dedicated geometry and rounding fixes',()=>{
  it('accepts a flat roof',()=>{const p=load('RoofPitchCalculator');p.set({'rp-rise':0,'rp-run':12});p.submit();expect(p.text('rp-x12')).toBe('0 : 12');});
  it('preserves zero paver base/sand and rounds the unrounded takeoff only once',()=>{const p=load('PaverCalculator');p.set({'pv-len':1.1,'pv-wid':1,'pv-waste':10,'pv-base':0,'pv-sand':0});p.submit();expect(p.text('pv-countw')).toBe('2');expect(p.text('pv-gravel')).toBe('0');expect(p.text('pv-sandres')).toBe('0');});
  it('counts decking fasteners by intersections and prices purchased boards in feet',()=>{const p=load('DeckMaterialCalculator');p.set({'dk-len':16,'dk-wid':11,'dk-gap':0,'dk-waste':10,'dk-price':1,'dk-price-unit':'ft'});p.submit();expect(p.text('dk-fast')).toBe('624');expect(p.text('dk-cost')).toBe('$432.00');});
  it('uses selected fence spacing and concrete hole geometry',()=>{const p=load('FenceCostCalculator');p.set({'f-len':80,'f-spacing':5,'f-gates':0,'f-waste':0,'f-postw':6,'f-yield':0.5});p.submit();expect(p.text('f-panels')).toBe('16');expect(p.text('f-posts')).toBe('17');expect(p.text('f-concrete')).toBe('37');});
  it('rejects gate openings larger than the fence',()=>{const p=load('FenceCostCalculator');p.set({'f-len':5,'f-gates':2,'f-gatew':4});p.submit();expect(p.result.classes.has('hidden')).toBe(true);});
  it('rejects fractional section counts',()=>{const p=load('ConcreteSlabCalculator');p.set({'c-len':10,'c-wid':10,'c-thick':4,'c-num':1.5});p.submit();expect(p.result.classes.has('hidden')).toBe(true);});
  it('rejects invalid custom gravel density without falling back',()=>{const p=load('GravelCalculator');p.set({'g-length':10,'g-width':10,'g-depth':4,'g-material':'custom','g-custom-density':0});p.submit();expect(p.result.classes.has('hidden')).toBe(true);});
});
it('validates numeric extremes without coercion',()=>{
  const rule={required:true,positive:true,integer:false};
  for(const bad of ['','NaN','Infinity','0x10','-1','0','1e30'])expect(numericError(bad,rule)).not.toBeNull();
  expect(numericError('0.001',rule)).toBeNull();
  expect(numericError('0',{...rule,positive:false})).toBeNull();
});
