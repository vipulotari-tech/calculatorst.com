import type { Field, Model } from './calculator-types.ts';
import {
  FT_PER_M, allowance, area, count, fmt, length, number, positiveOrZero,
  price, requireCondition, result, roundUp, row, waste, withCost,
} from './calculator-math.ts';
import { structureModels } from './models-structure.ts';
import { finishModels } from './models-finishes.ts';

const awc='https://awc.org/codes-standards/calculators-software/';
const inchFraming='https://www.inchcalculator.com/framing-calculator/';
const inchBoardFeet='https://www.inchcalculator.com/board-footage-calculator/';
const inchRoof='https://www.inchcalculator.com/roofing-calculator/';
const inchPitch='https://www.inchcalculator.com/roof-pitch-calculator/';
const inchRafter='https://www.inchcalculator.com/rafter-length-calculator/';
const calcNetTile='https://www.calculator.net/tile-calculator.html';
const omniTile='https://www.omnicalculator.com/construction/tile';
const omniFraming='https://www.omnicalculator.com/construction/framing';
const omniShingle='https://www.omnicalculator.com/construction/roof-shingle';

function netArea(v:Record<string,number>){
  const gross=v.length*v.width;
  const net=gross-(v.openings??0);
  requireCondition(net>=0,'openings','Excluded area cannot exceed the measured area.');
  return {gross,net};
}

function memberCountModel(label:string):Model{
  return {
    fields:[
      length('length','Distance across member layout',20,'ft'),
      length('spacing','Specified maximum on-center spacing',16,'in'),
      {...length('memberLength',`${label} length`,8,'ft'),optional:true},
      count('extra','Additional detail members',0,0),
      allowance,
      price('USD/unit',['USD/unit','USD/ft'])
    ],
    formula:'Base members = ceil(layout distance / maximum spacing) + 1; installed = base + detail members; purchasing quantity applies allowance once.',
    assumptions:[
      'Includes one member at each end of the layout. The final interval can be shorter than the maximum spacing.',
      'Spacing and member size come from the project design; this calculator performs quantity takeoff only.',
      'Additional detail members cover corners, openings, blocking or doubled members only when you explicitly enter them.'
    ],
    sources:[inchFraming,omniFraming],
    calculate(v,u){
      const base=roundUp(v.length/v.spacing)+1;
      const installed=base+v.extra;
      const order=roundUp(installed*waste(v));
      const memberLength=Number.isFinite(v.memberLength)?v.memberLength:0;
      requireCondition(!(Number.isFinite(v.price) && u.price==='USD/ft') || memberLength>0,'memberLength','Enter member length when pricing by linear foot.');
      const linear=order*memberLength;
      return result(withCost([
        row('order',`${label}s to order`,order,`${label.toLowerCase()}s`,true),
        row('installed',`Installed ${label.toLowerCase()}s`,installed,`${label.toLowerCase()}s`,true),
        row('base','Base layout members',base,'members',true),
        row('spacing','Equalized base-member spacing',v.length/(base-1)*12,'in'),
        row('linear','Purchased member length',linear,'ft')
      ],v.price,u.price,{'USD/unit':order,'USD/ft':linear}),[
        `ceil(${fmt(v.length)} ft ÷ ${fmt(v.spacing*12)} in) + 1 = ${base} base members.`,
        `${base} + ${v.extra} detail members = ${installed} installed; allowance → ${order} to purchase.`,
        memberLength>0?`${order} × ${fmt(memberLength)} ft = ${fmt(linear)} ft purchased length.`:'Member length not supplied; piece count is still valid.'
      ]);
    }
  };
}

function spacingModel(label:string):Model{
  return {
    fields:[
      length('length','Distance between end-member centers',20,'ft'),
      count('quantity',`Installed ${label.toLowerCase()}s`,16,2)
    ],
    formula:'Equal on-center spacing = distance between first and last member centers / (installed members − 1).',
    assumptions:[
      'Both end members are included in the entered count.',
      'This solves geometric spacing for a chosen count; it does not choose a code-compliant spacing or member size.'
    ],
    sources:[inchFraming],
    calculate(v){
      const sp=v.length/(v.quantity-1);
      return result([
        row('spacing','Equal on-center spacing',sp*12,'in'),
        row('mm','Equal on-center spacing',sp/FT_PER_M*1000,'mm'),
        row('intervals','Number of equal intervals',v.quantity-1,'intervals',true)
      ],[`${fmt(v.length)} ft ÷ (${v.quantity} − 1) = ${fmt(sp*12)} in on center.`]);
    }
  };
}

const framingGeneral:Model={
  fields:[
    length('length','Wall length',20,'ft'),
    length('height','Stud height',8,'ft'),
    length('spacing','Specified maximum stud spacing',16,'in'),
    count('extra','Extra studs for corners / openings',0,0),
    count('topPlates','Top plate layers',2,0),
    count('bottomPlates','Bottom plate layers',1,0),
    length('stockLength','Plate stock length',16,'ft'),
    allowance,
    price('USD/ft')
  ],
  formula:'Studs = ceil(wall length / spacing) + 1 + extras. Plate footage = wall length × plate layers. Total framing footage = studs × height + plates.',
  assumptions:[
    'Straight wall takeoff. Enter extra studs required by corners, intersections, openings, king/jack studs and local details from the plan.',
    'Stud spacing, header design and load path are design inputs, not selected by this calculator.',
    'Plate stock count is an equivalent count based on total plate footage; a real cut schedule can require more stock.'
  ],
  sources:[inchFraming,omniFraming],
  calculate(v,u){
    const base=roundUp(v.length/v.spacing)+1;
    const studs=base+v.extra;
    const studFeet=studs*v.height;
    const plateFeet=v.length*(v.topPlates+v.bottomPlates);
    const net=studFeet+plateFeet;
    const orderFeet=net*waste(v);
    const platePieces=roundUp(plateFeet*waste(v)/v.stockLength);
    const studOrder=roundUp(studs*waste(v));
    return result(withCost([
      row('studs','Installed studs',studs,'studs',true),
      row('studOrder','Studs including allowance',studOrder,'studs',true),
      row('plateFeet','Net plate length',plateFeet,'ft'),
      row('platePieces','Equivalent plate stock pieces',platePieces,'pieces',true),
      row('net','Net framing lumber',net,'ft'),
      row('order','Framing lumber with allowance',orderFeet,'ft')
    ],v.price,u.price,{'USD/ft':orderFeet}),[
      `ceil(${fmt(v.length)} ÷ ${fmt(v.spacing)}) + 1 = ${base} base studs; + ${v.extra} = ${studs}.`,
      `Stud footage ${fmt(studFeet)} + plate footage ${fmt(plateFeet)} = ${fmt(net)} ft.`,
      `Allowance → ${fmt(orderFeet)} ft; equivalent plate stock = ${platePieces} pieces.`
    ]);
  }
};

