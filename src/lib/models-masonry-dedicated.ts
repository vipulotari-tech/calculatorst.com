import type { Field, Model } from './calculator-types.ts';
import {
  FT_PER_M, allowance, area, count, fmt, length, number, positiveOrZero,
  price, requireCondition, result, roundUp, row, waste, withCost,
} from './calculator-math.ts';

const cmhaUnits='https://www.masonryandhardscapes.org/resource/cmu-tec-001/';
const cmhaLayout='https://www.masonryandhardscapes.org/resource/tek-05-12/';
const cmhaConstruction='https://www.masonryandhardscapes.org/resource/tek-03-08a/';
const cmhaWeight='https://www.masonryandhardscapes.org/resource/cmu-tec-002/';
const inchBrick='https://www.inchcalculator.com/brick-calculator/';
const inchBlock='https://www.inchcalculator.com/concrete-block-calculator/';
const inchMortar='https://www.inchcalculator.com/block-mortar-calculator/';
const quikreteMortarMix='https://www.quikrete.com/PDFs/DATA_SHEET-MortarMix.pdf';
const omniBrick='https://www.omnicalculator.com/construction/brick';
const omniBlock='https://www.omnicalculator.com/construction/concrete-block';
const omniFill='https://www.omnicalculator.com/construction/concrete-block-fill';

const brickDims=[
  length('brickLength','Actual brick length',7.625,'in'),
  length('brickHeight','Actual brick height',2.25,'in'),
  length('brickDepth','Actual brick depth / wythe thickness',3.625,'in'),
  positiveOrZero(length('joint','Mortar joint',0.375,'in')),
];

const blockDims=[
  length('blockLength','Specified block length',15.625,'in'),
  length('blockHeight','Specified block height',7.625,'in'),
  length('blockDepth','Specified block width / thickness',7.625,'in'),
  positiveOrZero(length('joint','Mortar joint',0.375,'in')),
];

function netWall(v:Record<string,number>){
  const gross=v.length*v.height;
  const net=gross-(v.openings??0);
  requireCondition(net>=0,'openings','Openings cannot exceed the measured wall area.');
  return {gross,net};
}
function moduleFace(l:number,h:number,j:number){return (l+j)*(h+j);}
function unitTakeoff(netArea:number,l:number,h:number,j:number,qtyFactor=1){
  const face=moduleFace(l,h,j);
  requireCondition(face>0,'joint','Unit and joint dimensions must produce a positive installed module.');
  const raw=netArea/face*qtyFactor;
  return {face,raw,base:roundUp(raw)};
}
function courseInfo(lengthFt:number,heightFt:number,l:number,h:number,j:number){
  return {
    courses:roundUp(heightFt/(h+j)),
    grossPerCourse:roundUp(lengthFt/(l+j)),
  };
}
function costRows(units:number,unitWeight:number,unitPrice:number,tax:number,delivery:number,labor:number){
  const material=units*unitPrice;
  const taxAmt=material*tax/100;
  return {material,taxAmt,total:material+taxAmt+delivery+labor,weight:units*unitWeight};
}
const brickSources=[cmhaLayout,inchBrick,omniBrick];
const blockSources=[cmhaUnits,cmhaLayout,inchBlock,omniBlock];

const brickGeneral:Model={
  fields:[
    {id:'mode',label:'Wall measurement',value:0,min:0,max:1,integer:true,dimension:'number',options:[{value:0,label:'Length × height'},{value:1,label:'Known net wall area'}]},
    {...length('length','Wall length',20,'ft'),visibleWhen:{field:'mode',equals:0}},
    {...length('height','Wall height',8,'ft'),visibleWhen:{field:'mode',equals:0}},
    {...area('knownArea','Known net wall area',160),visibleWhen:{field:'mode',equals:1}},
    {...area('openings','Openings / excluded wall area',0,0),visibleWhen:{field:'mode',equals:0}},
    ...brickDims,
    {id:'wythes',label:'Brick wythes / layers',value:1,min:1,max:4,integer:true,dimension:'number'},
    allowance,
    number('unitWeight','Brick unit weight (lb)',4.3,0),
    price('USD/unit'),
  ],
  formula:'Net face area is divided by the installed brick module face; brick count is multiplied by wythes and purchasing allowance.',
  assumptions:[
    'Actual brick face dimensions plus the entered joint define the installed module. Brick sizes vary, so verify the selected product.',
    'Wythes multiply brick quantity. Openings are subtracted once from wall face area.',
    'This is a material takeoff; bond pattern, corners, returns, lintels, arches and special units need separate detailing.'
  ],
  sources:brickSources,
  calculate(v,u){
    const net=Math.round(v.mode)===1?v.knownArea:netWall(v).net;
    const t=unitTakeoff(net,v.brickLength,v.brickHeight,v.joint,v.wythes);
    const installed=roundUp(t.raw), order=roundUp(t.raw*waste(v));
    return result(withCost([
      row('order','Bricks to order',order,'bricks',true),
      row('installed','Estimated installed bricks',installed,'bricks',true),
      row('area','Net wall area',net,'ft²'),
      row('perArea','Bricks per square foot per wythe',1/t.face,'bricks/ft²'),
      row('weight','Estimated brick order weight',order*v.unitWeight,'lb'),
      row('tons','Estimated brick order weight',order*v.unitWeight/2000,'US tons'),
    ],v.price,u.price,{'USD/unit':order}),[
      `Installed module: ${fmt((v.brickLength+v.joint)*12)} × ${fmt((v.brickHeight+v.joint)*12)} in.`,
      `${fmt(net)} ft² ÷ ${fmt(t.face)} ft²/module × ${v.wythes} wythe(s) = ${fmt(t.raw)} bricks before allowance.`,
      `Round ${fmt(t.raw*waste(v))} up = ${order} bricks to order.`
    ]);
  }
};

