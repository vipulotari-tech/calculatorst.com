import type { Model } from './calculator-types.ts';
import {
  FT_PER_M, LB_PER_KG, allowance, area, count, fmt, length, number, positiveOrZero,
  price, requireCondition, result, roundUp, row, volume, waste, withCost,
} from './calculator-math.ts';
import { materialModels } from './models-materials.ts';
import { finishModels } from './models-finishes.ts';

const quikreteBulk='https://www.quikrete.com/pdfs/data_sheet-bulkmortarandgrout.pdf';
const quikreteMortar='https://www.quikrete.com/productlines/bulkmasonrymortarcementblendpro.asp';
const fhwaEarthwork='https://highways.fhwa.dot.gov/federal-lands/design/tools/cfl/earthwork-representation-guide.pdf';
const inchGravel='https://www.inchcalculator.com/gravel-calculator/';
const omniGravel='https://www.omnicalculator.com/construction/gravel';
const omniGrout='https://www.omnicalculator.com/construction/grout';
const omniCement='https://www.omnicalculator.com/construction/cement';
const omniMortar='https://www.omnicalculator.com/construction/mortar';

function unitPriceRows(q:number, p:number, tax:number, delivery:number, labor:number){
  const materials=q*p, taxAmt=materials*tax/100;
  return {materials,taxAmt,total:materials+taxAmt+delivery+labor};
}

// ---------------- Mortar / grout / cement ----------------
const mortarGeneral:Model={
  fields:[
    {id:'mode',label:'Estimate mortar from',value:0,min:0,max:1,integer:true,dimension:'number',options:[{value:0,label:'Installed bricks / blocks'},{value:1,label:'Known mixed mortar volume'}]},
    {...count('units','Installed bricks / blocks',500,0),visibleWhen:{field:'mode',equals:0}},
    {...number('coverage','Installed units per mortar bag',35,0,'Use the mortar product yield for the exact brick/block and bedding method.'),visibleWhen:{field:'mode',equals:0}},
    {...volume('volume','Required mixed mortar volume',5),visibleWhen:{field:'mode',equals:1}},
    {...volume('yield','Mixed mortar yield per bag',0.6),unit:'ft3',visibleWhen:{field:'mode',equals:1},help:'Use the mixed yield printed on the exact mortar bag.'},
    number('bagWeight','Mortar bag weight (lb)',80,0),
    allowance,price('USD/bag')
  ],
  formula:'Unit mode: bags = ceil(installed units × allowance factor ÷ units per bag). Volume mode: bags = ceil(required mixed volume × allowance factor ÷ mixed yield per bag).',
  assumptions:[
    'Mortar bag coverage varies by masonry unit size, joint geometry, full-bed versus face-shell bedding and workmanship.',
    'Mixed yield varies by product and package size. Use the exact manufacturer value when ordering.',
    'This calculator estimates quantity only; it does not choose mortar Type M, S, N or O or determine suitability for a masonry assembly.'
  ],
  sources:[omniMortar,quikreteBulk,quikreteMortar],
  calculate(v,u){
    const mode=Math.round(v.mode);
    const rawBags=mode===0?v.units/v.coverage:v.volume/v.yield;
    const bags=roundUp(rawBags*waste(v));
    const rows=[
      row('bags','Mortar bags to order',bags,'bags',true),
      row('baseBags','Bags before allowance / rounding',rawBags,'bags'),
      ...(mode===1?[row('mixedYield','Purchased mixed-yield capacity',bags*v.yield,'ft³')]:[]),
      row('weight','Estimated bagged-product weight — lb',bags*v.bagWeight,'lb'),
      row('tons','Estimated bagged-product weight — US tons',bags*v.bagWeight/2000,'US tons')
    ];
    return result(withCost(rows,v.price,u.price,{'USD/bag':bags}),[
      mode===0
        ? `${v.units} installed units ÷ ${fmt(v.coverage)} units/bag = ${fmt(rawBags)} bags before allowance.`
        : `${fmt(v.volume)} ft³ ÷ ${fmt(v.yield)} ft³/bag = ${fmt(rawBags)} bags before allowance.`,
      `Round ${fmt(rawBags*waste(v))} up = ${bags} bags.`
    ]);
  }
};

const mortarCost:Model={
  fields:[count('bags','Mortar bags',20,0),{...price('USD/bag'),optional:false},number('tax','Material tax (%)',0,0),number('delivery','Delivery / fixed fee (USD)',0,0),number('labor','Labor / equipment allowance (USD)',0,0)],
  formula:'Total = mortar bags × quoted price per bag + material tax + delivery + entered labor/equipment.',
  assumptions:['Bag count should come from the project takeoff and exact mortar product yield.','Labor/equipment is entered rather than inferred from a universal production rate.'],
  sources:[quikreteMortar],
  calculate(v){
    const c=unitPriceRows(v.bags,v.price,v.tax,v.delivery,v.labor);
    return result([row('total','Estimated entered-scope total',c.total,'USD'),row('bags','Mortar bags',v.bags,'bags',true),row('materials','Mortar material subtotal',c.materials,'USD'),row('tax','Material tax',c.taxAmt,'USD'),row('delivery','Delivery / fixed fee',v.delivery,'USD'),row('labor','Labor / equipment',v.labor,'USD')],[`${v.bags} bags × $${fmt(v.price)} = $${fmt(c.materials)}; add tax, delivery and labor/equipment.`]);
  }
};

const groutGeneral:Model={
  fields:[volume('volume','Required mixed grout volume',2),{...volume('yield','Mixed grout yield per bag',0.6),unit:'ft3',help:'Use the mixed yield for the exact bagged grout product.'},number('bagWeight','Grout bag weight (lb)',80,0),allowance,price('USD/bag')],
  formula:'Bags = ceil(required mixed grout volume × allowance factor ÷ mixed yield per bag).',
  assumptions:['This page starts from a known grout volume. Use the Grout Quantity Calculator when estimating tile-joint volume from tile geometry.','Masonry core-fill grout and tile grout are different products; use product-specific yield.'],
  sources:[omniGrout,quikreteBulk],
  calculate(v,u){const order=v.volume*waste(v),bags=roundUp(order/v.yield);return result(withCost([row('bags','Grout bags to order',bags,'bags',true),row('net','Net mixed grout volume',v.volume,'ft³'),row('order','Mixed grout volume with allowance — ft³',order,'ft³'),row('liters','Mixed grout volume with allowance — liters',order*28.316846592,'L'),row('weight','Estimated bagged-product weight — lb',bags*v.bagWeight,'lb')],v.price,u.price,{'USD/bag':bags}),[`${fmt(v.volume)} × ${fmt(waste(v))} = ${fmt(order)} ft³ with allowance.`,`Round ${fmt(order)} ÷ ${fmt(v.yield)} up = ${bags} bags.`]);}
};