const wallFraming:Model={...structureModels.wallFraming,sources:[inchFraming,omniFraming]};

const lumberCost:Model={
  fields:[
    count('quantity','Net lumber pieces',20,0),
    length('pieceLength','Length per piece',8,'ft'),
    allowance,
    {...price('USD/unit',['USD/unit','USD/ft']),optional:false},
    number('tax','Material tax (%)',0,0),
    number('delivery','Delivery / fixed fee (USD)',0,0),
    number('labor','Labor / handling allowance (USD)',0,0)
  ],
  formula:'Order pieces = ceil(net pieces × allowance). Material cost uses the selected per-piece or per-foot quote, then tax, delivery and entered labor are added.',
  assumptions:['Use the actual supplier quote and stock length.','Labor is an entered allowance, not a productivity model.','Cut optimization and offcut reuse are not modeled.'],
  sources:[],
  calculate(v,u){
    const order=roundUp(v.quantity*waste(v));
    const feet=order*v.pieceLength;
    const material=(u.price==='USD/ft'?feet:order)*v.price;
    const tax=material*v.tax/100;
    const total=material+tax+v.delivery+v.labor;
    return result([
      row('total','Estimated entered-scope total',total,'USD'),
      row('order','Lumber pieces to order',order,'pieces',true),
      row('feet','Purchased lumber length',feet,'ft'),
      row('materials','Material subtotal',material,'USD'),
      row('tax','Material tax',tax,'USD'),
      row('delivery','Delivery / fixed fee',v.delivery,'USD'),
      row('labor','Labor / handling',v.labor,'USD')
    ],[
      `${v.quantity} net pieces × ${fmt(waste(v))} → ${order} pieces.`,
      `Material subtotal = $${fmt(material)}; entered-scope total = $${fmt(total)}.`
    ]);
  }
};

const boardFoot:Model={
  fields:[
    length('thickness','Board thickness used for pricing',2,'in'),
    length('width','Board width used for pricing',6,'in'),
    length('length','Board length',8,'ft'),
    count('quantity','Number of boards',10,0),
    allowance,
    { ...number('price','Price per board foot (USD)',0,0), optional:true, group:'Cost' }
  ],
  formula:'Board feet = thickness(in) × width(in) × length(ft) × board count / 12.',
  assumptions:['One board foot is 144 in³. Use nominal or actual dimensions consistently with the seller’s pricing convention.','Allowance applies to board-foot purchasing volume, not to installed piece count.'],
  sources:[inchBoardFeet],
  calculate(v,u){
    const per=(v.thickness*12)*(v.width*12)*v.length/12;
    const net=per*v.quantity;
    const order=net*waste(v);
    const rows=[
      row('order','Board feet including allowance',order,'board ft'),
      row('net','Net board feet',net,'board ft'),
      row('per','Board feet per board',per,'board ft'),
      row('linear','Net board length',v.quantity*v.length,'ft')
    ];
    if(Number.isFinite(v.price)) rows.push(row('cost','Estimated lumber cost',order*v.price,'USD'));
    return result(rows,[
      `${fmt(v.thickness*12)} in × ${fmt(v.width*12)} in × ${fmt(v.length)} ft ÷ 12 = ${fmt(per)} board ft/board.`,
      `${fmt(per)} × ${v.quantity} = ${fmt(net)} net board ft; allowance → ${fmt(order)}.`
    ]);
  }
};

const boardFootCost:Model={
  fields:[
    length('thickness','Board thickness used for pricing',2,'in'),
    length('width','Board width used for pricing',6,'in'),
    length('length','Board length',8,'ft'),
    count('quantity','Number of boards',10,0),
    allowance,
    number('price','Price per board foot (USD)',5,0),
    number('tax','Material tax (%)',0,0),
    number('delivery','Delivery / fixed fee (USD)',0,0)
  ],
  formula:'Order board feet = board geometry × count × allowance; material subtotal = order board feet × quoted price per board foot.',
  assumptions:['Price is explicitly per board foot.','Use the same nominal/actual dimension convention used by the seller.','Delivery and tax are entered separately.'],
  sources:[inchBoardFeet],
  calculate(v){
    const per=(v.thickness*12)*(v.width*12)*v.length/12;
    const net=per*v.quantity, order=net*waste(v);
    const material=order*v.price, tax=material*v.tax/100,total=material+tax+v.delivery;
    return result([
      row('total','Estimated material total',total,'USD'),
      row('boardFeet','Board feet including allowance',order,'board ft'),
      row('materials','Lumber subtotal',material,'USD'),
      row('tax','Material tax',tax,'USD'),
      row('delivery','Delivery / fixed fee',v.delivery,'USD')
    ],[
      `${fmt(order)} board ft × $${fmt(v.price)} = $${fmt(material)}.`,
      `Subtotal + tax + delivery = $${fmt(total)}.`
    ]);
  }
};