const brickWall:Model={
  fields:[
    length('length','Wall length',20,'ft'),length('height','Wall height',8,'ft'),
    area('openings','Doors / windows / excluded area',0,0),
    ...brickDims,{id:'wythes',label:'Brick wythes / layers',value:1,min:1,max:4,integer:true,dimension:'number'},
    allowance,
    {...number('mortarCoverage','Installed bricks per mortar bag',37,0.01,'Planning yield only. The default is an 80-lb standard-brick example; replace it with the exact mortar product coverage.'),group:'Material & assumptions'},
    number('unitWeight','Brick unit weight (lb)',4.3,0),price('USD/unit')
  ],
  formula:'Net wall area = length × height − openings. Installed bricks = net area ÷ installed module face × wythes; brick order applies allowance once. Planning mortar bags = ceil(installed bricks ÷ entered bricks-per-bag coverage).',
  assumptions:[
    'Courses and bricks-per-course are gross layout checks; opening deductions are handled by net area.',
    'Actual bond pattern, cut units, corners, returns and lintels can change individual-course counts.',
    'Use actual brick dimensions and the specified joint rather than assuming one universal brick size.',
    'Mortar bags are a planning estimate from installed bricks and entered product coverage; brick spare allowance is not applied to mortar bags.'
  ],
  sources:[...brickSources,quikreteMortarMix],
  calculate(v,u){
    const {gross,net}=netWall(v),t=unitTakeoff(net,v.brickLength,v.brickHeight,v.joint,v.wythes),ci=courseInfo(v.length,v.height,v.brickLength,v.brickHeight,v.joint);
    const installed=roundUp(t.raw),order=roundUp(t.raw*waste(v)),mortarBags=roundUp(installed/v.mortarCoverage),orderWeight=order*v.unitWeight;
    return result(withCost([
      row('order','Bricks to order',order,'bricks',true),row('installed','Estimated installed bricks',installed,'bricks',true),
      row('mortarBags','Planning mortar bags',mortarBags,'bags',true),
      row('courses','Gross wall courses',ci.courses,'courses',true),row('perCourse','Gross bricks per course',ci.grossPerCourse,'bricks',true),
      row('grossArea','Gross wall area',gross,'ft²'),row('netArea','Net wall area',net,'ft²'),
      row('weight','Estimated order weight — lb',orderWeight,'lb'),row('tons','Estimated order weight — US tons',orderWeight/2000,'US tons')
    ],v.price,u.price,{'USD/unit':order}),[
      `Gross area ${fmt(gross)} − openings ${fmt(v.openings)} = ${fmt(net)} ft².`,
      `Approximate gross layout: ${ci.courses} courses × ${ci.grossPerCourse} bricks/course before opening/bond adjustments.`,
      `Area-based installed quantity = ${fmt(t.raw)}; allowance gives ${order} bricks to order.`,
      `Planning mortar = ceil(${installed} installed bricks ÷ ${fmt(v.mortarCoverage)} bricks/bag) = ${mortarBags} bags.`
    ]);
  }
};

const brickQuantity:Model={
  fields:[
    {id:'mode',label:'Quantity source',value:0,min:0,max:1,integer:true,dimension:'number',options:[{value:0,label:'Wall dimensions'},{value:1,label:'Known net wall area'}]},
    {...length('length','Wall length',20),visibleWhen:{field:'mode',equals:0}},
    {...length('height','Wall height',8),visibleWhen:{field:'mode',equals:0}},
    {...area('openings','Excluded area',0,0),visibleWhen:{field:'mode',equals:0}},
    {...area('knownArea','Known net wall area',160),visibleWhen:{field:'mode',equals:1}},
    ...brickDims.slice(0,2),positiveOrZero(length('joint','Mortar joint',0.375,'in')),
    {id:'wythes',label:'Wythes / layers',value:1,min:1,max:4,integer:true,dimension:'number'},allowance
  ],
  formula:'Bricks = net wall area ÷ installed brick module face × wythes; order count = ceil(raw brick quantity × allowance factor). Net wall area can come from wall dimensions minus openings or a directly entered known net area.',
  assumptions:['Quantity-only takeoff using face geometry.','In wall-dimensions mode, openings are deducted once. Known-area mode expects area after opening deductions.','Special units, corners and bond-pattern cuts are separate.'],
  sources:brickSources,
  calculate(v){
    const net=Math.round(v.mode)===1?v.knownArea:netWall(v).net;
    requireCondition(net>0,'knownArea','Net wall area must be greater than zero.');
    const t=unitTakeoff(net,v.brickLength,v.brickHeight,v.joint,v.wythes),installed=roundUp(t.raw),order=roundUp(t.raw*waste(v));
    return result([row('order','Bricks to order',order,'bricks',true),row('installed','Estimated installed bricks',installed,'bricks',true),row('extra','Allowance / spare bricks',order-installed,'bricks',true),row('area','Net wall area',net,'ft²'),row('perArea','Bricks per square foot per wythe',1/t.face,'bricks/ft²')],[`${fmt(net)} ft² ÷ ${fmt(t.face)} ft²/module × ${v.wythes} = ${fmt(t.raw)} bricks.`,`Allowance → ${order} whole bricks.`]);
  }
};