const groutQuantity:Model={
  fields:[
    {id:'areaMode',label:'Tiled area from',value:0,min:0,max:1,integer:true,dimension:'number',options:[{value:0,label:'Length × width'},{value:1,label:'Known tiled area'}]},
    {...length('length','Tiled length',10),visibleWhen:{field:'areaMode',equals:0}},{...length('width','Tiled width',10),visibleWhen:{field:'areaMode',equals:0}},{...area('area','Known tiled area',100),visibleWhen:{field:'areaMode',equals:1}},
    length('tileLength','Tile length',12,'in'),length('tileWidth','Tile width',12,'in'),length('jointWidth','Grout joint width',0.125,'in'),length('jointDepth','Grout joint depth',0.25,'in'),
    {...volume('yield','Usable grout volume per bag',0.25),unit:'ft3',help:'Enter the usable mixed volume from the exact grout product.'},allowance,price('USD/bag')
  ],
  formula:'Grout face fraction = 1 − tile face area / installed tile module area. Grout volume ≈ tiled area × joint depth × face fraction; bags = ceil(volume × allowance factor ÷ usable bag volume).',
  assumptions:['Uniform rectangular tiles in a repeating grid with equal joint width in both directions.','Edge cuts and partial tiles are represented by area, not counted individually.','Use actual filled joint depth and product yield; irregular stone, beveled edges and epoxy systems can differ.'],
  sources:[omniGrout],
  calculate(v,u){
    const a=Math.round(v.areaMode)===0?v.length*v.width:v.area;
    const module=(v.tileLength+v.jointWidth)*(v.tileWidth+v.jointWidth);
    const tile=v.tileLength*v.tileWidth;
    requireCondition(module>tile,'jointWidth','Joint width must produce a positive grout area.');
    const fraction=1-tile/module;
    const net=a*v.jointDepth*fraction,order=net*waste(v),bags=roundUp(order/v.yield);
    return result(withCost([row('bags','Grout bags to order',bags,'bags',true),row('volume','Theoretical grout volume',net,'ft³'),row('order','Grout volume with allowance — ft³',order,'ft³'),row('liters','Grout volume with allowance — liters',order*28.316846592,'L'),row('area','Tiled area',a,'ft²'),row('fraction','Estimated joint face fraction',fraction*100,'%')],v.price,u.price,{'USD/bag':bags}),[`Joint face fraction = 1 − tile face/module face = ${fmt(fraction*100)}%.`,`${fmt(a)} ft² × ${fmt(v.jointDepth*12)} in ÷ 12 × ${fmt(fraction)} = ${fmt(net)} ft³.`,`Allowance → ${fmt(order)} ft³; round ÷ ${fmt(v.yield)} = ${bags} bags.`]);
  }
};

const groutCost:Model={
  fields:[count('bags','Grout bags',10,0),{...price('USD/bag'),optional:false},number('tax','Material tax (%)',0,0),number('delivery','Delivery / fixed fee (USD)',0,0),number('labor','Labor allowance (USD)',0,0)],
  formula:'Total = grout bags × quoted bag price + material tax + delivery + entered labor.',
  assumptions:['This is a configurable cost line for a known bag quantity.','Tile, sealers, additives, removal and preparation are excluded unless included in entered fixed costs.'],
  sources:[omniGrout],
  calculate(v){const c=unitPriceRows(v.bags,v.price,v.tax,v.delivery,v.labor);return result([row('total','Estimated entered-scope total',c.total,'USD'),row('bags','Grout bags',v.bags,'bags',true),row('materials','Grout material subtotal',c.materials,'USD'),row('tax','Material tax',c.taxAmt,'USD'),row('delivery','Delivery / fixed fee',v.delivery,'USD'),row('labor','Labor allowance',v.labor,'USD')],[`${v.bags} × $${fmt(v.price)} = $${fmt(c.materials)}; entered total = $${fmt(c.total)}.`]);}
};

const cementGeneral:Model={
  fields:[volume('volume','Required cement volume',1),{...volume('yield','Bulk volume represented by one cement bag',1),unit:'ft3',help:'Use the bag-volume convention or product data appropriate to the cement being estimated.'},number('bagWeight','Cement bag weight (lb)',94,0),allowance,price('USD/bag')],
  formula:'Cement bags = ceil(required cement volume × allowance factor ÷ entered volume represented by one bag).',
  assumptions:['This estimates Portland/masonry cement quantity from a known cement-only volume. It does not infer a concrete or mortar mix design.','Bag mass and bulk-volume convention vary by market/product; both are editable.'],
  sources:[quikreteMortar],
  calculate(v,u){const order=v.volume*waste(v),bags=roundUp(order/v.yield),lb=bags*v.bagWeight;return result(withCost([row('bags','Cement bags to order',bags,'bags',true),row('net','Net cement volume',v.volume,'ft³'),row('order','Cement volume with allowance',order,'ft³'),row('weight','Bagged cement weight — lb',lb,'lb'),row('tons','Bagged cement weight — US tons',lb/2000,'US tons')],v.price,u.price,{'USD/bag':bags}),[`${fmt(v.volume)} × ${fmt(waste(v))} ÷ ${fmt(v.yield)} = ${fmt(order/v.yield)} bags before rounding.`,`Order ${bags} whole bags.`]);}
};

const cementBag:Model={
  fields:[
    {id:'batchMode',label:'Batch volume represents',value:0,min:0,max:1,integer:true,dimension:'number',options:[{value:0,label:'Known dry batch volume'},{value:1,label:'Placed / wet volume'}]},
    volume('volume','Entered batch volume',10),
    {...number('dryFactor','Dry-volume factor',1.54,0.01,'Multiplier from placed/wet volume to the dry ingredient volume used by your estimating method.'),visibleWhen:{field:'batchMode',equals:1}},
    number('cementParts','Cement parts',1,0),
    number('sandParts','Sand parts',2,0),
    number('aggregateParts','Coarse aggregate parts',3,0),
    {...volume('bagYield','Bulk cement volume per bag',1),unit:'ft3'},
    allowance,price('USD/bag')
  ],
  formula:'Dry batch volume = entered dry volume, or placed/wet volume × entered dry-volume factor. Cement share = dry batch × cement parts ÷ total ratio parts; bags = ceil(cement share × allowance ÷ bag volume).',
  assumptions:[
    'Ratio parts are user-specified dry-volume proportions, not a strength prescription.',
    'The dry-volume factor is an estimating input, not a universal material constant. Use the factor required by the selected mix/design method.',
    'Bag volume is editable because package mass and bulk-volume conventions vary by market and product.'
  ],
  sources:[omniCement],
  calculate(v,u){
    const parts=v.cementParts+v.sandParts+v.aggregateParts;
    requireCondition(parts>0,'cementParts','Enter at least one non-zero mix part.');
    const dryBatch=Math.round(v.batchMode)===1?v.volume*v.dryFactor:v.volume;
    const cement=dryBatch*v.cementParts/parts,sand=dryBatch*v.sandParts/parts,agg=dryBatch*v.aggregateParts/parts;
    const order=cement*waste(v),bags=roundUp(order/v.bagYield);
    return result(withCost([
      row('bags','Cement bags to order',bags,'bags',true),
      row('dryBatch','Dry batch volume used',dryBatch,'ft³'),
      row('cement','Cement dry volume',cement,'ft³'),
      row('sand','Sand dry volume',sand,'ft³'),
      row('aggregate','Coarse aggregate dry volume',agg,'ft³'),
      row('order','Cement volume with allowance',order,'ft³')
    ],v.price,u.price,{'USD/bag':bags}),[
      Math.round(v.batchMode)===1?`Dry batch = ${fmt(v.volume)} × ${fmt(v.dryFactor)} = ${fmt(dryBatch)} ft³.`:`Dry batch = entered ${fmt(dryBatch)} ft³.`,
      `Cement = ${fmt(dryBatch)} × ${fmt(v.cementParts)} / ${fmt(parts)} = ${fmt(cement)} ft³.`,
      `Allowance and bag volume → ${bags} bags.`
    ]);
  }
};