function roofSurface(v:Record<string,number>){
  const footprint=(v.length+2*v.overhang)*(v.width+2*v.overhang)*v.quantity;
  const mult=Math.hypot(1,v.pitch/12);
  return {footprint,mult,roof:footprint*mult};
}

const roofMeasureFields:Field[]=[
  {...number('mode','Roof measurement',0,0),max:1,integer:true,options:[
    {value:0,label:'Building footprint + pitch'},
    {value:1,label:'Known sloped roof area'}
  ]},
  {...length('length','Building length',40,'ft'),visibleWhen:{field:'mode',equals:0}},
  {...length('width','Building width',30,'ft'),visibleWhen:{field:'mode',equals:0}},
  {...number('pitch','Rise per 12 units of run',6,0),visibleWhen:{field:'mode',equals:0}},
  {...positiveOrZero(length('overhang','Horizontal overhang on all sides',1,'ft')),visibleWhen:{field:'mode',equals:0}},
  {...count('quantity','Identical roof sections',1),visibleWhen:{field:'mode',equals:0}},
  {...area('roofArea','Known sloped roof area',1500),visibleWhen:{field:'mode',equals:1}}
];

function measuredRoof(v:Record<string,number>){
  if(Math.round(v.mode)===1) return {roof:v.roofArea,footprint:NaN,mult:NaN};
  return roofSurface(v);
}

const roofingGeneral:Model={
  fields:[
    ...roofMeasureFields,
    area('shingleCoverage','Effective shingle package coverage',100/3),
    area('underlaymentCoverage','Net underlayment roll coverage',400),
    area('sheathingCoverage','Coverage per sheathing sheet',32),
    allowance,
    number('shinglePrice','Price per shingle package (USD)',0,0),
    number('underlaymentPrice','Price per underlayment roll (USD)',0,0),
    number('sheathingPrice','Price per sheathing sheet (USD)',0,0)
  ],
  formula:'Roof area comes from footprint × slope multiplier or known sloped area. Allowance-adjusted area is divided by each product’s effective coverage for whole package counts.',
  assumptions:[
    'Footprint mode assumes one uniform pitch and horizontal overhang. Split complex roofs into measured sections or use known sloped area.',
    'Effective coverage must come from the exact shingle, underlayment and sheathing products. Overlaps are not added again when already reflected in net coverage.',
    'Starter, ridge cap, flashing, fasteners, ice barrier and ventilation remain separate unless represented in your entered product coverages/prices.'
  ],
  sources:[inchRoof,omniShingle],
  calculate(v){
    const m=measuredRoof(v), order=m.roof*waste(v);
    const bundles=roundUp(order/v.shingleCoverage);
    const rolls=roundUp(order/v.underlaymentCoverage);
    const sheets=roundUp(order/v.sheathingCoverage);
    const total=bundles*v.shinglePrice+rolls*v.underlaymentPrice+sheets*v.sheathingPrice;
    return result([
      row('roof','Measured roof surface',m.roof,'ft²'),
      row('squares','Roofing squares with allowance',order/100,'squares'),
      row('bundles','Shingle packages to order',bundles,'packages',true),
      row('rolls','Underlayment rolls to order',rolls,'rolls',true),
      row('sheets','Sheathing sheets to order',sheets,'sheets',true),
      row('m2','Measured roof surface',m.roof/FT_PER_M**2,'m²'),
      row('cost','Entered material subtotal',total,'USD')
    ],[
      Math.round(v.mode)===1?`Known sloped roof area = ${fmt(m.roof)} ft².`:`Footprint × slope multiplier = ${fmt(m.roof)} ft².`,
      `Allowance-adjusted area = ${fmt(order)} ft² = ${fmt(order/100)} squares.`,
      `Packages: shingles ${bundles}, underlayment ${rolls}, sheathing ${sheets}.`
    ]);
  }
};

const roofAreaDetailed:Model={
  fields:[...roofMeasureFields,allowance],
  formula:'Measured roof surface comes from footprint × √(1 + (pitch/12)²) or a known sloped area; material area applies allowance separately.',
  assumptions:['Known-area mode expects true sloped roof surface area.','Footprint mode assumes one common pitch. Complex roofs should be split into non-overlapping sections.'],
  sources:[inchRoof],
  calculate(v){
    const m=measuredRoof(v),order=m.roof*waste(v);
    return result([
      row('roof','Measured roof surface',m.roof,'ft²'),
      row('order','Material area with allowance',order,'ft²'),
      row('squares','Roofing squares with allowance',order/100,'squares'),
      row('m2','Measured roof surface',m.roof/FT_PER_M**2,'m²'),
      row('multiplier','Roof slope multiplier',Math.round(v.mode)===0?m.mult:1,'×')
    ],[
      Math.round(v.mode)===1?`Entered sloped roof area = ${fmt(m.roof)} ft².`:`Slope multiplier = ${fmt(m.mult)}; roof surface = ${fmt(m.roof)} ft².`,
      `Material allowance → ${fmt(order)} ft².`
    ]);
  }
};

