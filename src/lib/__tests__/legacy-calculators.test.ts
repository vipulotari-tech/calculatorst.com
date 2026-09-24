import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { afterEach, describe, expect, it, vi } from 'vitest';

class ElementDouble {
  value=''; textContent=''; classes=new Set<string>(); children:ElementDouble[]=[]; events:Record<string,{fn:Function,capture:boolean}[]>={}; className=''; id=''; tag='';
  dataset:Record<string,string>={}; attrs:Record<string,string>={};
  get classList(){const self=this;return{
    add:(s:string)=>self.classes.add(s),remove:(s:string)=>self.classes.delete(s),
    contains:(s:string)=>self.classes.has(s),
    toggle:(s:string,force?:boolean)=>{if(force!==undefined){if(force)self.classes.add(s);else self.classes.delete(s);}else self.classes.has(s)?self.classes.delete(s):self.classes.add(s);return self.classes.has(s);}
  };}
  get min(){return this.attrs.min??'';} get max(){return this.attrs.max??'';} get step(){return this.attrs.step??'';}
  addEventListener(name:string,fn:Function,capture=false){(this.events[name]??=[]).push({fn,capture});}
  fire(name:string){let stopped=false; const e={preventDefault(){},stopImmediatePropagation(){stopped=true;}};for(const h of [...(this.events[name]??[])].sort((a,b)=>Number(b.capture)-Number(a.capture))){h.fn(e);if(stopped)break;}}
  append(el:ElementDouble){this.children.push(el);} focus(){} scrollIntoView(){} closest(){return null;}
  setAttribute(k:string,v:string){this.attrs[k]=v;} removeAttribute(k:string){delete this.attrs[k];}
  querySelectorAll(selector:string){return this.children.filter(e=>selector.includes('input')?e.tag==='input':e.attrs['aria-invalid']!==undefined);}
}

function load(name:string,resultId:string) {
  const source=readFileSync(new URL(`../../components/calculators/${name}.astro`,import.meta.url),'utf8');
  const elements=new Map<string,ElementDouble>();
  for(const match of source.matchAll(/<(\w+)\b([^>]*\bid="([^"]+)"[^>]*)>/g)) {
    const e=new ElementDouble();e.id=match[3];e.tag=match[1];
    for(const a of match[2].matchAll(/([\w-]+)="([^"]*)"/g))e.attrs[a[1]]=a[2];
    e.value=e.attrs.value??'';elements.set(e.id,e);
  }
  for(const match of source.matchAll(/<select\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) {
    const options=[...match[2].matchAll(/<option\b([^>]*)>/g)];
    const chosen=options.find(o=>/\bselected\b/.test(o[1]))??options[0];
    elements.get(match[1])!.value=chosen?.[1].match(/value="([^"]*)"/)?.[1]??'';
  }
  for(const match of source.matchAll(/<form\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/form>/g)) {
    const formEl = elements.get(match[1])!;
    formEl.children=[...match[2].matchAll(/<input\b[^>]*id="([^"]+)"/g)].map(m=>elements.get(m[1])!);
    formEl.children.push(...[...match[2].matchAll(/<select\b[^>]*id="([^"]+)"/g)].map(m=>elements.get(m[1])!));
  }
  const document={getElementById:(id:string)=>elements.get(id)??null,createElement:()=>new ElementDouble(),querySelectorAll:(sel:string)=>{const all=[...elements.values()] as ElementDouble[];if(sel.startsWith(".c-mode-fields"))return all.filter(e=>e.id.startsWith("c-fields-"));if(sel.includes("-error"))return all.filter(e=>e.id.endsWith("-error"));if(sel.includes('input'))return all.filter(e=>e.tag==='input');return[] as ElementDouble[]}};
  for(const script of source.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g)){runInNewContext(script[1],{document,navigator:{clipboard:{writeText:async()=>{}}},setTimeout:()=>{},clearTimeout:()=>{},requestAnimationFrame:(fn:Function)=>fn(),Intl,Math});}
  vi.stubGlobal('document',document);
  const form=[...elements.values()].find(e=>e.tag==='form')!;
  return {elements,form,result:elements.get(resultId)!,set(values:Record<string,string|number>){for(const [id,v]of Object.entries(values)){if(!elements.has(id))throw Error(`Unknown field ${id}`);elements.get(id)!.value=String(v);}form.fire('input');},submit(){form.fire('submit');},text(id:string){return elements.get(id)!.textContent;}};
}
afterEach(()=>vi.unstubAllGlobals());

const cases: Array<{name:string;values:Record<string,string|number>;outputId:string;expected:string}> = [
  {name:'GravelCalculator',values:{'g-length':10,'g-width':10,'g-depth':12,'g-waste':0},outputId:'g-ft3',expected:'100.00'},
  {name:'ConcreteSlabCalculator',values:{'c-len':10,'c-wid':10,'c-depth':12,'c-depth-unit':'in','c-waste':5,'c-num':1},outputId:'c-ft3',expected:'100.00'},
  {name:'ConcreteSlabCalculator',values:{'c-len':10,'c-wid':10,'c-depth':12,'c-depth-unit':'in','c-waste':0,'c-num':1},outputId:'c-b50',expected:'267'},
  {name:'ConcreteSlabCalculator',values:{'c-mode':'curb','c-clen':10,'c-clen-unit':'ft','c-cht':12,'c-cht-unit':'in','c-cdepth':6,'c-cdepth-unit':'in','c-gw':18,'c-gw-unit':'in','c-flag':6,'c-flag-unit':'in','c-waste':0,'c-num':1},outputId:'c-ft3',expected:'12.50'},
  {name:'RoofPitchCalculator',values:{'rp-rise':6,'rp-run':12},outputId:'rp-x12',expected:'6 : 12'},
  {name:'PaverCalculator',values:{'pv-len':10,'pv-wid':10,'pv-waste':0},outputId:'pv-countw',expected:'100'},
  {name:'MulchCalculator',values:{'m-len':10,'m-wid':10,'m-depth':12,'m-waste':0},outputId:'m-ft3',expected:'100.00'},
  {name:'PeaGravelCalculator',values:{'p-length':10,'p-width':10,'p-depth':12,'p-waste':0},outputId:'p-ft3',expected:'100.00'},
  {name:'DrivewayGravelCalculator',values:{'d-len':10,'d-wid':10,'d-depth':12,'d-waste':0},outputId:'d-ft3',expected:'100.00'},
  {name:'DeckMaterialCalculator',values:{'dk-len':16,'dk-wid':11,'dk-gap':0,'dk-waste':0},outputId:'dk-boards',expected:'24'},
  {name:'RoofSquareFootageCalculator',values:{'rsq-len':10,'rsq-wid':10,'rsq-pitch':0,'rsq-over':0,'rsq-waste':0},outputId:'rsq-area',expected:'100.0'},
  {name:'FenceCostCalculator',values:{'f-len':100,'f-gates':0,'f-waste':0},outputId:'f-posts',expected:'14'},
];

describe('All ten dedicated production handlers',()=>{
  for(const c of cases)it(`${c.name}: computes the correct output`,()=>{
    const page=load(c.name,c.outputId.startsWith('c-')?'c-results':c.outputId);
    page.set(c.values);page.submit();
    expect(page.text(c.outputId)).toBe(c.expected);
  });
});