const brickCost:Model={
  fields:[
    length('length','Wall length',20),length('height','Wall height',8),area('openings','Excluded area',0,0),
    ...brickDims,{id:'wythes',label:'Wythes / layers',value:1,min:1,max:4,integer:true,dimension:'number'},allowance,
    {...price('USD/unit'),optional:false},
    {...number('blocksPerMortarBag','Installed bricks per mortar bag',36,0.01,'Use the mortar manufacturer or project-specific yield. Must be greater than zero.'),group:'Material & assumptions'},
    {...number('mortarBagPrice','Mortar bag price (USD)',0,0),group:'Cost'},
    {...number('tax','Material tax (%)',0,0),group:'Cost'},{...number('delivery','Delivery / fixed material fee (USD)',0,0),group:'Cost'},{...number('labor','Labor / equipment allowance (USD)',0,0),group:'Cost'}
  ],
  formula:'Brick material = order bricks × unit price. Mortar bags = ceil(installed bricks ÷ entered bricks-per-bag). Total = brick + mortar material + tax + delivery + labor.',
  assumptions:['Mortar coverage is user-entered because yield varies with brick size, joint geometry and workmanship.','Labor is an entered allowance, not a productivity estimate.','Other accessories and structural components are excluded unless included in entered costs.'],
  sources:[inchBrick,inchMortar,cmhaConstruction],
  calculate(v){
    const net=netWall(v).net,t=unitTakeoff(net,v.brickLength,v.brickHeight,v.joint,v.wythes),installed=roundUp(t.raw),order=roundUp(t.raw*waste(v));
    const mortarBags=roundUp(installed/v.blocksPerMortarBag),brickMat=order*v.price,mortarMat=mortarBags*v.mortarBagPrice,materials=brickMat+mortarMat,tax=materials*v.tax/100,total=materials+tax+v.delivery+v.labor;
    return result([
      row('total','Estimated entered-scope total',total,'USD'),row('order','Bricks to order',order,'bricks',true),row('installed','Estimated installed bricks',installed,'bricks',true),row('extra','Allowance / spare bricks',order-installed,'bricks',true),row('mortarBags','Mortar bags',mortarBags,'bags',true),
      row('netArea','Net wall area',net,'ft²'),row('costPerArea','Entered-scope cost per net ft²',total/net,'USD/ft²'),row('brickMaterial','Brick subtotal',brickMat,'USD'),row('mortarMaterial','Mortar subtotal',mortarMat,'USD'),row('materials','Material subtotal',materials,'USD'),row('tax','Material tax',tax,'USD'),row('delivery','Delivery / fixed fee',v.delivery,'USD'),row('labor','Labor / equipment',v.labor,'USD')
    ],[`${fmt(net)} ft² net wall area gives ${fmt(t.raw)} bricks before allowance; order ${order} whole bricks.`,`${order} bricks × ${fmt(v.price)} = ${fmt(brickMat)}.`,`ceil(${installed} installed bricks ÷ ${fmt(v.blocksPerMortarBag)}) = ${mortarBags} mortar bags.`,`Materials + tax + delivery + labor = ${fmt(total)} (${fmt(total/net)} per net ft²).`]);
  }
};

const brickMortar:Model={
  fields:[length('length','Wall length',20),length('height','Wall height',8),area('openings','Excluded area',0,0),...brickDims,{id:'wythes',label:'Wythes / layers',value:1,min:1,max:4,integer:true,dimension:'number'},{...number('bagYield','Mixed mortar yield per bag (ft³)',0.6,0),unit:'ft3'},allowance,price('USD/bag')],
  formula:'Theoretical mortar volume = net wall volume − solid brick outer volume for the estimated installed brick count; order volume applies allowance once.',
  assumptions:['Full-bed rectangular brickwork approximation. Perforations and frogs are not treated as mortar-filled unless the product/application requires it.','Use the exact product mixed yield for bag count. Workmanship and joint tooling can change actual usage.','This estimates mortar for regular brickwork; unusual bond patterns and deep cavities need separate takeoff.'],
  sources:[inchMortar,cmhaConstruction],
  calculate(v,u){
    const net=netWall(v).net,t=unitTakeoff(net,v.brickLength,v.brickHeight,v.joint,v.wythes);
    const installed=t.raw;
    const wallVol=net*v.brickDepth*v.wythes;
    const brickVol=installed*v.brickLength*v.brickHeight*v.brickDepth;
    const mortar=Math.max(0,wallVol-brickVol),order=mortar*waste(v),bags=roundUp(order/v.bagYield);
    return result(withCost([row('bags','Mortar bags to order',bags,'bags',true),row('mortar','Theoretical net mortar volume',mortar,'ft³'),row('order','Mortar volume with allowance',order,'ft³'),row('yd3','Mortar volume with allowance',order/27,'yd³'),row('m3','Mortar volume with allowance',order/FT_PER_M**3,'m³')],v.price,u.price,{'USD/bag':bags}),[`Net masonry volume = ${fmt(wallVol)} ft³.`,`Estimated brick outer volume = ${fmt(brickVol)} ft³; theoretical mortar = ${fmt(mortar)} ft³.`,`Allowance → ${fmt(order)} ft³; round ÷ ${fmt(v.bagYield)} up = ${bags} bags.`]);
  }
};

const brickVeneer:Model={
  fields:[length('length','Veneer wall length',20),length('height','Veneer wall height',8),area('openings','Windows / doors',0,0),...brickDims,allowance,number('unitWeight','Brick unit weight (lb)',4.3,0),positiveOrZero(length('tieSpacingH','Specified tie spacing horizontally',24,'in')),positiveOrZero(length('tieSpacingV','Specified tie spacing vertically',16,'in')),price('USD/unit')],
  formula:'Brick veneer count uses one wythe of installed brick face modules. Optional tie count is a rectangular layout from user-specified tie spacing.',
  assumptions:['Single-wythe veneer takeoff only. Air space, flashing, weeps, shelf angles and structural backing are separate.','Tie spacing is an input from the project design; this calculator does not choose a compliant tie layout.','Openings are deducted once from brick quantity. Local detailing can require extra units and ties around openings.'],
  sources:[cmhaLayout,inchBrick],
  calculate(v,u){
    const {net}=netWall(v),t=unitTakeoff(net,v.brickLength,v.brickHeight,v.joint),installed=roundUp(t.raw),order=roundUp(t.raw*waste(v));
    const tiesH=v.tieSpacingH>0?roundUp(v.length/v.tieSpacingH)+1:0,tiesV=v.tieSpacingV>0?roundUp(v.height/v.tieSpacingV)+1:0,ties=tiesH*tiesV;
    return result(withCost([row('order','Veneer bricks to order',order,'bricks',true),row('installed','Estimated installed veneer bricks',installed,'bricks',true),row('area','Net veneer area',net,'ft²'),row('ties','Planning tie-grid locations',ties,'ties',true),row('weight','Estimated brick order weight',order*v.unitWeight,'lb')],v.price,u.price,{'USD/unit':order}),[`${fmt(net)} ft² ÷ installed module = ${fmt(t.raw)} bricks; allowance → ${order}.`,v.tieSpacingH>0&&v.tieSpacingV>0?`Planning tie grid: ${tiesH} × ${tiesV} = ${ties} locations from entered spacing.`:'Tie-grid estimate disabled by zero spacing.']);
  }
};