const cementSand:Model={
  fields:[volume('volume','Total dry cement-sand batch volume',10),number('cementParts','Cement parts',1,0),number('sandParts','Sand parts',4,0),{...volume('bagYield','Bulk cement volume per bag',1),unit:'ft3'},number('sandDensity','Sand bulk density (lb/ft³)',100,0),allowance,number('cementBagPrice','Cement price per bag (USD)',0,0),number('sandTonPrice','Sand price per US ton (USD)',0,0)],
  formula:'Normalize the entered cement:sand ratio over total dry batch volume; apply allowance to both components; convert cement volume to bags and sand volume to weight.',
  assumptions:['This is a dry-volume proportioning and purchasing calculator, not a mortar strength or suitability selector.','Sand density is editable because moisture and grading change bulk density.'],
  sources:[quikreteMortar],
  calculate(v){const parts=v.cementParts+v.sandParts;requireCondition(parts>0,'cementParts','Enter at least one non-zero ratio part.');const cement=v.volume*v.cementParts/parts,sand=v.volume*v.sandParts/parts,cementOrder=cement*waste(v),sandOrder=sand*waste(v),bags=roundUp(cementOrder/v.bagYield),sandLb=sandOrder*v.sandDensity,sandTons=sandLb/2000,cost=bags*v.cementBagPrice+sandTons*v.sandTonPrice;return result([row('bags','Cement bags to order',bags,'bags',true),row('cement','Cement volume with allowance',cementOrder,'ft³'),row('sand','Sand volume with allowance',sandOrder/27,'yd³'),row('aggregateVol','Coarse aggregate volume',0,'ft³'),row('sandWeight','Estimated sand weight',sandTons,'US tons'),row('cost','Estimated cement + sand material cost',cost,'USD')],[`Cement share = ${fmt(cement)} ft³; sand share = ${fmt(sand)} ft³ before allowance.`,`Cement order = ${bags} bags; sand ≈ ${fmt(sandTons)} US tons at entered density.`]);}
};

// ---------------- Bulk landscape materials ----------------
type BulkOpts={label:string;density:number;sources?:string[];costMode?:boolean};
function bulkModel(opts:BulkOpts):Model{
  const label=opts.label;
  const costMode=!!opts.costMode;
  return {
    fields:[
      {id:'mode',label:'Calculate volume from',value:0,min:0,max:2,integer:true,dimension:'number',options:[{value:0,label:'Length × width × depth'},{value:1,label:'Known area × depth'},{value:2,label:'Known volume'}]},
      {...length('length','Area length',20),visibleWhen:{field:'mode',equals:0}},{...length('width','Area width',10),visibleWhen:{field:'mode',equals:0}},{...area('area','Known surface area',200),visibleWhen:{field:'mode',equals:1}},{...length('depth','Placed / measured depth',4,'in'),visibleWhen:{field:'mode',in:[0,1]}},{...volume('volume','Known material volume',2),visibleWhen:{field:'mode',equals:2}},
      {...number('density','Bulk density (US tons / yd³)',opts.density,0.01,'Replace the example with supplier data for the same moisture and loose/compacted state.'),unit:'ton/yd3'},
      allowance,{...price('USD/yd3',['USD/yd3','USD/m3','USD/ton']),optional:!costMode},
      ...(costMode?[number('tax','Material tax (%)',0,0),number('delivery','Delivery / trucking (USD)',0,0),number('labor','Spreading / labor allowance (USD)',0,0)]:[])
    ],
    formula:'Measured volume comes from dimensions, known area × depth or known volume. Order volume applies allowance once; weight = order cubic yards × entered bulk density.',
    assumptions:[
      `${label} bulk density varies with material, grading, moisture and compaction. Use a supplier value for the same material state as your measured volume.`,
      'Allowance is a purchasing overage, not a hidden compaction factor. If converting loose delivery to compacted placed volume, use project/supplier information rather than applying a universal percentage.',
      'Short tons are 2,000 lb; metric tonnes are reported separately.'
    ],
    sources:opts.sources??[inchGravel,omniGravel],
    calculate(v,u){
      const mode=Math.round(v.mode);
      const netFt3=mode===0?v.length*v.width*v.depth:mode===1?v.area*v.depth:v.volume;
      requireCondition(netFt3>=0,'volume','Material volume cannot be negative.');
      const netYd3=netFt3/27,orderYd3=netYd3*waste(v),tons=orderYd3*v.density,lb=tons*2000,m3=orderYd3*27/(FT_PER_M**3);
      const q=u.price==='USD/ton'?tons:u.price==='USD/m3'?m3:orderYd3;
      const rows=[row('order',`${label} to order`,orderYd3,'yd³'),row('net','Measured volume before allowance',netYd3,'yd³'),row('m3','Order volume',m3,'m³'),row('tons','Estimated order weight — US tons',tons,'US tons'),row('pounds','Estimated order weight — lb',lb,'lb'),row('tonnes','Estimated order weight — metric tonnes',lb/LB_PER_KG/1000,'metric tonnes')];
      if(costMode){
        const materials=q*v.price,tax=materials*v.tax/100,total=materials+tax+v.delivery+v.labor;
        rows.push(row('materials','Material subtotal',materials,'USD'),row('tax','Material tax',tax,'USD'),row('delivery','Delivery / trucking',v.delivery,'USD'),row('labor','Spreading / labor allowance',v.labor,'USD'),row('total','Estimated entered-scope total',total,'USD'));
      }else if(Number.isFinite(v.price)){
        rows.push(row('cost','Estimated material cost',q*v.price,'USD'));
      }
      return result(rows,[mode===0?`${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} = ${fmt(netFt3)} ft³.`:mode===1?`${fmt(v.area)} ft² × ${fmt(v.depth)} = ${fmt(netFt3)} ft³.`:`Entered volume = ${fmt(netFt3)} ft³.`,`${fmt(netYd3)} yd³ × ${fmt(waste(v))} = ${fmt(orderYd3)} yd³ to order.`,`${fmt(orderYd3)} yd³ × ${fmt(v.density)} ton/yd³ = ${fmt(tons)} US tons.`]);
    }
  };
}

const gravelGeneral:Model={
  fields:[
    {id:'mode',label:'Calculate gravel from',value:0,min:0,max:2,integer:true,dimension:'number',options:[
      {value:0,label:'Length × width × depth'},
      {value:1,label:'Known area × depth'},
      {value:2,label:'Known volume'}
    ]},
    {...length('length','Area length',20),visibleWhen:{field:'mode',equals:0}},
    {...length('width','Area width',10),visibleWhen:{field:'mode',equals:0}},
    {...area('area','Known surface area',200),visibleWhen:{field:'mode',equals:1}},
    {...length('depth','Placed depth',4,'in'),visibleWhen:{field:'mode',in:[0,1]}},
    {...volume('volume','Known gravel volume',2),visibleWhen:{field:'mode',equals:2}},
    {id:'material',label:'Gravel material / density preset',value:1,min:0,max:5,integer:true,dimension:'number',group:'Material & assumptions',options:[
      {value:0,label:'Pea gravel — 1.35 US tons/yd³'},
      {value:1,label:'Crushed stone — 1.40 US tons/yd³'},
      {value:2,label:'River rock — 1.33 US tons/yd³'},
      {value:3,label:'Limestone — 1.60 US tons/yd³'},
      {value:4,label:'Granite — 1.42 US tons/yd³'},
      {value:5,label:'Custom supplier density'}
    ]},
    {...number('customDensity','Custom bulk density (US tons / yd³)',1.4,0.01,'Use supplier data for the same moisture and loose/compacted state.'),unit:'ton/yd3',group:'Material & assumptions',visibleWhen:{field:'material',equals:5}},
    {...number('compaction','Compaction allowance (%)',0,0,'Optional extra loose material needed to achieve the intended placed layer. Keep separate from waste.'),group:'Material & assumptions'},
    allowance,
    {...price('USD/yd3',['USD/yd3','USD/m3','USD/ton']),optional:true}
  ],
  formula:'Measured gravel volume comes from dimensions, known area × depth or known volume. Order volume = measured volume × (1 + compaction allowance) × (1 + waste allowance). Weight = order cubic yards × selected or custom bulk density.',
  assumptions:[
    'Material presets are estimating densities only; supplier scale-ticket or product data is preferred for the exact grading, moisture and material state.',
    'Compaction allowance and waste are separate inputs. Do not hide loose-to-placed conversion inside a generic waste percentage.',
    'The calculator estimates quantity and purchasing cost; it does not recommend a structural base depth or pavement section.',
    'US tons are short tons of 2,000 lb; metric tonnes are reported separately.'
  ],
  sources:[inchGravel,omniGravel],
  calculate(v,u){
    const mode=Math.round(v.mode);
    const netFt3=mode===0?v.length*v.width*v.depth:mode===1?v.area*v.depth:v.volume;
    requireCondition(netFt3>=0,'volume','Gravel volume cannot be negative.');
    const presets=[1.35,1.40,1.33,1.60,1.42];
    const material=Math.round(v.material);
    const density=material===5?v.customDensity:(presets[material]??1.40);
    requireCondition(density>0,'customDensity','Bulk density must be greater than zero.');
    const netYd3=netFt3/27;
    const compactionFactor=1+v.compaction/100;
    const afterCompaction=netYd3*compactionFactor;
    const orderYd3=afterCompaction*waste(v);
    const tons=orderYd3*density,lb=tons*2000,m3=orderYd3*27/(FT_PER_M**3);
    const q=u.price==='USD/ton'?tons:u.price==='USD/m3'?m3:orderYd3;
    return result(withCost([
      row('order','Gravel to order',orderYd3,'yd³'),
      row('net','Measured / placed volume',netYd3,'yd³'),
      row('compaction','Volume after compaction allowance',afterCompaction,'yd³'),
      row('m3','Order volume',m3,'m³'),
      row('tons','Estimated order weight — US tons',tons,'US tons'),
      row('pounds','Estimated order weight — lb',lb,'lb'),
      row('tonnes','Estimated order weight — metric tonnes',lb/LB_PER_KG/1000,'metric tonnes')
    ],v.price,u.price,{'USD/yd3':orderYd3,'USD/m3':m3,'USD/ton':tons}),[
      mode===0?`${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} = ${fmt(netFt3)} ft³.`:mode===1?`${fmt(v.area)} ft² × ${fmt(v.depth)} = ${fmt(netFt3)} ft³.`:`Entered volume = ${fmt(netFt3)} ft³.`,
      `${fmt(netYd3)} yd³ × ${fmt(compactionFactor)} compaction factor × ${fmt(waste(v))} waste factor = ${fmt(orderYd3)} yd³ to order.`,
      `${fmt(orderYd3)} yd³ × ${fmt(density)} ton/yd³ = ${fmt(tons)} US tons.`
    ]);
  }
};