const roofPitch:Model={
  fields:[
    {...number('mode','Find pitch from',0,0),max:1,integer:true,options:[
      {value:0,label:'Rise and horizontal run'},
      {value:1,label:'Angle in degrees'}
    ]},
    {...positiveOrZero(length('rise','Vertical rise',6,'in')),visibleWhen:{field:'mode',equals:0}},
    {...length('run','Horizontal run',12,'in'),visibleWhen:{field:'mode',equals:0}},
    {...number('angleInput','Roof angle (degrees)',26.565,0),max:89.9,visibleWhen:{field:'mode',equals:1}}
  ],
  formula:'Slope = rise/run or tan(angle); pitch per 12 = 12 × slope; angle = atan(slope); multiplier = √(1+slope²).',
  assumptions:['Run is horizontal distance, not sloped rafter length.','This converts roof geometry only; material minimum-slope requirements depend on the roofing system and manufacturer instructions.'],
  sources:[inchPitch],
  calculate(v){
    const slope=Math.round(v.mode)===1?Math.tan(v.angleInput*Math.PI/180):v.rise/v.run;
    const angle=Math.atan(slope)*180/Math.PI;
    return result([
      row('pitch','Rise per 12 units of run',12*slope,':12'),
      row('angle','Angle above horizontal',angle,'°'),
      row('percent','Percent slope',slope*100,'%'),
      row('radians','Angle',angle*Math.PI/180,'rad'),
      row('multiplier','Roof surface multiplier',Math.hypot(1,slope),'×')
    ],[
      Math.round(v.mode)===1?`tan(${fmt(v.angleInput)}°) = ${fmt(slope)} slope.`:`${fmt(v.rise)} ÷ ${fmt(v.run)} = ${fmt(slope)} slope.`,
      `Pitch = ${fmt(12*slope)}:12; angle = ${fmt(angle)}°.`
    ]);
  }
};

const roofSlope:Model={...roofPitch,
  fields:[positiveOrZero(length('rise','Vertical rise',6,'in')),length('run','Horizontal run',12,'in')],
  calculate(v){
    const slope=v.rise/v.run,angle=Math.atan(slope)*180/Math.PI;
    return result([
      row('percent','Percent slope',slope*100,'%'),
      row('pitch','Rise per 12 units of run',12*slope,':12'),
      row('angle','Angle above horizontal',angle,'°'),
      row('multiplier','Roof surface multiplier',Math.hypot(1,slope),'×')
    ],[`${fmt(v.rise)} ÷ ${fmt(v.run)} = ${fmt(slope*100)}% slope = ${fmt(12*slope)}:12.`]);
  }
};

function roofPackageModel(label:string,coverageDefault:number):Model{
  return {
    fields:[...roofMeasureFields,area('coverage',`Effective coverage per ${label.toLowerCase()}`,coverageDefault),allowance,price('USD/unit')],
    formula:'Packages = ceil(measured roof area × allowance factor / effective package coverage).',
    assumptions:['Use manufacturer net coverage after required overlaps.','Complex roofs should use known measured sloped area or separate roof sections.'],
    sources:[inchRoof],
    calculate(v,u){
      const m=measuredRoof(v),order=m.roof*waste(v),packages=roundUp(order/v.coverage);
      return result(withCost([
        row('packages',`${label}s to order`,packages,label.toLowerCase()+'s',true),
        row('roof','Measured roof surface',m.roof,'ft²'),
        row('order','Required coverage with allowance',order,'ft²'),
        row('purchased','Purchased coverage',packages*v.coverage,'ft²')
      ],v.price,u.price,{'USD/unit':packages}),[
        `${fmt(m.roof)} × ${fmt(waste(v))} = ${fmt(order)} ft² required.`,
        `ceil(${fmt(order)} ÷ ${fmt(v.coverage)}) = ${packages} ${label.toLowerCase()}s.`
      ]);
    }
  };
}

const roofSheathing:Model={
  fields:[...roofMeasureFields,length('sheetLength','Sheet length',8,'ft'),length('sheetWidth','Sheet width',4,'ft'),allowance,price('USD/unit')],
  formula:'Sheathing sheets = ceil(roof surface × allowance factor / sheet area).',
  assumptions:['Area-based sheathing takeoff only; sheet orientation, panel-edge support, stagger, clips and offcut reuse are not optimized.','Panel thickness and span rating are project-design inputs.'],
  sources:[inchRoof],
  calculate(v,u){
    const m=measuredRoof(v),order=m.roof*waste(v),sheetArea=v.sheetLength*v.sheetWidth,sheets=roundUp(order/sheetArea);
    return result(withCost([
      row('sheets','Sheathing sheets to order',sheets,'sheets',true),
      row('roof','Measured roof surface',m.roof,'ft²'),
      row('sheetArea','Area per sheet',sheetArea,'ft²'),
      row('purchased','Purchased sheathing area',sheets*sheetArea,'ft²')
    ],v.price,u.price,{'USD/unit':sheets}),[
      `${fmt(v.sheetLength)} × ${fmt(v.sheetWidth)} = ${fmt(sheetArea)} ft²/sheet.`,
      `ceil(${fmt(order)} ÷ ${fmt(sheetArea)}) = ${sheets} sheets.`
    ]);
  }
};

const rafterLength:Model={
  fields:[
    length('span','Building width / full span',30,'ft'),
    number('pitch','Rise per 12 units of run',6,0),
    positiveOrZero(length('overhang','Horizontal eave overhang',1,'ft')),
    positiveOrZero(length('ridge','Ridge / beam thickness',0,'in'))
  ],
  formula:'Horizontal run = (building span − ridge thickness)/2 + overhang; line length = run × √(1+(pitch/12)²).',
  assumptions:['Symmetric gable/common-rafter geometry. Ridge/beam thickness is subtracted from the building span before halving.','Line length excludes birdsmouth, plumb-cut, tail-cut and stock-length allowances.','This does not size or approve the rafter structurally.'],
  sources:[inchRafter],
  calculate(v){
    const run=(v.span-v.ridge)/2+v.overhang;
    requireCondition(run>0,'span','Span and ridge dimensions must produce a positive horizontal rafter run.');
    const mult=Math.hypot(1,v.pitch/12),rise=run*v.pitch/12,l=run*mult;
    return result([
      row('length','Common rafter line length',l,'ft'),
      row('inches','Common rafter line length',l*12,'in'),
      row('meters','Common rafter line length',l/FT_PER_M,'m'),
      row('run','Horizontal run',run,'ft'),
      row('rise','Vertical rise over run',rise,'ft'),
      row('angle','Roof angle',Math.atan(v.pitch/12)*180/Math.PI,'°')
    ],[
      `Run = (${fmt(v.span)} − ${fmt(v.ridge)}) / 2 + ${fmt(v.overhang)} = ${fmt(run)} ft.`,
      `Rafter line = ${fmt(run)} × ${fmt(mult)} = ${fmt(l)} ft.`
    ]);
  }
};