function paverLayout(v:Record<string,number>){
  const moduleL=v.unitLength+v.joint,moduleW=v.unitWidth+v.joint;
  const rows=roundUp(v.width/moduleW),cols=roundUp(v.length/moduleL),layout=rows*cols;
  const areaCount=roundUp((v.length*v.width)/(moduleL*moduleW));
  const installed=Math.max(layout,areaCount);
  return {moduleL,moduleW,rows,cols,installed};
}
const brickPatio:Model={
  fields:[length('length','Patio length',12),length('width','Patio width',10),length('unitLength','Paver length',8,'in'),length('unitWidth','Paver width',4,'in'),positiveOrZero(length('joint','Joint width',0.125,'in')),allowance,price('USD/unit')],
  formula:'Rows and columns are rounded up from patio dimensions divided by paver module dimensions; purchasing allowance is then applied once.',
  assumptions:['Simple rectangular running orientation without offcut reuse.','Joint width is included in paver module dimensions. Complex patterns and borders should be estimated separately.'],
  sources:[omniBrick],
  calculate(v,u){const p=paverLayout(v),order=roundUp(p.installed*waste(v));return result(withCost([row('order','Pavers to order',order,'pavers',true),row('installed','Layout pavers before allowance',p.installed,'pavers',true),row('rows','Paver rows',p.rows,'rows',true),row('columns','Pavers per row',p.cols,'columns',true),row('area','Patio area',v.length*v.width,'ft²')],v.price,u.price,{'USD/unit':order}),[`${p.cols} columns × ${p.rows} rows = ${p.installed} pavers before allowance.`,`Allowance → ${order} pavers.`]);}
};

const brickPaver:Model={
  fields:[...brickPatio.fields.filter(f=>f.id!=='price'),positiveOrZero(length('baseDepth','Compacted base depth',4,'in')),positiveOrZero(length('sandDepth','Bedding sand depth',1,'in')),price('USD/unit')],
  formula:'Paver count follows rectangular module layout. Base and bedding volumes = patio area × specified compacted/placed depth.',
  assumptions:['Base volume is compacted/placed volume; loose delivery may require supplier-specific conversion.','Bedding sand depth is entered after screeding/placement. Edge restraint and joint sand are separate.','Paver layout is rectangular with no offcut reuse.'],
  sources:[omniBrick],
  calculate(v,u){const p=paverLayout(v),order=roundUp(p.installed*waste(v)),a=v.length*v.width,base=a*v.baseDepth,sand=a*v.sandDepth;return result(withCost([row('order','Pavers to order',order,'pavers',true),row('installed','Layout pavers',p.installed,'pavers',true),row('base','Compacted base volume',base/27,'yd³'),row('sand','Bedding sand volume',sand/27,'yd³'),row('edge','Patio perimeter / edge restraint',2*(v.length+v.width),'ft'),row('area','Paved area',a,'ft²')],v.price,u.price,{'USD/unit':order}),[`Paver layout = ${p.cols} × ${p.rows} = ${p.installed}; allowance → ${order}.`,`Base = ${fmt(a)} × ${fmt(v.baseDepth*12)} in = ${fmt(base/27)} yd³.`,`Bedding sand = ${fmt(sand/27)} yd³.`]);}
};

function genericMasonryFields(){
  return [length('length','Wall length',20),length('height','Wall height',8),area('openings','Excluded area',0,0),length('unitLength','Actual unit length',7.625,'in'),length('unitHeight','Actual unit height',2.25,'in'),positiveOrZero(length('joint','Mortar joint',0.375,'in')),{id:'wythes',label:'Wythes / layers',value:1,min:1,max:4,integer:true,dimension:'number'},allowance,number('unitWeight','Unit weight (lb)',4.3,0),price('USD/unit')] as Field[];
}
const masonryGeneral:Model={...brickGeneral,fields:genericMasonryFields(),formula:'Net wall area ÷ installed masonry module face × wythes, then purchasing allowance, weight and optional unit cost.',sources:[cmhaLayout],calculate(v,u){const net=netWall(v).net,t=unitTakeoff(net,v.unitLength,v.unitHeight,v.joint,v.wythes),installed=roundUp(t.raw),order=roundUp(t.raw*waste(v));return result(withCost([row('order','Masonry units to order',order,'units',true),row('installed','Estimated installed units',installed,'units',true),row('area','Net wall area',net,'ft²'),row('perArea','Units per square foot per wythe',1/t.face,'units/ft²'),row('weight','Estimated order weight',order*v.unitWeight,'lb')],v.price,u.price,{'USD/unit':order}),[`${fmt(net)} ft² ÷ ${fmt(t.face)} × ${v.wythes} = ${fmt(t.raw)} units.`,`Allowance → ${order} whole units.`]);}};
const masonryWall:Model={...masonryGeneral,formula:'Net wall area determines installed units while wall length/height also provide gross courses and units-per-course layout checks.',calculate(v,u){const {gross,net}=netWall(v),t=unitTakeoff(net,v.unitLength,v.unitHeight,v.joint,v.wythes),ci=courseInfo(v.length,v.height,v.unitLength,v.unitHeight,v.joint),order=roundUp(t.raw*waste(v));return result(withCost([row('order','Masonry units to order',order,'units',true),row('courses','Gross wall courses',ci.courses,'courses',true),row('perCourse','Gross units per course',ci.grossPerCourse,'units',true),row('grossArea','Gross wall area',gross,'ft²'),row('netArea','Net wall area',net,'ft²'),row('weight','Estimated unit order weight',order*v.unitWeight,'lb')],v.price,u.price,{'USD/unit':order}),[`Gross layout ≈ ${ci.courses} courses × ${ci.grossPerCourse} units/course.`,`Net area quantity with allowance = ${order} units.`]);}};
const masonryCost:Model={
  fields:[...genericMasonryFields().filter(f=>f.id!=='price'),{...price('USD/unit'),optional:false},number('tax','Material tax (%)',0,0),number('delivery','Delivery (USD)',0,0),number('labor','Labor / equipment (USD)',0,0)],
  formula:'Order units × quoted unit price + material tax + entered delivery and labor/equipment.',
  assumptions:['Unit quantity uses the entered wall geometry, module and allowance.','Mortar, grout and reinforcement are separate unless included in the quoted/entered scope.','Labor is an entered allowance, not a production-rate model.'],
  sources:[cmhaLayout],
  calculate(v){const net=netWall(v).net,t=unitTakeoff(net,v.unitLength,v.unitHeight,v.joint,v.wythes),order=roundUp(t.raw*waste(v)),c=costRows(order,v.unitWeight,v.price,v.tax,v.delivery,v.labor);return result([row('total','Estimated entered-scope total',c.total,'USD'),row('order','Units to order',order,'units',true),row('materials','Unit material subtotal',c.material,'USD'),row('tax','Material tax',c.taxAmt,'USD'),row('delivery','Delivery',v.delivery,'USD'),row('labor','Labor / equipment',v.labor,'USD'),row('weight','Estimated unit order weight',c.weight,'lb')],[`${order} × $${fmt(v.price)} = $${fmt(c.material)}.`,`Add tax + delivery + labor = $${fmt(c.total)}.`]);}
};
const masonryBlock:Model={
  fields:[length('length','Wall length',20),length('height','Wall height',8),area('openings','Excluded area',0,0),length('unitLength','Block length',15.625,'in'),length('unitHeight','Block height',7.625,'in'),positiveOrZero(length('joint','Mortar joint',0.375,'in')),allowance,number('unitWeight','Block weight (lb)',35,0),price('USD/unit')],
  formula:'Net wall area ÷ installed block module face, rounded up, then purchasing allowance.',
  assumptions:['Generic masonry block face takeoff; use manufacturer dimensions and weight.','Block depth does not affect face count but matters for mortar/grout/weight details elsewhere.'],
  sources:[cmhaUnits],
  calculate(v,u){const net=netWall(v).net,t=unitTakeoff(net,v.unitLength,v.unitHeight,v.joint),installed=roundUp(t.raw),order=roundUp(t.raw*waste(v));return result(withCost([row('order','Blocks to order',order,'blocks',true),row('installed','Estimated installed blocks',installed,'blocks',true),row('area','Net wall area',net,'ft²'),row('weight','Estimated block order weight',order*v.unitWeight,'lb')],v.price,u.price,{'USD/unit':order}),[`${fmt(net)} ft² ÷ ${fmt(t.face)} ft²/module = ${fmt(t.raw)} blocks.`,`Allowance → ${order} blocks.`]);}
};