const gravelCost:Model={
  fields:[
    {id:'mode',label:'Calculate volume from',value:0,min:0,max:2,integer:true,dimension:'number',options:[
      {value:0,label:'Length × width × depth'},
      {value:1,label:'Known area × depth'},
      {value:2,label:'Known volume'}
    ]},
    {...length('length','Area length',20),visibleWhen:{field:'mode',equals:0}},
    {...length('width','Area width',10),visibleWhen:{field:'mode',equals:0}},
    {...area('area','Known surface area',200),visibleWhen:{field:'mode',equals:1}},
    {...length('depth','Placed / measured depth',4,'in'),visibleWhen:{field:'mode',in:[0,1]}},
    {...volume('volume','Known material volume',2),visibleWhen:{field:'mode',equals:2}},
    {id:'material',label:'Gravel material / density preset',value:5,min:0,max:5,integer:true,dimension:'number',group:'Material & assumptions',options:[
      {value:0,label:'Pea gravel — 1.35 US tons/yd³'},
      {value:1,label:'Crushed stone — 1.40 US tons/yd³'},
      {value:2,label:'River rock — 1.33 US tons/yd³'},
      {value:3,label:'Limestone — 1.60 US tons/yd³'},
      {value:4,label:'Granite — 1.42 US tons/yd³'},
      {value:5,label:'Custom / supplier density'}
    ]},
    {...number('density','Custom bulk density (US tons / yd³)',1.4,0.01,'Use supplier data for the same moisture and loose/compacted state.'),unit:'ton/yd3',group:'Material & assumptions',visibleWhen:{field:'material',equals:5}},
    {...number('compaction','Compaction allowance (%)',0,0,'Optional extra loose material needed to achieve the intended placed layer. Keep separate from purchasing waste.'),max:100,group:'Material & assumptions'},
    allowance,
    {...price('USD/yd3',['USD/yd3','USD/m3','USD/ton']),optional:false,group:undefined},
    {...number('tax','Material tax (%)',0,0),max:100,group:'Cost'},
    {...number('delivery','Delivery / trucking (USD)',0,0),group:'Cost'},
    {...number('labor','Spreading / labor allowance (USD)',0,0),group:'Cost'}
  ],
  formula:'Measured volume comes from dimensions, known area × depth or known volume. Order volume = measured volume × compaction factor × material allowance. Weight = order cubic yards × selected or custom density. Total = priced order quantity + material tax + delivery + entered labor.',
  assumptions:[
    'Density presets are planning values; use supplier scale-ticket or product data for the exact grading, moisture and material state.',
    'Compaction allowance and purchasing waste are separate inputs and are applied once each.',
    'Price can be entered per cubic yard, cubic meter or US ton; the calculator prices the corresponding computed quantity without premature rounding.',
    'Delivery and spreading/labor are entered quote allowances; supplier minimum-load or distance pricing should be included in those entered amounts when applicable.',
    'US tons are short tons of 2,000 lb; metric tonnes are reported separately.'
  ],
  sources:[inchGravel,omniGravel],
  calculate(v,u){
    const mode=Math.round(v.mode);
    const netFt3=mode===0?v.length*v.width*v.depth:mode===1?v.area*v.depth:v.volume;
    requireCondition(netFt3>=0,'volume','Material volume cannot be negative.');
    const presets=[1.35,1.40,1.33,1.60,1.42];
    const material=Math.round(v.material);
    const density=material===5?v.density:(presets[material]??1.40);
    requireCondition(density>0,'density','Bulk density must be greater than zero.');
    const netYd3=netFt3/27,compactionFactor=1+v.compaction/100,afterCompaction=netYd3*compactionFactor,orderYd3=afterCompaction*waste(v);
    const tons=orderYd3*density,lb=tons*2000,m3=orderYd3*27/(FT_PER_M**3);
    const pricedQty=u.price==='USD/ton'?tons:u.price==='USD/m3'?m3:orderYd3;
    const materials=pricedQty*v.price,tax=materials*v.tax/100,total=materials+tax+v.delivery+v.labor;
    return result([
      row('total','Estimated entered-scope total',total,'USD'),
      row('order','Gravel to order',orderYd3,'yd³'),
      row('tons','Estimated order weight — US tons',tons,'US tons'),
      row('materials','Material subtotal',materials,'USD'),
      row('tax','Material tax',tax,'USD'),
      row('delivery','Delivery / trucking',v.delivery,'USD'),
      row('labor','Spreading / labor allowance',v.labor,'USD'),
      row('net','Measured / placed volume',netYd3,'yd³'),
      row('compaction','Volume after compaction allowance',afterCompaction,'yd³'),
      row('m3','Order volume',m3,'m³'),
      row('pounds','Estimated order weight — lb',lb,'lb'),
      row('tonnes','Estimated order weight — metric tonnes',lb/LB_PER_KG/1000,'metric tonnes')
    ],[
      mode===0?`${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} = ${fmt(netFt3)} ft³.`:mode===1?`${fmt(v.area)} ft² × ${fmt(v.depth)} = ${fmt(netFt3)} ft³.`:`Entered volume = ${fmt(netFt3)} ft³.`,
      `${fmt(netYd3)} yd³ × ${fmt(compactionFactor)} compaction factor × ${fmt(waste(v))} allowance factor = ${fmt(orderYd3)} yd³ to order.`,
      `${fmt(orderYd3)} yd³ × ${fmt(density)} ton/yd³ = ${fmt(tons)} US tons.`,
      `${fmt(pricedQty)} ${u.price} × ${fmt(v.price)} + tax + delivery + labor = ${fmt(total)}.`
    ]);
  }
};