const roofRafter:Model={
  fields:[
    length('span','Building width / full span',30,'ft'),
    length('buildingLength','Building length along ridge/eave',40,'ft'),
    number('pitch','Rise per 12 units of run',6,0),
    positiveOrZero(length('overhang','Horizontal eave overhang',1,'ft')),
    positiveOrZero(length('ridge','Ridge / beam thickness',0,'in')),
    length('spacing','Specified maximum rafter spacing',24,'in'),
    count('extraPairs','Additional rafter pairs for details',0,0),
    allowance,
    price('USD/unit')
  ],
  formula:'Rafter line length uses span/pitch geometry. Rafter pair locations = ceil(building length / maximum spacing)+1; total rafters = pair locations ×2 + extra pairs ×2.',
  assumptions:['Common rafters for a simple symmetric gable roof. Hips, valleys, jack rafters, dormers and trimmers are separate.','Rafter spacing and member size come from the structural design.','Purchasing allowance adds spare rafters after installed count.'],
  sources:[inchRafter],
  calculate(v,u){
    const run=(v.span-v.ridge)/2+v.overhang;
    requireCondition(run>0,'span','Span and ridge dimensions must produce a positive run.');
    const len=run*Math.hypot(1,v.pitch/12);
    const pairLocations=roundUp(v.buildingLength/v.spacing)+1;
    const installed=pairLocations*2+v.extraPairs*2;
    const order=roundUp(installed*waste(v));
    return result(withCost([
      row('order','Rafters to order',order,'rafters',true),
      row('installed','Installed common rafters',installed,'rafters',true),
      row('pairs','Base rafter-pair locations',pairLocations,'pairs',true),
      row('length','Common rafter line length',len,'ft'),
      row('linear','Purchased rafter length',order*len,'ft')
    ],v.price,u.price,{'USD/unit':order}),[
      `Common rafter line length = ${fmt(len)} ft.`,
      `ceil(${fmt(v.buildingLength)} ÷ ${fmt(v.spacing)}) + 1 = ${pairLocations} pair locations.`,
      `Installed rafters ${installed}; allowance → ${order}.`
    ]);
  }
};

const roofTruss:Model={
  fields:[length('length','Building length across truss layout',40,'ft'),length('spacing','Specified maximum truss spacing',24,'in'),count('extra','Additional trusses',0,0),allowance,price('USD/unit')],
  formula:'Base trusses = ceil(building length / maximum spacing)+1; order quantity adds entered detail trusses and purchasing allowance.',
  assumptions:['Truss spacing and truss design come from engineered truss documents. This is a quantity takeoff only.','Gable-end framing, girder trusses, valley sets and special trusses must be added explicitly.'],
  sources:[],
  calculate(v,u){
    const base=roundUp(v.length/v.spacing)+1,installed=base+v.extra,order=roundUp(installed*waste(v));
    return result(withCost([
      row('installed','Installed trusses',installed,'trusses',true),
      row('order','Trusses to order',order,'trusses',true),
      row('base','Base layout trusses',base,'trusses',true),
      row('spacing','Equalized base spacing',v.length/(base-1)*12,'in')
    ],v.price,u.price,{'USD/unit':order}),[
      `ceil(${fmt(v.length)} ÷ ${fmt(v.spacing)}) + 1 = ${base} base trusses.`,
      `Add ${v.extra} detail trusses; allowance → ${order}.`
    ]);
  }
};

const roofWaste:Model={
  fields:[area('area','Measured roof material area',1500),number('waste','Material allowance (%)',10,0)],
  formula:'Extra material = measured area × allowance%; total order area = measured area × (1 + allowance/100).',
  assumptions:['Allowance is a purchasing factor for cuts, breakage and complexity; use a project-specific value.','Do not apply this percentage again if another roofing calculator already includes the same allowance.'],
  sources:[inchRoof],
  calculate(v){
    const extra=v.area*v.waste/100,total=v.area+extra;
    return result([
      row('order','Total material area with allowance',total,'ft²'),
      row('extra','Extra material area',extra,'ft²'),
      row('squares','Total roofing squares',total/100,'squares'),
      row('m2','Total material area',total/FT_PER_M**2,'m²')
    ],[`${fmt(v.area)} × ${fmt(v.waste)}% = ${fmt(extra)} ft² extra; total = ${fmt(total)} ft².`]);
  }
};