const brickWeight:Model={
  fields:[count('quantity','Net brick count',500,0),number('unitWeight','Brick unit weight (lb)',4.3,0),allowance,positiveOrZero(count('palletCapacity','Bricks per pallet (0 = skip)',500,0))],
  formula:'Order bricks = ceil(net count × allowance factor); order weight = order bricks × entered unit weight.',
  assumptions:['Use manufacturer unit weight for the exact brick.','Pallet count is a purchasing/logistics estimate only and uses the entered pallet capacity.'],
  sources:[inchBrick],
  calculate(v){const order=roundUp(v.quantity*waste(v)),lb=order*v.unitWeight,pallets=v.palletCapacity>0?roundUp(order/v.palletCapacity):0;return result([row('order','Bricks including allowance',order,'bricks',true),row('weight','Estimated order weight',lb,'lb'),row('kg','Estimated order weight',lb*0.45359237,'kg'),row('tons','Estimated order weight',lb/2000,'US tons'),row('tonnes','Estimated order weight',lb*0.45359237/1000,'metric tonnes'),row('pallets','Estimated pallets',pallets,'pallets',true)],[`${v.quantity} × ${fmt(waste(v))} → ${order} bricks.`,`${order} × ${fmt(v.unitWeight)} lb = ${fmt(lb)} lb.`]);}
};
const brickWaste:Model={
  fields:[count('quantity','Net brick quantity',1000,0),allowance],
  formula:'Extra bricks = net quantity × waste%; order quantity = ceil(net + extra).',
  assumptions:['Waste is a purchasing allowance for cuts, breakage and damage.','Choose the project-specific percentage; bond pattern and detailing affect waste.'],
  sources:[inchBrick],
  calculate(v){const extra=v.quantity*(waste(v)-1),total=v.quantity+extra,order=roundUp(total);return result([row('order','Whole bricks to order',order,'bricks',true),row('net','Net required bricks',v.quantity,'bricks',true),row('extra','Calculated extra bricks',extra,'bricks'),row('total','Unrounded total with allowance',total,'bricks')],[`${v.quantity} × ${fmt(v.waste)}% = ${fmt(extra)} extra bricks.`,`Round ${fmt(total)} up = ${order} bricks.`]);}
};
const brickJoint:Model={
  fields:[length('length','Finished course length',10),length('brickLength','Actual brick length',7.625,'in'),count('quantity','Bricks in the course',15,2)],
  formula:'Equal internal joint width = (finished course length − brick count × actual brick length) ÷ (brick count − 1).',
  assumptions:['One straight course with joints only between adjacent bricks.','Geometric fit is not permission to exceed the project-specified joint tolerance.'],
  sources:[cmhaLayout,cmhaConstruction],
  calculate(v){const j=(v.length-v.quantity*v.brickLength)/(v.quantity-1);requireCondition(j>=0,'quantity','The entered bricks are longer than the course even with zero joints.');return result([row('joint','Equal mortar joint width',j*12,'in'),row('mm','Equal mortar joint width',j/FT_PER_M*1000,'mm')],[`(${fmt(v.length*12)} − ${v.quantity} × ${fmt(v.brickLength*12)}) ÷ ${v.quantity-1} = ${fmt(j*12)} in.`]);}
};

