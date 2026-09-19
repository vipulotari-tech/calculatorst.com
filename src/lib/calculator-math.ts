import type { Calculation, Dimension, Field, ResultRow } from './calculator-types.ts';

// Exact definitions: international foot and avoirdupois pound (NIST SP 811).
export const FT_PER_M = 1 / 0.3048;
export const LB_PER_KG = 1 / 0.45359237;
export const factors: Record<Dimension, Record<string, number>> = {
  length: {ft:1, in:1/12, yd:3, m:FT_PER_M, cm:FT_PER_M/100, mm:FT_PER_M/1000},
  area: {ft2:1, yd2:9, m2:FT_PER_M**2, in2:1/144},
  volume: {ft3:1, yd3:27, m3:FT_PER_M**3, L:FT_PER_M**3/1000, gal:231/1728},
  weight: {lb:1, kg:LB_PER_KG, ton:2000, tonne:LB_PER_KG*1000},
  number: {},
};
export const unitLabels: Record<string,string> = {ft2:'ft²',yd2:'yd²',m2:'m²',in2:'in²',ft3:'ft³',yd3:'yd³',m3:'m³',ton:'US ton',tonne:'metric tonne',L:'liters',gal:'US gal','USD/yd3':'$/yd³','USD/m3':'$/m³','USD/ft3':'$/ft³','USD/ton':'$/US ton','USD/bag':'$/bag','USD/unit':'$/unit','USD/ft2':'$/ft²','USD/m2':'$/m²','USD/ft':'$/ft','USD/board':'$/board','USD/panel':'$/panel'};
export class InputError extends Error { constructor(public field:string,message:string){super(message);this.name='InputError';} }
export function requireCondition(ok:boolean,field:string,message:string):asserts ok {if(!ok)throw new InputError(field,message);}
export function convert(value:number,unit:string,dimension:Dimension){
  if(dimension==='number')return value;
  const factor=factors[dimension][unit];
  if(factor===undefined)throw new InputError('','Choose a supported unit for this measurement.');
  return value*factor;
}
export function readInputs(fields:Field[],raw:Record<string,string|number>,units:Record<string,string>={}){
  const values:Record<string,number>={};
  for(const f of fields){
    const rawValue=raw[f.id];
    if(rawValue===undefined||String(rawValue).trim()===''){
      if(f.optional){values[f.id]=Number.NaN;continue;}
      throw new InputError(f.id,`Enter ${f.label.toLowerCase()}.`);
    }
    requireCondition(typeof rawValue === 'number' || /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(rawValue.trim()),f.id,'Enter a decimal number, without commas or other characters.');
    const value=Number(rawValue);
    requireCondition(Number.isFinite(value),f.id,'Enter a finite number.');
    const lower=f.min??0;
    requireCondition(value>=lower&&(f.min!==undefined||value>0),f.id,f.min===0?'Enter zero or a positive number.':`Enter a number ${f.min!==undefined?`at least ${lower}`:'greater than zero'}.`);
    requireCondition(value<=(f.max??1e9),f.id,`Enter a value no greater than ${f.max??1e9}. Split larger projects into sections.`);
    if(f.integer)requireCondition(Number.isInteger(value),f.id,'Enter a whole number.');
    const unit=units[f.id]??f.unit??'';
    if(f.units)requireCondition(f.units.includes(unit),f.id,'Choose one of the listed units.');
    values[f.id]=convert(value,unit,f.dimension??'number');
  }
  return values;
}
export const roundUp=(v:number)=>Math.ceil(v-Math.min(1e-9,Math.abs(v)*Number.EPSILON*4));
export const row=(key:string,label:string,value:number,unit='',discrete=false):ResultRow=>({key,label,value,unit,discrete});
export const fmt=(v:number)=>new Intl.NumberFormat('en-US',v !== 0 && Math.abs(v) < 0.0001 ? {notation:'scientific',maximumSignificantDigits:5} : {maximumFractionDigits:4}).format(v);
export function result(rows:ResultRow[],steps:string[],notes:string[]=[]):Calculation {
  for(const r of rows)requireCondition(Number.isFinite(r.value)&&Math.abs(r.value)<=Number.MAX_SAFE_INTEGER,'','The result is outside the supported range. Check units or split the project into smaller sections.');
  return {rows,steps,notes};
}
export function withCost(rows:ResultRow[],price:number,unit:string,quantities:Record<string,number>){
  if(Number.isFinite(price)){
    requireCondition(quantities[unit]!==undefined,'price','Select a price basis supported by this calculator.');
    rows.push(row('cost','Estimated material cost',quantities[unit]*price,'USD'));
  }
  return rows;
}
export function netArea(v:Record<string,number>){
  const area=v.length*v.width-(v.openings??0);
  requireCondition(area>=0,'openings','Openings cannot exceed the measured area.');
  return area;
}
export const waste=(v:Record<string,number>)=>1+(v.waste??0)/100;
export const length=(id='length',label='Length',value=20,unit='ft',help?:string):Field=>({id,label,value,unit,units:['ft','in','yd','m','cm','mm'],dimension:'length',help});
export const number=(id:string,label:string,value?:number,min?:number,help?:string):Field=>({id,label,value,min,help,dimension:'number'});
export const count=(id:string,label:string,value=1,min=1):Field=>({...number(id,label,value,min),integer:true,max:1e6});
export const area=(id:string,label:string,value=100,min?:number):Field=>({id,label,value,unit:'ft2',units:['ft2','m2','yd2'],dimension:'area',min});
export const volume=(id='volume',label='Volume',value=1):Field=>({id,label,value,unit:'yd3',units:['yd3','ft3','m3'],dimension:'volume'});
export const allowance:Field={...number('waste','Material allowance',10,0,'Added once to the measured quantity before rounding packages up. Change it for your project.'),max:100,group:'Material & assumptions',unit:'%'};
export const price=(unit='USD/yd3',units=[unit]):Field=>({id:'price',label:'Material price',unit,units,min:0,optional:true,group:'Cost',help:'Use your supplier quote. Taxes, delivery and labor are excluded unless shown separately.'});
export const rectangle=[length(),length('width','Width',10)];
export const openings:Field={...area('openings','Openings / excluded area',0,0),help:'Subtract openings once; do not subtract them again from your dimensions.'};
export const positiveOrZero=(field:Field,extra?:Partial<Field>):Field => ({...extra,...field,min:0});