function flooringCoverageModel(label:string,coverageDefault:number):Model{
  return {
    fields:[
      length('length','Room / project length',20,'ft'),
      length('width','Room / project width',12,'ft'),
      positiveOrZero(area('openings','Excluded floor area',0,0)),
      number('pattern','Pattern / layout allowance (%)',0,0),
      allowance,
      area('coverage',`Coverage per ${label.toLowerCase()} package`,coverageDefault),
      price('USD/unit',['USD/unit','USD/ft2','USD/m2'])
    ],
    formula:'Net area = length × width − excluded area. Pattern allowance and waste are applied separately, then order area is divided by package coverage.',
    assumptions:['Rectangular measured area. Split irregular rooms into non-overlapping sections and add them.','Pattern/layout allowance and waste are separate editable assumptions. Do not duplicate the same allowance in both fields.','Use the exact package coverage for the selected product.'],
    sources:[],
    calculate(v,u){
      const n=netArea(v),patternArea=n.net*(1+v.pattern/100),orderArea=patternArea*waste(v),packages=roundUp(orderArea/v.coverage),purchased=packages*v.coverage;
      return result(withCost([
        row('packages',`${label} packages to order`,packages,'packages',true),
        row('net','Net floor area',n.net,'ft²'),
        row('pattern','Area after pattern/layout allowance',patternArea,'ft²'),
        row('order','Required area after waste',orderArea,'ft²'),
        row('purchased','Purchased coverage',purchased,'ft²'),
        row('extra','Purchased area above net floor',purchased-n.net,'ft²')
      ],v.price,u.price,{'USD/unit':packages,'USD/ft2':purchased,'USD/m2':purchased/FT_PER_M**2}),[
        `${fmt(v.length)} × ${fmt(v.width)} − ${fmt(v.openings)} = ${fmt(n.net)} ft² net.`,
        `Pattern allowance → ${fmt(patternArea)} ft²; waste → ${fmt(orderArea)} ft².`,
        `ceil(${fmt(orderArea)} ÷ ${fmt(v.coverage)}) = ${packages} packages.`
      ]);
    }
  };
}

const flooringGeneral=flooringCoverageModel('Flooring',20);

function flooringCostModel(label:string):Model{
  return {
    fields:[
      area('area',`Net ${label.toLowerCase()} area`,240),
      number('pattern','Pattern / layout allowance (%)',0,0),
      allowance,
      {...price('USD/ft2',['USD/ft2','USD/m2']),optional:false},
      number('underlayment','Underlayment / pad cost (USD per ft²)',0,0),
      number('tax','Material tax (%)',0,0),
      number('delivery','Delivery / fixed fee (USD)',0,0),
      number('labor','Labor / installation allowance (USD)',0,0)
    ],
    formula:'Order area = net area × pattern factor × waste factor. Flooring material plus optional underlayment, tax, delivery and entered labor produce the entered-scope total.',
    assumptions:['Price is for material area, not package count.','Labor is user-entered; installation rates, demolition, trim and substrate repair are not inferred.','Avoid duplicating the same allowance in pattern and waste fields.'],
    sources:[],
    calculate(v,u){
      const order=v.area*(1+v.pattern/100)*waste(v);
      const material=(u.price==='USD/m2'?order/FT_PER_M**2:order)*v.price;
      const under=v.area*v.underlayment;
      const taxable=material+under,tax=taxable*v.tax/100,total=taxable+tax+v.delivery+v.labor;
      return result([
        row('total','Estimated entered-scope total',total,'USD'),
        row('order','Material area to purchase',order,'ft²'),
        row('materials',`${label} material subtotal`,material,'USD'),
        row('underlayment','Underlayment / pad subtotal (net area)',under,'USD'),
        row('tax','Material tax',tax,'USD'),
        row('delivery','Delivery / fixed fee',v.delivery,'USD'),
        row('labor','Labor / installation',v.labor,'USD')
      ],[
        `Order area = ${fmt(v.area)} × ${fmt(1+v.pattern/100)} × ${fmt(waste(v))} = ${fmt(order)} ft².`,
        `Entered-scope total = $${fmt(total)}.`
      ]);
    }
  };
}

const carpet=finishModels.carpet;
const carpetCost:Model={
  ...finishModels.carpet,
  fields:[...finishModels.carpet.fields.filter(f=>f.id!=='price'),{...price('USD/ft2',['USD/ft2','USD/m2']),optional:false,value:0},number('padPrice','Carpet pad price (USD/ft²)',0,0),number('tax','Material tax (%)',0,0),number('delivery','Delivery / fixed fee (USD)',0,0),number('labor','Labor / installation allowance (USD)',0,0)],
  calculate(v,u){
    const strips=roundUp(v.width/v.rollWidth),linear=strips*v.length*waste(v),bought=linear*v.rollWidth,net=v.length*v.width;
    const carpetMat=(u.price==='USD/m2'?bought/FT_PER_M**2:bought)*v.price;
    const pad=net*v.padPrice,tax=(carpetMat+pad)*v.tax/100,total=carpetMat+pad+tax+v.delivery+v.labor;
    return result([
      row('total','Estimated entered-scope total',total,'USD'),
      row('order','Roll area to buy',bought/9,'yd²'),
      row('linear','Linear roll length',linear,'ft'),
      row('strips','Full-width strips',strips,'strips',true),
      row('carpet','Carpet material subtotal',carpetMat,'USD'),
      row('pad','Pad subtotal',pad,'USD'),
      row('tax','Material tax',tax,'USD'),
      row('delivery','Delivery / fixed fee',v.delivery,'USD'),
      row('labor','Labor / installation',v.labor,'USD'),
      row('offcuts','Purchased carpet area above room area',bought-net,'ft²')
    ],[
      `ceil(${fmt(v.width)} ÷ ${fmt(v.rollWidth)}) = ${strips} strips.`,
      `Purchased carpet area = ${fmt(bought)} ft²; entered-scope total = $${fmt(total)}.`
    ]);
  }
};

function tileValues(v:Record<string,number>){
  const net=Math.round(v.mode)===1?v.area:v.length*v.width;
  const moduleL=v.tileLength+v.joint,moduleW=v.tileWidth+v.joint;
  const tileArea=v.tileLength*v.tileWidth;
  const straight=roundUp(net/tileArea);
  const rows=Math.round(v.mode)===0?roundUp((v.width+v.joint)/moduleW):0;
  const cols=Math.round(v.mode)===0?roundUp((v.length+v.joint)/moduleL):0;
  const layout=Math.round(v.mode)===0?rows*cols:straight;
  return {net,tileArea,rows,cols,base:Math.max(straight,layout)};
}