const crushedStone:Model={
  fields:[
    {id:'mode',label:'Calculate volume from',value:0,min:0,max:2,integer:true,dimension:'number',options:[
      {value:0,label:'Length × width × depth'},
      {value:1,label:'Known area × depth'},
      {value:2,label:'Known volume'}
    ]},
    {...length('length','Area length',20),visibleWhen:{field:'mode',equals:0}},
    {...length('width','Area width',10),visibleWhen:{field:'mode',equals:0}},
    {...area('area','Known surface area',200),visibleWhen:{field:'mode',equals:1}},
    {...length('depth','Placed / measured depth',4,'in'),visibleWhen:{field:'mode',in:[0,1]}},
    {...volume('volume','Known crushed-stone volume',2),visibleWhen:{field:'mode',equals:2}},
    {id:'material',label:'Crushed-stone material / density preset',value:4,min:0,max:4,integer:true,dimension:'number',group:'Material & assumptions',options:[
      {value:0,label:'Crushed stone — 1.50 US tons/yd³'},
      {value:1,label:'Crusher run — 1.60 US tons/yd³'},
      {value:2,label:'Crushed concrete — 1.40 US tons/yd³'},
      {value:3,label:'Limestone base — 1.55 US tons/yd³'},
      {value:4,label:'Custom / supplier density'}
    ]},
    {...number('density','Custom bulk density (US tons / yd³)',1.5,0.01,'Use supplier data for the exact grading, moisture and loose/compacted state.'),unit:'ton/yd3',group:'Material & assumptions',visibleWhen:{field:'material',equals:4}},
    {...number('compaction','Compaction allowance (%)',0,0,'Optional extra loose material needed to achieve the intended placed layer. Keep separate from purchasing waste.'),max:100,group:'Material & assumptions'},
    allowance,
    price('USD/yd3',['USD/yd3','USD/m3','USD/ton'])
  ],
  formula:'Measured volume comes from dimensions, known area × depth or known volume. Order volume = measured volume × compaction factor × material allowance. Weight = order cubic yards × selected or custom bulk density.',
  assumptions:[
    'Density presets are planning values only. Use supplier scale-ticket or product data for the exact grading, moisture and loose/compacted state when available.',
    'Compaction allowance and purchasing waste are separate inputs and are applied once each. Do not add a second compaction factor when dimensions and density already describe the same compacted state.',
    'Price can be entered per cubic yard, cubic meter or US ton; optional cost uses the corresponding computed quantity.',
    'US tons are short tons of 2,000 lb; metric tonnes are reported separately.'
  ],
  sources:[inchGravel,omniGravel],
  calculate(v,u){
    const mode=Math.round(v.mode);
    const netFt3=mode===0?v.length*v.width*v.depth:mode===1?v.area*v.depth:v.volume;
    requireCondition(netFt3>=0,'volume','Crushed-stone volume cannot be negative.');
    const presets=[1.50,1.60,1.40,1.55];
    const material=Math.round(v.material);
    const density=material===4?v.density:(presets[material]??1.50);
    requireCondition(density>0,'density','Bulk density must be greater than zero.');
    const netYd3=netFt3/27;
    const compactionFactor=1+v.compaction/100;
    const afterCompaction=netYd3*compactionFactor;
    const orderYd3=afterCompaction*waste(v);
    const tons=orderYd3*density,lb=tons*2000,m3=orderYd3*27/(FT_PER_M**3);
    const pricedQty=u.price==='USD/ton'?tons:u.price==='USD/m3'?m3:orderYd3;
    return result([
      row('order','Crushed stone to order',orderYd3,'yd³'),
      row('tons','Estimated order weight — US tons',tons,'US tons'),
      row('pounds','Estimated order weight — lb',lb,'lb'),
      row('tonnes','Estimated order weight — metric tonnes',lb/LB_PER_KG/1000,'metric tonnes'),
      row('net','Measured / placed volume',netYd3,'yd³'),
      row('compaction','Volume after compaction allowance',afterCompaction,'yd³'),
      row('m3','Order volume',m3,'m³'),
      ...(Number.isFinite(v.price)?[row('cost','Estimated material cost',pricedQty*v.price,'USD')]:[])
    ],[
      mode===0?`${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} = ${fmt(netFt3)} ft³.`:mode===1?`${fmt(v.area)} ft² × ${fmt(v.depth)} = ${fmt(netFt3)} ft³.`:`Entered volume = ${fmt(netFt3)} ft³.`,
      `${fmt(netYd3)} yd³ × ${fmt(compactionFactor)} compaction factor × ${fmt(waste(v))} allowance factor = ${fmt(orderYd3)} yd³ to order.`,
      `${fmt(orderYd3)} yd³ × ${fmt(density)} ton/yd³ = ${fmt(tons)} US tons.`
    ]);
  }
};

function weightModel(label:string,density:number):Model{
  return {
    fields:[
      {id:'mode',label:'Calculate from',value:0,min:0,max:2,integer:true,dimension:'number',options:[{value:0,label:'Length × width × depth'},{value:1,label:'Known area × depth'},{value:2,label:'Known volume'}]},
      {...length('length','Area length',20),visibleWhen:{field:'mode',equals:0}},{...length('width','Area width',10),visibleWhen:{field:'mode',equals:0}},{...area('area','Known surface area',200),visibleWhen:{field:'mode',equals:1}},{...length('depth','Material depth',4,'in'),visibleWhen:{field:'mode',in:[0,1]}},{...volume('volume','Known volume',2),visibleWhen:{field:'mode',equals:2}},
      {...number('density','Bulk density (US tons / yd³)',density,0.01),unit:'ton/yd3'}
    ],
    formula:'Measured volume is converted to cubic yards; estimated weight = cubic yards × entered tons-per-cubic-yard density.',
    assumptions:[`${label} density is editable because moisture, grading and compaction change bulk weight.`,'Dimensions and density should describe the same material state.','This weight-only calculator does not add a purchasing overage; use the material calculator for order allowance.'],
    sources:[inchGravel],
    calculate(v){const mode=Math.round(v.mode),ft3=mode===0?v.length*v.width*v.depth:mode===1?v.area*v.depth:v.volume,yd3=ft3/27,tons=yd3*v.density,lb=tons*2000;return result([row('tons',`Estimated ${label.toLowerCase()} weight`,tons,'US tons'),row('weight','Estimated weight — lb',lb,'lb'),row('kg','Estimated weight — kg',lb/LB_PER_KG,'kg'),row('tonnes','Estimated weight — metric tonnes',lb/LB_PER_KG/1000,'metric tonnes'),row('volume','Measured volume',yd3,'yd³')],[`${fmt(ft3)} ft³ ÷ 27 = ${fmt(yd3)} yd³.`,`${fmt(yd3)} yd³ × ${fmt(v.density)} = ${fmt(tons)} US tons.`]);}
  };
}