// CMU / concrete-block models
function cmuTakeoff(v:Record<string,number>){const {gross,net}=netWall(v),t=unitTakeoff(net,v.blockLength,v.blockHeight,v.joint),ci=courseInfo(v.length,v.height,v.blockLength,v.blockHeight,v.joint),installed=roundUp(t.raw),order=roundUp(t.raw*waste(v));return {gross,net,t,ci,installed,order};}
const concreteBlock:Model={
  fields:[length('length','Wall length',20),length('height','Wall height',8),area('openings','Doors / windows',0,0),...blockDims,allowance,number('unitWeight','Block unit weight (lb)',35,0),price('USD/unit')],
  formula:'Net wall area ÷ installed CMU module face, rounded up; purchasing allowance then increases block order quantity.',
  assumptions:['Specified/actual block dimensions plus joint define the installed module. A nominal 8 × 8 × 16 in CMU is typically 7⅝ × 7⅝ × 15⅝ in specified with a ⅜ in joint.','Block weight varies by density, width and manufacturer; enter the product weight when logistics matter.','Special shapes, corners, bond beams, lintels and half units are separate.'],
  sources:blockSources,
  calculate(v,u){const x=cmuTakeoff(v);return result(withCost([row('order','Concrete blocks to order',x.order,'blocks',true),row('installed','Estimated installed blocks',x.installed,'blocks',true),row('courses','Gross wall courses',x.ci.courses,'courses',true),row('perCourse','Gross blocks per course',x.ci.grossPerCourse,'blocks',true),row('netArea','Net wall area',x.net,'ft²'),row('weight','Estimated block order weight',x.order*v.unitWeight,'lb')],v.price,u.price,{'USD/unit':x.order}),[`Net wall area = ${fmt(x.net)} ft².`,`Installed module = ${fmt((v.blockLength+v.joint)*12)} × ${fmt((v.blockHeight+v.joint)*12)} in.`,`Area quantity ${fmt(x.t.raw)}; allowance → ${x.order} blocks.`]);}
};

const cmuCalculator:Model={
  fields:[
    length('length','Wall length',20),length('height','Wall height',8),area('openings','Doors / windows',0,0),
    {id:'sizeMode',label:'Block face size',value:0,min:0,max:2,integer:true,dimension:'number',options:[{value:0,label:'Standard 8 × 16 nominal face'},{value:1,label:'Half 8 × 8 nominal face'},{value:2,label:'Custom specified face'}]},
    {...length('blockLength','Specified block length',15.625,'in'),visibleWhen:{field:'sizeMode',equals:2}},
    {...length('blockHeight','Specified block height',7.625,'in'),visibleWhen:{field:'sizeMode',equals:2}},
    positiveOrZero(length('joint','Mortar joint',0.375,'in')),allowance,number('unitWeight','Block unit weight (lb)',35,0),price('USD/unit')
  ],
  formula:'The selected nominal/custom CMU face becomes a specified face plus joint module; net wall area is divided by that module for block count.',
  assumptions:['Standard mode uses 15⅝ × 7⅝ in specified dimensions for a nominal 16 × 8 in face; half-block mode uses 7⅝ × 7⅝ in.','Custom mode expects specified/actual face dimensions, not nominal dimensions.','This is a quantity takeoff, not a wall structural design.'],
  sources:blockSources,
  calculate(v,u){const blockLength=Math.round(v.sizeMode)===0?15.625/12:Math.round(v.sizeMode)===1?7.625/12:v.blockLength;const blockHeight=Math.round(v.sizeMode)<=1?7.625/12:v.blockHeight;const vv={...v,blockLength,blockHeight};const x=cmuTakeoff(vv);return result(withCost([row('order','CMU blocks to order',x.order,'blocks',true),row('installed','Estimated installed CMU',x.installed,'blocks',true),row('courses','Gross wall courses',x.ci.courses,'courses',true),row('perCourse','Gross blocks per course',x.ci.grossPerCourse,'blocks',true),row('netArea','Net wall area',x.net,'ft²'),row('weight','Estimated block order weight',x.order*v.unitWeight,'lb')],v.price,u.price,{'USD/unit':x.order}),[`Selected specified face = ${fmt(blockLength*12)} × ${fmt(blockHeight*12)} in.`,`Net area ${fmt(x.net)} ft² gives ${fmt(x.t.raw)} blocks before allowance; order ${x.order}.`]);}
};

const cmuWall:Model={...concreteBlock,formula:'CMU wall layout reports gross courses/blocks-per-course while net opening-adjusted area controls estimated block quantity.',calculate(v,u){const x=cmuTakeoff(v);const openingUnits=Math.max(0,roundUp((x.gross-x.net)/x.t.face));return result(withCost([row('order','CMU blocks to order',x.order,'blocks',true),row('installed','Estimated installed blocks',x.installed,'blocks',true),row('courses','Gross wall courses',x.ci.courses,'courses',true),row('perCourse','Gross blocks per course',x.ci.grossPerCourse,'blocks',true),row('grossArea','Gross wall area',x.gross,'ft²'),row('netArea','Net wall area',x.net,'ft²'),row('openingUnits','Approximate blocks displaced by openings',openingUnits,'blocks',true),row('weight','Estimated order weight',x.order*v.unitWeight,'lb')],v.price,u.price,{'USD/unit':x.order}),[`Gross layout ≈ ${x.ci.courses} courses × ${x.ci.grossPerCourse} blocks/course.`,`Opening-adjusted area produces ${x.installed} installed blocks; allowance → ${x.order}.`]);}};
const cmuQuantity:Model={
  fields:[length('length','Wall length',20),length('height','Wall height',8),area('openings','Excluded area',0,0),length('blockLength','Specified block length',15.625,'in'),length('blockHeight','Specified block height',7.625,'in'),positiveOrZero(length('joint','Mortar joint',0.375,'in')),allowance],
  formula:'CMU quantity = net wall area ÷ installed module face; purchasing quantity rounds allowance-adjusted count up once.',
  assumptions:['Use specified block face dimensions plus joint.','Special units and layout cuts are separate from the area-based quantity.'],
  sources:blockSources,
  calculate(v){const vv={...v,blockDepth:0};const x=cmuTakeoff(vv);return result([row('order','CMU blocks to order',x.order,'blocks',true),row('installed','Estimated installed CMU',x.installed,'blocks',true),row('extra','Allowance / spare blocks',x.order-x.installed,'blocks',true),row('netArea','Net wall area',x.net,'ft²'),row('perArea','Blocks per square foot',1/x.t.face,'blocks/ft²')],[`${fmt(x.net)} ft² ÷ ${fmt(x.t.face)} = ${fmt(x.t.raw)} blocks.`,`Allowance → ${x.order} blocks.`]);}
};