const tileQuantity:Model={
  fields:[
    {...number('mode','Surface measurement',0,0),max:1,integer:true,options:[{value:0,label:'Length × width'},{value:1,label:'Known area'}]},
    {...length('length','Surface length',12,'ft'),visibleWhen:{field:'mode',equals:0}},
    {...length('width','Surface width',10,'ft'),visibleWhen:{field:'mode',equals:0}},
    {...area('area','Known surface area',120),visibleWhen:{field:'mode',equals:1}},
    length('tileLength','Tile length',12,'in'),length('tileWidth','Tile width',12,'in'),
    positiveOrZero(length('joint','Grout joint',0.125,'in')),
    count('tilesPerBox','Tiles per box',10,1),
    allowance
  ],
  formula:'Tile count uses tile face area and, in rectangular-dimension mode, a conservative full-row/full-column layout. Boxes = ceil(order tiles / tiles per box).',
  assumptions:['Straight rectangular layout. Diagonal, herringbone, running-bond and patterned layouts may need additional allowance.','Dimension mode does not reuse edge offcuts. Known-area mode is area-based and cannot model row/column cuts.'],
  sources:[calcNetTile,omniTile],
  calculate(v){
    const t=tileValues(v),order=roundUp(t.base*waste(v)),boxes=roundUp(order/v.tilesPerBox);
    return result([
      row('tiles','Tiles to order',order,'tiles',true),
      row('boxes','Boxes to order',boxes,'boxes',true),
      row('base','Base tile quantity',t.base,'tiles',true),
      row('area','Surface area',t.net,'ft²'),
      row('rows','Layout rows',t.rows,'rows',true),
      row('columns','Layout columns',t.cols,'columns',true)
    ],[
      `Base tile quantity = ${t.base}; allowance → ${order} tiles.`,
      `ceil(${order} ÷ ${v.tilesPerBox}) = ${boxes} boxes.`
    ]);
  }
};

const tileGeneral:Model={
  ...tileQuantity,
  fields:[...tileQuantity.fields,price('USD/unit',['USD/unit','USD/ft2','USD/m2'])],
  calculate(v,u){
    const t=tileValues(v),order=roundUp(t.base*waste(v)),boxes=roundUp(order/v.tilesPerBox);
    const purchasedTiles=boxes*v.tilesPerBox;
    const purchasedArea=purchasedTiles*t.tileArea;
    const rows=[
      row('tiles','Tiles to order',order,'tiles',true),
      row('boxes','Boxes to order',boxes,'boxes',true),
      row('area','Surface area',t.net,'ft²'),
      row('purchasedTiles','Tiles purchased in whole boxes',purchasedTiles,'tiles',true),
      row('purchased','Purchased tile face area',purchasedArea,'ft²'),
      row('rows','Layout rows',t.rows,'rows',true),
      row('columns','Layout columns',t.cols,'columns',true)
    ];
    const steps=[`Base quantity ${t.base}; allowance → ${order} tiles = ${boxes} boxes.`];
    if(Number.isFinite(v.price)){
      const cost=(u.price==='USD/ft2'?purchasedArea:u.price==='USD/m2'?purchasedArea/FT_PER_M**2:boxes)*v.price;
      rows.push(row('cost','Estimated tile material cost',cost,'USD'));
      steps.push(`Material cost = ${fmt(cost)}.`);
    }
    return result(rows,steps);
  }
};

const tileCost:Model={
  fields:[
    area('area','Net tiled area',120),
    length('tileLength','Tile length',12,'in'),length('tileWidth','Tile width',12,'in'),
    count('tilesPerBox','Tiles per box',10,1),
    allowance,
    {...price('USD/unit',['USD/unit','USD/ft2','USD/m2']),optional:false},
    number('tax','Material tax (%)',0,0),number('delivery','Delivery / fixed fee (USD)',0,0),number('labor','Labor / installation allowance (USD)',0,0)
  ],
  formula:'Area-based tile count = ceil(net area / tile face area × allowance); boxes = ceil(tiles / tiles per box); material price can be per box or square foot.',
  assumptions:['Area-based cost estimate; it does not optimize edge cuts or layout direction.','Labor, substrate repair, grout and adhesive are separate unless entered elsewhere.'],
  sources:[calcNetTile,omniTile],
  calculate(v,u){
    const tileArea=v.tileLength*v.tileWidth,tiles=roundUp(v.area/tileArea*waste(v)),boxes=roundUp(tiles/v.tilesPerBox);
    const purchasedTiles=boxes*v.tilesPerBox,purchased=purchasedTiles*tileArea;
    const material=(u.price==='USD/ft2'?purchased:u.price==='USD/m2'?purchased/FT_PER_M**2:boxes)*v.price,tax=material*v.tax/100,total=material+tax+v.delivery+v.labor;
    return result([
      row('total','Estimated entered-scope total',total,'USD'),
      row('tiles','Required tiles before box rounding',tiles,'tiles',true),row('boxes','Boxes to order',boxes,'boxes',true),
      row('purchasedTiles','Tiles purchased in whole boxes',purchasedTiles,'tiles',true),row('purchased','Purchased tile face area',purchased,'ft²'),
      row('materials','Tile material subtotal',material,'USD'),row('tax','Material tax',tax,'USD'),row('delivery','Delivery',v.delivery,'USD'),row('labor','Labor / installation',v.labor,'USD')
    ],[`${fmt(v.area)} ft² → ${tiles} tiles / ${boxes} boxes; total = $${fmt(total)}.`]);
  }
};