const gravelDepth:Model={
  fields:[
    {id:'areaMode',label:'Coverage area from',value:0,min:0,max:1,integer:true,dimension:'number',options:[{value:0,label:'Length × width'},{value:1,label:'Known area'}]},
    {...length('length','Coverage length',20),visibleWhen:{field:'areaMode',equals:0}},{...length('width','Coverage width',10),visibleWhen:{field:'areaMode',equals:0}},{...area('area','Known coverage area',200),visibleWhen:{field:'areaMode',equals:1}},
    {id:'supplyMode',label:'Available gravel from',value:0,min:0,max:1,integer:true,dimension:'number',options:[{value:0,label:'Known volume'},{value:1,label:'Known weight'}]},
    {...volume('volume','Available gravel volume',2),visibleWhen:{field:'supplyMode',equals:0}},
    {...number('tons','Available gravel weight (US tons)',3,0),unit:'ton',visibleWhen:{field:'supplyMode',equals:1}},
    {...number('density','Bulk density (US tons / yd³)',1.4,0.01),unit:'ton/yd3',visibleWhen:{field:'supplyMode',equals:1}}
  ],
  formula:'Average depth = available volume ÷ coverage area. Weight mode first converts tons to cubic yards using the entered bulk density.',
  assumptions:['This is a coverage-depth calculator, not a structural pavement or base-thickness recommendation.','Volume and density must represent the same loose/compacted state as the intended layer.'],
  sources:[omniGravel],
  calculate(v){const a=Math.round(v.areaMode)===0?v.length*v.width:v.area;requireCondition(a>0,'area','Coverage area must be greater than zero.');const yd3=Math.round(v.supplyMode)===0?v.volume/27:v.tons/v.density;const ft3=yd3*27,depth=ft3/a;return result([row('depth','Average coverage depth — inches',depth*12,'in'),row('mm','Average coverage depth — millimeters',depth/FT_PER_M*1000,'mm'),row('area','Coverage area',a,'ft²'),row('volume','Available gravel volume',yd3,'yd³')],[`${fmt(yd3)} yd³ × 27 = ${fmt(ft3)} ft³.`,`${fmt(ft3)} ft³ ÷ ${fmt(a)} ft² = ${fmt(depth*12)} in average depth.`]);}
};

// ---------------- Excavation / earthwork ----------------
function excavationVolume(lengthFt:number,widthFt:number,depthFt:number,slope:number){
  requireCondition(slope>=0,'sideSlope','Side slope cannot be negative.');
  // Exact integral of (L+2sz)(W+2sz) from z=0..h.
  return lengthFt*widthFt*depthFt+slope*(lengthFt+widthFt)*depthFt**2+(4/3)*slope**2*depthFt**3;
}
const excavationGeneral:Model={
  fields:[length('length','Bottom excavation length',20),length('width','Bottom excavation width',10),length('depth','Excavation depth',4),positiveOrZero(number('sideSlope','Side slope — horizontal per 1 vertical',0,0,'Enter 0 for vertical sides.')),count('quantity','Identical excavations',1),number('swell','Bank-to-loose swell (%)',20,0),price('USD/yd3')],
  formula:'Bank volume integrates the expanding rectangular excavation from bottom dimensions and entered side slope. Loose haul volume = bank volume × (1 + swell/100).',
  assumptions:['Side slope is a geometric input from the excavation plan or site-safety requirements; this calculator does not select a safe slope or shoring system.','Swell is project/material specific. Use geotechnical or field data when available.','Optional price is per bank cubic yard.'],
  sources:[fhwaEarthwork],
  calculate(v,u){const bankFt3=excavationVolume(v.length,v.width,v.depth,v.sideSlope)*v.quantity,bank=bankFt3/27,loose=bank*(1+v.swell/100),topL=v.length+2*v.sideSlope*v.depth,topW=v.width+2*v.sideSlope*v.depth;return result(withCost([row('bank','In-place bank volume',bank,'yd³'),row('loose','Loose haul volume',loose,'yd³'),row('m3','Bank volume',bankFt3/FT_PER_M**3,'m³'),row('topLength','Top excavation length',topL,'ft'),row('topWidth','Top excavation width',topW,'ft')],v.price,u.price,{'USD/yd3':bank}),[`Bottom ${fmt(v.length)} × ${fmt(v.width)} ft, depth ${fmt(v.depth)} ft, side slope ${fmt(v.sideSlope)}H:1V → ${fmt(bank)} bank yd³.`,`Swell ${fmt(v.swell)}% → ${fmt(loose)} loose yd³.`]);}
};

const excavationCost:Model={
  fields:[length('length','Bottom excavation length',20),length('width','Bottom excavation width',10),length('depth','Excavation depth',4),positiveOrZero(number('sideSlope','Side slope — horizontal per 1 vertical',0,0)),count('quantity','Identical excavations',1),number('swell','Bank-to-loose swell (%)',20,0),number('bankRate','Excavation rate (USD / bank yd³)',0,0),number('haulRate','Haul / disposal rate (USD / loose yd³)',0,0),positiveOrZero(number('truckCapacity','Loose truck capacity (yd³; 0 = skip trips)',0,0)),number('equipment','Equipment / mobilization (USD)',0,0),number('labor','Additional labor (USD)',0,0)],
  formula:'Total = bank yd³ × excavation rate + loose yd³ × haul/disposal rate + equipment + labor. Truck trips = ceil(loose yd³ ÷ entered truck capacity).',
  assumptions:['Rates must match the bank/loose quantity basis shown.','Side slope/shoring and swell are project inputs, not safety or geotechnical recommendations.','Rock, dewatering, utility conflicts, permits and special disposal are excluded unless captured in entered rates/fixed costs.'],
  sources:[fhwaEarthwork],
  calculate(v){const bankFt3=excavationVolume(v.length,v.width,v.depth,v.sideSlope)*v.quantity,bank=bankFt3/27,loose=bank*(1+v.swell/100),exc=bank*v.bankRate,haul=loose*v.haulRate,trips=v.truckCapacity>0?roundUp(loose/v.truckCapacity):0,total=exc+haul+v.equipment+v.labor;return result([row('total','Estimated entered-scope excavation total',total,'USD'),row('bank','Bank excavation volume',bank,'yd³'),row('loose','Loose haul volume',loose,'yd³'),row('trips','Estimated truck trips',trips,'trips',true),row('excavation','Excavation charge',exc,'USD'),row('haul','Haul / disposal charge',haul,'USD'),row('fixed','Equipment + labor',v.equipment+v.labor,'USD')],[`Bank volume = ${fmt(bank)} yd³; swell gives ${fmt(loose)} loose yd³.`,`Excavation $${fmt(exc)} + haul/disposal $${fmt(haul)} + fixed $${fmt(v.equipment+v.labor)} = $${fmt(total)}.`]);}
};

function trenchBank(v:Record<string,number>){const top=v.bottomWidth+2*v.sideSlope*v.depth;const area=v.depth*(v.bottomWidth+top)/2;return {top,area,ft3:area*v.length};}
const trenchGeneral:Model={
  fields:[length('length','Trench length',100),length('bottomWidth','Bottom trench width',2),length('depth','Trench depth',4),positiveOrZero(number('sideSlope','Side slope — horizontal per 1 vertical',0,0)),count('quantity','Identical trenches',1),number('swell','Bank-to-loose swell (%)',20,0),price('USD/yd3')],
  formula:'Trench cross-section = depth × (bottom width + top width) / 2; top width = bottom width + 2 × side slope × depth; loose volume applies swell.',
  assumptions:['Uniform trench cross-section along the entered length.','Side slope comes from the excavation plan/site requirements; zero represents vertical sides and does not imply vertical sides are safe.'],
  sources:[fhwaEarthwork],
  calculate(v,u){const t=trenchBank(v),totalFt3=t.ft3*v.quantity,bank=totalFt3/27,loose=bank*(1+v.swell/100);return result(withCost([row('bank','Trench bank volume',bank,'yd³'),row('loose','Loose excavation volume',loose,'yd³'),row('topWidth','Top trench width',t.top,'ft'),row('area','Trench cross-sectional area per trench',t.area,'ft²'),row('m3','Bank volume — m³',totalFt3/FT_PER_M**3,'m³')],v.price,u.price,{'USD/yd3':bank}),[`Top width = ${fmt(t.top)} ft; cross-section = ${fmt(t.area)} ft² per trench.`,`${fmt(t.area)} × ${fmt(v.length)} × ${v.quantity} / 27 = ${fmt(bank)} bank yd³.`]);}
};