const cmuCost:Model={
  fields:[...concreteBlock.fields.filter(f=>f.id!=='price'),{...price('USD/unit'),optional:false},number('blocksPerMortarBag','Installed blocks per mortar bag',13,0),number('mortarBagPrice','Mortar bag price (USD)',0,0),number('tax','Material tax (%)',0,0),number('delivery','Delivery / fixed material fee (USD)',0,0),number('labor','Labor / equipment allowance (USD)',0,0)],
  formula:'Block subtotal = order blocks × unit price. Mortar bags use entered blocks-per-bag coverage. Total adds mortar material, tax, delivery and labor.',
  assumptions:['Mortar coverage is user-entered and must match block size and bedding method.','Grout and reinforcement are separate unless already included in entered prices.','Labor is an entered allowance, not a productivity model.'],
  sources:[inchBlock,inchMortar,cmhaConstruction],
  calculate(v){const x=cmuTakeoff(v),bags=roundUp(x.installed/v.blocksPerMortarBag),blockMat=x.order*v.price,mortarMat=bags*v.mortarBagPrice,materials=blockMat+mortarMat,tax=materials*v.tax/100,total=materials+tax+v.delivery+v.labor;return result([row('total','Estimated entered-scope total',total,'USD'),row('order','CMU blocks to order',x.order,'blocks',true),row('mortarBags','Mortar bags',bags,'bags',true),row('blockMaterial','Block subtotal',blockMat,'USD'),row('mortarMaterial','Mortar subtotal',mortarMat,'USD'),row('materials','Material subtotal',materials,'USD'),row('tax','Material tax',tax,'USD'),row('delivery','Delivery / fixed fee',v.delivery,'USD'),row('labor','Labor / equipment',v.labor,'USD')],[`${x.order} blocks × $${fmt(v.price)} = $${fmt(blockMat)}.`,`ceil(${x.installed} ÷ ${fmt(v.blocksPerMortarBag)}) = ${bags} mortar bags.`,`Entered-scope total = $${fmt(total)}.`]);}
};
const concreteBlockWall:Model={...cmuWall};

const concreteBlockWeight:Model={
  fields:[count('quantity','Net block count',100,0),number('unitWeight','Block unit weight (lb)',35,0),allowance,positiveOrZero(count('palletCapacity','Blocks per pallet (0 = skip)',90,0))],
  formula:'Order blocks = ceil(net block count × allowance factor); order weight = order blocks × entered unit weight.',
  assumptions:['Use manufacturer block weight for the exact width, density class and unit shape.','Assembly weight including mortar, grout and reinforcement is not the same as bare block shipment weight.'],
  sources:[cmhaWeight],
  calculate(v){const order=roundUp(v.quantity*waste(v)),lb=order*v.unitWeight,pallets=v.palletCapacity>0?roundUp(order/v.palletCapacity):0;return result([row('order','Blocks including allowance',order,'blocks',true),row('weight','Estimated bare-block order weight',lb,'lb'),row('kg','Estimated bare-block order weight',lb*0.45359237,'kg'),row('tons','Estimated bare-block order weight',lb/2000,'US tons'),row('tonnes','Estimated bare-block order weight',lb*0.45359237/1000,'metric tonnes'),row('pallets','Estimated pallets',pallets,'pallets',true)],[`${v.quantity} × ${fmt(waste(v))} → ${order} blocks.`,`${order} × ${fmt(v.unitWeight)} lb = ${fmt(lb)} lb.`]);}
};

const cmuMortar:Model={
  fields:[
    {id:'mode',label:'Quantity source',value:0,min:0,max:1,integer:true,dimension:'number',options:[{value:0,label:'Known installed blocks'},{value:1,label:'Wall dimensions'}]},
    {...count('units','Installed blocks',113,0),visibleWhen:{field:'mode',equals:0}},
    {...length('length','Wall length',20),visibleWhen:{field:'mode',equals:1}},{...length('height','Wall height',8),visibleWhen:{field:'mode',equals:1}},{...area('openings','Excluded area',0,0),visibleWhen:{field:'mode',equals:1}},
    {...length('blockLength','Specified block length',15.625,'in'),visibleWhen:{field:'mode',equals:1}},{...length('blockHeight','Specified block height',7.625,'in'),visibleWhen:{field:'mode',equals:1}},{...positiveOrZero(length('joint','Mortar joint',0.375,'in')),visibleWhen:{field:'mode',equals:1}},
    number('coverage','Installed blocks per mortar bag',13,0,'Use product/manufacturer yield for the exact block size and bedding method.'),allowance,price('USD/bag')
  ],
  formula:'Installed blocks come from direct entry or wall module geometry. Mortar bags = ceil(installed blocks × allowance factor ÷ entered blocks-per-bag yield).',
  assumptions:['Blocks-per-bag coverage is user-entered because full-bed and face-shell bedding have different mortar usage.','Coverage must match the exact mortar bag size/product.','This estimates mortar joint material, not grout core fill.'],
  sources:[inchMortar,cmhaConstruction],
  calculate(v,u){let units;if(Math.round(v.mode)===0)units=v.units;else{const net=netWall(v).net;units=roundUp(unitTakeoff(net,v.blockLength,v.blockHeight,v.joint).raw);}const bags=roundUp(units*waste(v)/v.coverage);return result(withCost([row('bags','Mortar bags to order',bags,'bags',true),row('installed','Installed blocks used for estimate',units,'blocks',true),row('coverage','Entered mortar coverage',v.coverage,'blocks/bag')],v.price,u.price,{'USD/bag':bags}),[`Installed blocks = ${units}.`,`ceil(${units} × ${fmt(waste(v))} ÷ ${fmt(v.coverage)}) = ${bags} bags.`]);}
};