const adhesive:Model={
  fields:[length('length','Surface length',12,'ft'),length('width','Surface width',10,'ft'),positiveOrZero(area('openings','Excluded area',0,0)),area('coverage','Manufacturer coverage per bag / pail',50),allowance,price('USD/unit')],
  formula:'Containers = ceil(net tiled area × allowance factor / manufacturer coverage per bag or pail).',
  assumptions:['Coverage depends on trowel notch, tile size, substrate flatness and product. Enter manufacturer coverage for the actual installation.','This estimates adhesive containers only; grout is separate.'],
  sources:[],
  calculate(v,u){
    const n=netArea(v),order=n.net*waste(v),bags=roundUp(order/v.coverage);
    return result(withCost([
      row('bags','Adhesive bags / pails to order',bags,'containers',true),row('area','Net tiled area',n.net,'ft²'),row('order','Coverage with allowance',order,'ft²')
    ],v.price,u.price,{'USD/unit':bags}),[`ceil(${fmt(order)} ÷ ${fmt(v.coverage)}) = ${bags} containers.`]);
  }
};

const floorWaste:Model={
  fields:[area('area','Net flooring area',240),number('pattern','Pattern / layout allowance (%)',0,0),number('waste','Cut / damage allowance (%)',10,0)],
  formula:'Pattern-adjusted area = net × (1+pattern%); final order area = pattern-adjusted × (1+waste%).',
  assumptions:['Pattern/layout and cut/damage allowances are kept separate to avoid hiding assumptions.','Use project-specific allowances; room shape and product dimensions affect offcuts.'],
  sources:[],
  calculate(v){
    const pattern=v.area*(1+v.pattern/100),order=pattern*(1+v.waste/100);
    return result([
      row('order','Total flooring area to purchase',order,'ft²'),row('pattern','Area after pattern allowance',pattern,'ft²'),row('extra','Total extra above net area',order-v.area,'ft²'),row('percent','Effective total allowance',(order/v.area-1)*100,'%')
    ],[`${fmt(v.area)} × ${fmt(1+v.pattern/100)} × ${fmt(1+v.waste/100)} = ${fmt(order)} ft².`]);
  }
};

const underlayment:Model={
  fields:[length('length','Floor length',20,'ft'),length('width','Floor width',12,'ft'),positiveOrZero(area('openings','Excluded area',0,0)),area('coverage','Net coverage per roll / package',100),allowance,price('USD/unit')],
  formula:'Packages = ceil(net floor area × allowance factor / manufacturer net package coverage).',
  assumptions:['Use net package coverage after required overlaps.','Seam layout and partial-roll reuse are not optimized.'],
  sources:[],
  calculate(v,u){
    const n=netArea(v),order=n.net*waste(v),packages=roundUp(order/v.coverage);
    return result(withCost([
      row('packages','Underlayment packages to order',packages,'packages',true),row('area','Net floor area',n.net,'ft²'),row('order','Coverage with allowance',order,'ft²'),row('purchased','Purchased coverage',packages*v.coverage,'ft²')
    ],v.price,u.price,{'USD/unit':packages}),[`ceil(${fmt(order)} ÷ ${fmt(v.coverage)}) = ${packages} packages.`]);
  }
};

export const framingRoofingFlooringModels:Record<string,Model>={
  'framing-general-dedicated':framingGeneral,
  'wall-framing-dedicated':wallFraming,
  'stud-count-dedicated':memberCountModel('Stud'),
  'stud-spacing-dedicated':spacingModel('Stud'),
  'lumber-count-dedicated':memberCountModel('Lumber piece'),
  'lumber-cost-dedicated':lumberCost,
  'board-foot-dedicated':boardFoot,
  'board-foot-cost-dedicated':boardFootCost,
  'joist-count-dedicated':memberCountModel('Joist'),
  'joist-spacing-dedicated':spacingModel('Joist'),
  'floor-joist-dedicated':memberCountModel('Floor joist'),
  'ceiling-joist-dedicated':memberCountModel('Ceiling joist'),
  'header-analysis-dedicated':structureModels.header,
  'beam-analysis-dedicated':structureModels.beam,
  'beam-load-dedicated':structureModels['beam-load'],

  'roofing-general-dedicated':roofingGeneral,
  'roof-area-dedicated':roofAreaDetailed,
  'roof-pitch-dedicated':roofPitch,
  'roof-slope-dedicated':roofSlope,
  'roofing-shingle-dedicated':structureModels.shingleEstimate,
  'shingle-quantity-dedicated':structureModels.shingleQuantity,
  'shingle-cost-dedicated':structureModels.shingleCost,
  'roofing-material-dedicated':roofPackageModel('Package',100/3),
  'roofing-underlayment-dedicated':roofPackageModel('Roll',400),
  'roof-sheathing-dedicated':roofSheathing,
  'roof-rafter-dedicated':roofRafter,
  'rafter-length-dedicated':rafterLength,
  'roof-truss-dedicated':roofTruss,
  'roof-flashing-dedicated':structureModels.flashing,
  'roof-waste-dedicated':roofWaste,

  'flooring-general-dedicated':flooringGeneral,
  'flooring-cost-dedicated':flooringCostModel('Flooring'),
  'hardwood-flooring-dedicated':flooringCoverageModel('Hardwood',20),
  'hardwood-flooring-cost-dedicated':flooringCostModel('Hardwood'),
  'laminate-flooring-dedicated':flooringCoverageModel('Laminate',20),
  'vinyl-flooring-dedicated':flooringCoverageModel('Vinyl',20),
  'carpet-dedicated':carpet,
  'carpet-cost-dedicated':carpetCost,
  'tile-dedicated':tileGeneral,
  'tile-quantity-dedicated':tileQuantity,
  'tile-cost-dedicated':tileCost,
  'tile-grout-dedicated':finishModels.jointFill,
  'tile-adhesive-dedicated':adhesive,
  'flooring-waste-dedicated':floorWaste,
  'underlayment-dedicated':underlayment
};