const trenchVolume:Model={...trenchGeneral,fields:trenchGeneral.fields.filter(f=>f.id!=='price'),calculate(v){const t=trenchBank(v),totalFt3=t.ft3*v.quantity,bank=totalFt3/27,loose=bank*(1+v.swell/100);return result([row('bank','Trench bank volume',bank,'yd³'),row('loose','Loose excavation volume',loose,'yd³'),row('ft3','Bank volume — ft³',totalFt3,'ft³'),row('m3','Bank volume — m³',totalFt3/FT_PER_M**3,'m³'),row('topWidth','Top trench width',t.top,'ft')],[`Cross-sectional area ${fmt(t.area)} ft² × ${fmt(v.length)} ft × ${v.quantity} = ${fmt(totalFt3)} ft³.`,`Swell → ${fmt(loose)} loose yd³.`]);}};

const trenchBackfill:Model={
  fields:[length('length','Trench length',100),length('width','Trench width',2),length('depth','Trench depth',4),positiveOrZero(length('pipeDiameter','Outside pipe diameter',12,'in')),count('pipeCount','Parallel pipes',1,0),positiveOrZero(length('beddingDepth','Bedding already occupying trench',0,'in')),number('looseToPlacedShrink','Loose-to-placed volume reduction (%)',0,0),allowance],
  formula:'Placed backfill = trench volume − pipe displacement − bedding volume. Loose material before purchasing allowance = placed backfill ÷ (1 − loose-to-placed reduction).',
  assumptions:['Uniform rectangular trench and circular pipes extending the full length.','Bedding is deducted as a full-width layer. Manholes, ducts and structures need separate deductions.','Loose-to-placed reduction must come from project/material information; it is separate from purchasing allowance.'],
  sources:[fhwaEarthwork],
  calculate(v){requireCondition(v.pipeDiameter<=v.width&&v.pipeDiameter<=v.depth,'pipeDiameter','Pipe diameter must fit in the trench.');requireCondition(v.beddingDepth<=v.depth,'beddingDepth','Bedding depth cannot exceed trench depth.');requireCondition(v.looseToPlacedShrink<100,'looseToPlacedShrink','Loose-to-placed reduction must be less than 100%.');const trench=v.length*v.width*v.depth,pipe=v.length*Math.PI*v.pipeDiameter**2/4*v.pipeCount,bedding=v.length*v.width*v.beddingDepth;requireCondition(pipe+bedding<=trench,'pipeCount','Pipe displacement plus bedding cannot exceed the trench volume. Check pipe count, pipe diameter and bedding depth.');const placed=trench-pipe-bedding,loose=placed/(1-v.looseToPlacedShrink/100),order=loose*waste(v);return result([row('order','Loose backfill to order',order/27,'yd³'),row('loose','Loose backfill before allowance',loose/27,'yd³'),row('placed','Placed/compacted backfill volume',placed/27,'yd³'),row('pipe','Pipe displacement',pipe/27,'yd³'),row('bedding','Bedding displacement',bedding/27,'yd³')],[`Trench ${fmt(trench)} − pipe ${fmt(pipe)} − bedding ${fmt(bedding)} = ${fmt(placed)} ft³ placed backfill.`,`Loose conversion and allowance → ${fmt(order/27)} yd³ to order.`]);}
};

const earthwork:Model={
  fields:[{id:'mode',label:'Bank quantity from',value:0,min:0,max:1,integer:true,dimension:'number',options:[{value:0,label:'Length × width × depth'},{value:1,label:'Known bank volume'}]},{...length('length','Area length',100),visibleWhen:{field:'mode',equals:0}},{...length('width','Area width',50),visibleWhen:{field:'mode',equals:0}},{...length('depth','Average cut/fill depth',2),visibleWhen:{field:'mode',equals:0}},{...volume('volume','Known bank volume',100),visibleWhen:{field:'mode',equals:1}},number('swell','Bank-to-loose swell (%)',20,0),number('shrink','Bank-to-compacted reduction (%)',10,0),price('USD/yd3')],
  formula:'Bank volume comes from dimensions or direct entry. Loose volume = bank × (1 + swell); compacted equivalent = bank × (1 − shrink).',
  assumptions:['Average-depth rectangular mode is an approximation; surveyed cross-sections or surfaces are preferable for irregular grading.','Shrink/swell factors are project-specific and should come from geotechnical/field information.'],
  sources:[fhwaEarthwork],
  calculate(v,u){requireCondition(v.shrink<100,'shrink','Bank-to-compacted reduction must be less than 100%.');const bankFt3=Math.round(v.mode)===0?v.length*v.width*v.depth:v.volume,bank=bankFt3/27,loose=bank*(1+v.swell/100),compacted=bank*(1-v.shrink/100);return result(withCost([row('bank','Bank earthwork volume',bank,'yd³'),row('loose','Loose volume equivalent',loose,'yd³'),row('compacted','Compacted volume equivalent',compacted,'yd³'),row('m3','Bank volume',bankFt3/FT_PER_M**3,'m³')],v.price,u.price,{'USD/yd3':bank}),[`Bank volume = ${fmt(bank)} yd³.`,`Swell → ${fmt(loose)} loose yd³; shrink → ${fmt(compacted)} compacted yd³.`]);}
};

const cutFill:Model={
  fields:[
    {id:'mode',label:'Enter cut and fill as',value:0,min:0,max:1,integer:true,dimension:'number',options:[{value:0,label:'Known volumes'},{value:1,label:'Area × average depth'}]},
    {...volume('cut','Available cut — bank volume',100),visibleWhen:{field:'mode',equals:0}},
    {...volume('fill','Required compacted fill volume',80),visibleWhen:{field:'mode',equals:0}},
    {...area('cutArea','Cut area',1000),visibleWhen:{field:'mode',equals:1}},
    {...length('cutDepth','Average cut depth',2),visibleWhen:{field:'mode',equals:1}},
    {...area('fillArea','Fill area',1000),visibleWhen:{field:'mode',equals:1}},
    {...length('fillDepth','Average compacted fill depth',1),visibleWhen:{field:'mode',equals:1}},
    number('shrink','Bank-to-compacted reduction (%)',10,0),
    number('swell','Bank-to-loose swell (%)',20,0)
  ],
  formula:'Known-volume mode uses entered bank cut and compacted fill. Quick mode uses area × average depth. Bank material required for fill = compacted fill ÷ (1 − shrink). Bank balance = available cut − required bank fill; loose haul equivalent applies swell.',
  assumptions:[
    'Area × average depth is a preliminary quantity method. Irregular grading should use surveyed surfaces, grid methods or cross-sections.',
    'Positive bank balance means export/excess; negative means additional bank material is required.',
    'Assumes excavated material is suitable for the fill. Unsuitable material, topsoil and segregation require separate quantities.'
  ],
  sources:[fhwaEarthwork],
  calculate(v){
    requireCondition(v.shrink<100,'shrink','Shrink must be less than 100%.');
    const mode=Math.round(v.mode);
    const cutFt3=mode===0?v.cut:v.cutArea*v.cutDepth;
    const fillFt3=mode===0?v.fill:v.fillArea*v.fillDepth;
    const required=fillFt3/(1-v.shrink/100);
    const balance=cutFt3-required;
    const loose=Math.abs(balance)*(1+v.swell/100);
    const exportBank=Math.max(0,balance),importBank=Math.max(0,-balance);
    return result([
      row('cut','Available bank cut',cutFt3/27,'yd³'),
      row('fill','Required compacted fill',fillFt3/27,'yd³'),
      row('required','Bank material required for compacted fill',required/27,'yd³'),
      row('balance','Net bank balance (+ export / − import)',balance/27,'yd³'),
      row('export','Bank excess to export',exportBank/27,'yd³'),
      row('import','Bank shortage to import',importBank/27,'yd³'),
      row('loose','Loose haul equivalent of imbalance',loose/27,'yd³')
    ],[
      mode===0?`Entered cut = ${fmt(cutFt3/27)} bank yd³; compacted fill = ${fmt(fillFt3/27)} yd³.`:`Cut = ${fmt(v.cutArea)} ft² × ${fmt(v.cutDepth)} ft; fill = ${fmt(v.fillArea)} ft² × ${fmt(v.fillDepth)} ft.`,
      `Compacted fill ${fmt(fillFt3/27)} ÷ ${fmt(1-v.shrink/100)} = ${fmt(required/27)} bank yd³ required.`,
      `Cut − required fill bank volume = ${fmt(balance/27)} yd³.`
    ]);
  }
};