const cmuGrout:Model={
  fields:[
    count('groutedBlocks','Blocks receiving vertical grout',100,0),number('cellsPerBlock','Grouted cells per selected block',1,0),{...number('cellVolume','Grouted void volume per cell (ft³)',0.125,0),unit:'ft3',help:'Use manufacturer core/cell geometry for the exact CMU.'},
    positiveOrZero(length('bondBeamLength','Bond-beam / lintel grout length',0,'ft')),positiveOrZero(area('bondBeamArea','Net grout area of bond beam',0,0)),
    allowance,{...number('bagYield','Mixed grout yield per bag (ft³)',0.6,0),unit:'ft3'},price('USD/yd3',['USD/yd3','USD/bag'])
  ],
  formula:'Vertical core grout = grouted blocks × cells per block × cell volume. Bond-beam grout = length × net grout area. Order volume applies allowance once.',
  assumptions:['Enter core/cell void volume from the block manufacturer for cells actually filled.','Bond-beam area is net grout cross-sectional area, not gross block area.','Grout is core fill and is separate from mortar joints.'],
  sources:[omniFill,cmhaUnits],
  calculate(v,u){const vertical=v.groutedBlocks*v.cellsPerBlock*v.cellVolume,bond=v.bondBeamLength*v.bondBeamArea,net=vertical+bond,order=net*waste(v),bags=roundUp(order/v.bagYield),q:{[k:string]:number}={'USD/yd3':order/27,'USD/bag':bags};return result(withCost([row('order','Grout to order',order/27,'yd³'),row('ft3','Grout volume with allowance',order,'ft³'),row('m3','Grout volume with allowance',order/FT_PER_M**3,'m³'),row('bags','Bags at entered yield',bags,'bags',true),row('vertical','Vertical core grout before allowance',vertical,'ft³'),row('bondBeam','Bond-beam / lintel grout before allowance',bond,'ft³')],v.price,u.price,q),[`Vertical core grout = ${v.groutedBlocks} × ${fmt(v.cellsPerBlock)} × ${fmt(v.cellVolume)} = ${fmt(vertical)} ft³.`,`Bond-beam grout = ${fmt(v.bondBeamLength)} × ${fmt(v.bondBeamArea)} = ${fmt(bond)} ft³.`,`Allowance → ${fmt(order)} ft³ = ${fmt(order/27)} yd³.`]);}
};

const rebarWeights:Record<string,number>={'3':0.376,'4':0.668,'5':1.043,'6':1.502,'7':2.044,'8':2.67,'9':3.4,'10':4.303,'11':5.313};
const cmuReinforcement:Model={
  fields:[
    length('length','Wall length',20),length('height','Wall height',8),
    length('verticalSpacing','Maximum vertical-bar spacing along wall',4,'ft'),length('horizontalSpacing','Maximum horizontal reinforced-course spacing',4,'ft'),
    {id:'size',label:'US rebar size (#)',value:4,min:3,max:11,integer:true,dimension:'number',options:[3,4,5,6,7,8,9,10,11].map(n=>({value:n,label:'#'+n}))},
    count('verticalBarsPerCell','Bars at each vertical reinforced location',1,1),count('horizontalBarsPerCourse','Horizontal bars per reinforced course',1,1),
    allowance,price('USD/ft')
  ],
  formula:'Vertical locations = ceil(wall length / max spacing) + 1. Horizontal reinforced courses = ceil(wall height / max spacing) + 1. Total bar length combines vertical and horizontal runs.',
  assumptions:['Bar size, spacing, lap, anchorage and reinforced cells/courses come from the structural masonry design; this tool does not choose them.','Straight bar lengths equal wall height/length before allowance; hooks, development, dowels and lap lengths are separate unless included in allowance.','Nominal bar weight is used for material weight.'],
  sources:[cmhaUnits,cmhaConstruction],
  calculate(v,u){const wt=rebarWeights[String(v.size)];requireCondition(wt!==undefined,'size','Choose a listed US bar size from #3 through #11.');const vLoc=roundUp(v.length/v.verticalSpacing)+1,hRuns=roundUp(v.height/v.horizontalSpacing)+1,vertical=vLoc*v.verticalBarsPerCell*v.height,horizontal=hRuns*v.horizontalBarsPerCourse*v.length,net=vertical+horizontal,order=net*waste(v),lb=order*wt;return result(withCost([row('verticalLocations','Vertical reinforced locations',vLoc,'locations',true),row('horizontalRuns','Horizontal reinforced courses/runs',hRuns,'runs',true),row('verticalLength','Net vertical rebar length',vertical,'ft'),row('horizontalLength','Net horizontal rebar length',horizontal,'ft'),row('orderLength','Rebar length with allowance',order,'ft'),row('weight','Nominal rebar order weight',lb,'lb'),row('tons','Nominal rebar order weight',lb/2000,'US tons')],v.price,u.price,{'USD/ft':order}),[`Vertical: ceil(${fmt(v.length)} ÷ ${fmt(v.verticalSpacing)}) + 1 = ${vLoc} locations.`,`Horizontal: ceil(${fmt(v.height)} ÷ ${fmt(v.horizontalSpacing)}) + 1 = ${hRuns} reinforced runs.`,`Net steel ${fmt(net)} ft; allowance → ${fmt(order)} ft, ${fmt(lb)} lb.`]);}
};

export const masonryDedicatedModels:Record<string,Model>={
  'brick-general-dedicated':brickGeneral,
  'brick-wall-dedicated':brickWall,
  'brick-quantity-dedicated':brickQuantity,
  'brick-cost-dedicated':brickCost,
  'brick-mortar-dedicated':brickMortar,
  'brick-veneer-dedicated':brickVeneer,
  'brick-patio-dedicated':brickPatio,
  'brick-paver-dedicated':brickPaver,
  'masonry-general-dedicated':masonryGeneral,
  'masonry-wall-dedicated':masonryWall,
  'masonry-cost-dedicated':masonryCost,
  'masonry-block-dedicated':masonryBlock,
  'brick-weight-dedicated':brickWeight,
  'brick-waste-dedicated':brickWaste,
  'brick-joint-dedicated':brickJoint,
  'concrete-block-dedicated':concreteBlock,
  'cmu-general-dedicated':cmuCalculator,
  'cmu-wall-dedicated':cmuWall,
  'cmu-quantity-dedicated':cmuQuantity,
  'cmu-cost-dedicated':cmuCost,
  'concrete-block-wall-dedicated':concreteBlockWall,
  'concrete-block-weight-dedicated':concreteBlockWeight,
  'concrete-block-mortar-dedicated':cmuMortar,
  'cmu-grout-dedicated':cmuGrout,
  'cmu-reinforcement-dedicated':cmuReinforcement,
};