const dirtRemoval:Model={
  fields:[length('length','Excavation length',20),length('width','Excavation width',10),length('depth','Excavation depth',4),count('quantity','Identical excavations',1),number('swell','Bank-to-loose swell (%)',20,0),positiveOrZero(number('truckCapacity','Loose truck capacity (yd³)',12,0)),number('haulRate','Haul / disposal rate (USD / loose yd³)',0,0),number('tripFee','Fixed fee per truck trip (USD)',0,0)],
  formula:'Bank volume = length × width × depth. Loose removal volume = bank × (1 + swell). Trips = ceil(loose volume ÷ truck capacity). Cost = loose volume × disposal/haul rate + trips × trip fee.',
  assumptions:['Rectangular excavation with uniform depth.','Truck capacity and allowable payload can differ; this uses entered loose-volume capacity only.','Swell and disposal pricing are site/material specific.'],
  sources:[fhwaEarthwork],
  calculate(v){const bankFt3=v.length*v.width*v.depth*v.quantity,bank=bankFt3/27,loose=bank*(1+v.swell/100),trips=v.truckCapacity>0?roundUp(loose/v.truckCapacity):0,cost=loose*v.haulRate+trips*v.tripFee;return result([row('bank','Bank excavation volume',bank,'yd³'),row('loose','Loose dirt removal volume',loose,'yd³'),row('trips','Estimated truck trips',trips,'trips',true),row('cost','Estimated haul / disposal cost',cost,'USD')],[`${fmt(bank)} bank yd³ × ${fmt(1+v.swell/100)} = ${fmt(loose)} loose yd³.`,v.truckCapacity>0?`ceil(${fmt(loose)} ÷ ${fmt(v.truckCapacity)}) = ${trips} trips.`:'Truck-trip estimate disabled.']);}
};

const soilVolume:Model={
  fields:[{id:'mode',label:'Calculate bank volume from',value:0,min:0,max:2,integer:true,dimension:'number',options:[{value:0,label:'Length × width × depth'},{value:1,label:'Known area × depth'},{value:2,label:'Known bank volume'}]},{...length('length','Area length',20),visibleWhen:{field:'mode',equals:0}},{...length('width','Area width',10),visibleWhen:{field:'mode',equals:0}},{...area('area','Known area',200),visibleWhen:{field:'mode',equals:1}},{...length('depth','Average depth',2),visibleWhen:{field:'mode',in:[0,1]}},{...volume('volume','Known bank volume',10),visibleWhen:{field:'mode',equals:2}},number('swell','Bank-to-loose swell (%)',20,0)],
  formula:'Bank volume comes from dimensions, area × depth or direct entry; loose volume = bank × (1 + swell).',
  assumptions:['Dimensions represent in-place bank volume.','Swell is project-specific and affects loose haul volume, not in-place excavation geometry.'],
  sources:[fhwaEarthwork],
  calculate(v){const mode=Math.round(v.mode),ft3=mode===0?v.length*v.width*v.depth:mode===1?v.area*v.depth:v.volume,bank=ft3/27,loose=bank*(1+v.swell/100);return result([row('bank','In-place soil volume — yd³',bank,'yd³'),row('loose','Loose soil volume — yd³',loose,'yd³'),row('ft3','In-place soil volume — ft³',ft3,'ft³'),row('m3','In-place soil volume — m³',ft3/FT_PER_M**3,'m³')],[`Bank volume = ${fmt(bank)} yd³.`,`Swell ${fmt(v.swell)}% → ${fmt(loose)} loose yd³.`]);}
};

const soilWeight:Model={
  fields:[{id:'mode',label:'Soil volume from',value:0,min:0,max:1,integer:true,dimension:'number',options:[{value:0,label:'Length × width × depth'},{value:1,label:'Known volume'}]},{...length('length','Area length',20),visibleWhen:{field:'mode',equals:0}},{...length('width','Area width',10),visibleWhen:{field:'mode',equals:0}},{...length('depth','Soil depth',1),visibleWhen:{field:'mode',equals:0}},{...volume('volume','Known soil volume',10),visibleWhen:{field:'mode',equals:1}},number('density','Soil bulk density (lb/ft³)',100,0),allowance],
  formula:'Soil weight = measured volume × allowance factor × entered bulk density.',
  assumptions:['Use density for the same moisture and loose/compacted state as the entered volume.','This is a mass estimate; legal truck payload limits are not inferred.'],
  sources:[fhwaEarthwork],
  calculate(v){const ft3=Math.round(v.mode)===0?v.length*v.width*v.depth:v.volume,order=ft3*waste(v),lb=order*v.density;return result([row('weight','Estimated soil order weight — lb',lb,'lb'),row('tons','Estimated soil order weight — US tons',lb/2000,'US tons'),row('kg','Estimated soil order weight — kg',lb/LB_PER_KG,'kg'),row('tonnes','Estimated soil order weight — metric tonnes',lb/LB_PER_KG/1000,'metric tonnes'),row('volume','Volume with allowance',order/27,'yd³')],[`${fmt(order)} ft³ × ${fmt(v.density)} lb/ft³ = ${fmt(lb)} lb.`]);}
};

export const mortarSiteworkModels:Record<string,Model>={
  'mortar-general-dedicated':mortarGeneral,
  'mortar-mix-dedicated':materialModels['mortar-mix'],
  'mortar-quantity-dedicated':materialModels['mortar-quantity'],
  'mortar-cost-dedicated':mortarCost,
  'grout-general-dedicated':groutGeneral,
  'grout-quantity-dedicated':groutQuantity,
  'grout-cost-dedicated':groutCost,
  'cement-general-dedicated':cementGeneral,
  'cement-bag-dedicated':cementBag,
  'cement-sand-dedicated':cementSand,
  'deck-mud-dedicated':finishModels.deckMud,
  'stucco-dedicated':finishModels.stucco,

  'gravel-general-dedicated':gravelGeneral,
  'gravel-cost-dedicated':gravelCost,
  'gravel-weight-dedicated':weightModel('Gravel',1.4),
  'gravel-depth-dedicated':gravelDepth,
  'crushed-stone-dedicated':crushedStone,
  'crushed-stone-cost-dedicated':bulkModel({label:'Crushed stone',density:1.5,costMode:true}),
  'aggregate-dedicated':bulkModel({label:'Aggregate',density:1.5}),
  'aggregate-weight-dedicated':weightModel('Aggregate',1.5),
  'sand-dedicated':bulkModel({label:'Sand',density:1.4}),
  'sand-weight-dedicated':weightModel('Sand',1.4),
  'sand-cost-dedicated':bulkModel({label:'Sand',density:1.4,costMode:true}),
  'fill-dirt-dedicated':bulkModel({label:'Fill dirt',density:1.2}),
  'fill-dirt-cost-dedicated':bulkModel({label:'Fill dirt',density:1.2,costMode:true}),
  'topsoil-dedicated':bulkModel({label:'Topsoil',density:1.1}),
  'topsoil-cost-dedicated':bulkModel({label:'Topsoil',density:1.1,costMode:true}),

  'excavation-general-dedicated':excavationGeneral,
  'excavation-cost-dedicated':excavationCost,
  'trench-general-dedicated':trenchGeneral,
  'trench-volume-dedicated':trenchVolume,
  'trench-backfill-dedicated':trenchBackfill,
  'earthwork-dedicated':earthwork,
  'cut-fill-dedicated':cutFill,
  'dirt-removal-dedicated':dirtRemoval,
  'soil-volume-dedicated':soilVolume,
  'soil-weight-dedicated':soilWeight,
};
