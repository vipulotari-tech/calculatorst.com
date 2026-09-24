import type { Field, Model } from './calculator-types.ts';
import { FT_PER_M, allowance, area, count, fmt, length, number, positiveOrZero, price, rectangle, requireCondition, result, roundUp, row, volume, waste, withCost } from './calculator-math.ts';
const crsi='https://www.crsi.org/reinforcing-basics/reinforcing-steel/splicing-bars/lap-splices/';
const awc='https://awc.org/wp-content/uploads/2021/12/AWC-DA6-BeamFormulas-0710.pdf';
const barWeights:Record<string,number>={'3':0.376,'4':0.668,'5':1.043,'6':1.502,'7':2.044,'8':2.67,'9':3.4,'10':4.303,'11':5.313};
const size: Field = { ...number('size', 'US rebar size (#)', 4, 3, 'Use a listed US bar designation; metric bars with similar names may have different mass.'), max: 11, integer: true };
function barWeight(size:number){requireCondition(barWeights[String(size)]!==undefined,'size','Choose a whole US rebar size from #3 through #11.');return barWeights[String(size)];}
const grid:Model={fields:[...rectangle,positiveOrZero(length('cover','Edge offset to bar center',2,'in')),length('spacing','Maximum bar spacing',16,'in'),size,allowance,price('USD/ft')],formula:'Usable dimensions = slab dimensions − 2 × centerline offset; bars across each direction = ceil(usable distance / maximum spacing) + 1; length = sum(count × perpendicular length).',assumptions:['The edge offset is measured to the center of the bar, not its outside surface. Use plans to convert specified clear cover.','A single orthogonal mat with bars at both usable edges. No bends, hooks, lap splices or second layer are included.','Spacing and bar size come from the design; this is a takeoff, not reinforcement design.'],sources:[crsi,'https://www.inchcalculator.com/rebar-material-calculator/'],calculate(v,u){const l=v.length-2*v.cover,w=v.width-2*v.cover;requireCondition(l>0&&w>0,'cover','Twice the edge offset must be smaller than both slab dimensions.');const acrossL=roundUp(l/v.spacing)+1,acrossW=roundUp(w/v.spacing)+1,total=acrossL*w+acrossW*l,order=total*waste(v),lb=order*barWeight(v.size);const actualL=acrossL>1?l/(acrossL-1)*12:NaN,actualW=acrossW>1?w/(acrossW-1)*12:NaN;return result(withCost([row('bars','Installed bars in both directions',acrossL+acrossW,'bars',true),row('length','Total cut length',total,'ft'),row('order','Length including allowance',order,'ft'),row('weight','Estimated order weight (lb)',lb,'lb'),row('acrossL','Bars spanning width',acrossL,'bars',true),row('acrossW','Bars spanning length',acrossW,'bars',true),row('actualL','Actual spacing along length',actualL,'in'),row('actualW','Actual spacing along width',actualW,'in')],v.price,u.price,{'USD/ft':order}),[`Usable area: ${fmt(l)} × ${fmt(w)} ft.`,`Bar counts: ceil(${fmt(l)} / ${fmt(v.spacing)}) + 1 = ${acrossL}; perpendicular direction = ${acrossW}.`,`Total cut length: ${acrossL} × ${fmt(w)} + ${acrossW} × ${fmt(l)} = ${fmt(total)} ft.`,`Equalized actual spacing stays at or below the ${fmt(v.spacing)} in maximum: ${fmt(actualL)} in along length, ${fmt(actualW)} in along width.`]);}};
const spaced:Model={fields:[length('length','Distance across layout',20),length('spacing','Maximum center spacing',16,'in'),count('extra','Additional pieces for details',0,0),allowance,price('USD/unit')],formula:'Installed pieces = ceil(layout distance / maximum spacing) + 1 + extra pieces.',assumptions:['Includes one member at each end; the last interval may be shorter.','Layout distance is measured across the members, not the unsupported span along a member. Add corners, headers and opening details from the plan.','Stock allowance adds spare material, not extra installed members. This does not select a code-compliant spacing or span.'],sources:[],calculate(v,u){const base=roundUp(v.length/v.spacing)+1,n=base+v.extra,order=roundUp(n*waste(v));return result(withCost([row('installed','Installed pieces',n,'pieces',true),row('order','Pieces including spares',order,'pieces',true),row('interval','Equalized center spacing',v.length/(base-1)*12,'in')],v.price,u.price,{'USD/unit':order}),[`ceil(${fmt(v.length)} ft ÷ ${fmt(v.spacing)} ft) + 1 = ${base}.`,`Add ${v.extra} detail pieces, then ${fmt(v.waste)}% purchasing allowance.`]);}};
const spacing:Model={fields:[length('length','Distance between end-member centers',20),count('quantity','Number of installed members',16,2)],formula:'Equal center spacing = distance between end centers / (member count − 1).',assumptions:['Both end members are counted. This solves geometry for a chosen count; it does not choose a permitted maximum spacing.'],sources:[],calculate(v){const sp=v.length/(v.quantity-1);return result([row('spacing','Equal center spacing (in)',sp*12,'in'),row('mm','Equal center spacing (mm)',sp/FT_PER_M*1000,'mm')],[`${fmt(v.length)} ft ÷ (${v.quantity} − 1) = ${fmt(sp)} ft.`]);}};
const roofFields=[length('length','Building length',40),length('width','Building width',30),number('pitch','Rise per 12 units of run',6,0),positiveOrZero(length('overhang','Horizontal overhang on all sides',1)),count('quantity','Identical roof sections',1),allowance];
function roofValues(v:Record<string,number>){const footprint=(v.length+2*v.overhang)*(v.width+2*v.overhang)*v.quantity,mult=Math.hypot(1,v.pitch/12);return {footprint,mult,roof:footprint*mult,order:footprint*mult*waste(v)};}
const roofArea:Model={fields:roofFields,formula:'Roof surface = (length + 2 × overhang) × (width + 2 × overhang) × √(1 + (pitch / 12)²) × sections.',assumptions:['Use the horizontal building footprint and a single common pitch. The same factor works for a simple gable or hip roof with uniform pitch.','Complex roofs need non-overlapping sections; valleys, dormers and differing slopes require separate measurements.','Overhang is a horizontal distance on each side. Allowance is material waste, not an increase in physical roof area.'],sources:[],calculate(v){const r=roofValues(v);return result([row('roof','Measured roof surface',r.roof,'ft²'),row('order','Material area with allowance',r.order,'ft²'),row('squares','Roofing squares with allowance',r.order/100,'squares'),row('m2','Measured roof surface',r.roof/FT_PER_M**2,'m²')],[`Footprint including overhang: ${fmt(r.footprint)} ft².`,`Pitch multiplier: √(1 + (${v.pitch}/12)²) = ${fmt(r.mult)}.`,`${fmt(r.footprint)} × ${fmt(r.mult)} = ${fmt(r.roof)} ft²; purchasing area = ${fmt(r.order)} ft².`]);}};
const roofCover:Model={...roofArea,fields:[...roofFields,{...area('coverage','Effective coverage per package',100/3),group:'Material & assumptions',help:'Use the manufacturer’s net coverage after required overlaps. Bundles, sheets and rolls have different coverage.'},price('USD/unit')],formula:roofArea.formula+' Packages = ceil(roof surface × allowance factor / effective package coverage).',calculate(v,u){const r=roofValues(v),n=roundUp(r.order/v.coverage);const base=roofArea.calculate(v,u);return result(withCost([row('packages','Packages to order',n,'packages',true),...base.rows],v.price,u.price,{'USD/unit':n}),[...base.steps,`Round ${fmt(r.order)} ÷ ${fmt(v.coverage)} up = ${n} packages.`]);}};
const rafter:Model={fields:[length('span','Building span (full width)',30),number('pitch','Rise per 12 units of run',6,0),positiveOrZero(length('overhang','Horizontal eave overhang',1))],formula:'Common rafter line length = (span / 2 + overhang) × √(1 + (pitch / 12)²).',assumptions:['Symmetric gable geometry measured along the roof slope. Does not include ridge-board deduction, birdsmouth cuts, plumb-cut allowance or lumber stock allowance.','A line length is not a rafter size, span approval, hip/valley rafter length or truss design.'],sources:[],calculate(v){const run=v.span/2+v.overhang,rise=run*v.pitch/12,l=Math.hypot(run,rise);return result([row('length','Common rafter line length',l,'ft'),row('meters','Common rafter line length',l/FT_PER_M,'m'),row('rise','Rise including overhang projection',rise,'ft')],[`Horizontal run: ${fmt(v.span)} / 2 + ${fmt(v.overhang)} = ${fmt(run)} ft.`,`√(${fmt(run)}² + ${fmt(rise)}²) = ${fmt(l)} ft.`]);}};
const beamFields=[
  { ...number('case','Support / load case',0,0), integer:true, max:3, options:[
    {value:0,label:'Simply supported — full-span uniform load'},
    {value:1,label:'Simply supported — center point load'},
    {value:2,label:'Cantilever — full-span uniform load'},
    {value:3,label:'Cantilever — end point load'},
  ]},
  length('span','Beam span / cantilever length',10),
  { ...number('load','Uniform line load (lb/ft)',100,0), visibleWhen:{field:'case',in:[0,2]}, help:'Full-span uniformly distributed service load. Include beam self-weight when it belongs in the load case.' },
  { ...number('pointLoad','Point load (lb)',1000,0), visibleWhen:{field:'case',in:[1,3]}, help:'Single point load at midspan for the simply supported case or at the free end for the cantilever case.' },
  number('modulus','Elastic modulus E (psi)',1600000),
  number('inertia','Second moment of area I (in⁴)',100)
];
const beam:Model={
  fields:beamFields,
  formula:'Choose one idealized case. Simply supported UDL: R=wL/2, Mmax=wL²/8, δmax=5wL⁴/(384EI). Center point: R=P/2, Mmax=PL/4, δmax=PL³/(48EI). Cantilever UDL: R=wL, Mmax=wL²/2, δfree=wL⁴/(8EI). Cantilever end point: R=P, Mmax=PL, δfree=PL³/(3EI).',
  assumptions:[
    'Idealized prismatic, linearly elastic beam with constant E and I. Uniform-load cases act over the full span; point-load cases are exactly at midspan or the cantilever free end.',
    'Outputs are elastic analysis demands only. This calculator does not select a member, calculate allowable capacity, check shear/bearing/buckling/connections, apply code load combinations or certify a safe design.',
    'Elastic modulus and section moment of inertia must describe the actual member and axis being analyzed. Deflection formulas assume small deformation.'
  ],
  sources:[awc],
  calculate(v){
    const mode=Math.round(v.case);
    const Lin=v.span*12;
    let reaction:number,moment:number,deflection:number,total:number,maxShear:number;
    let steps:string[];
    if(mode===0){
      const w=v.load;
      reaction=w*v.span/2; maxShear=reaction; moment=w*v.span**2/8; total=w*v.span;
      deflection=5*(w/12)*Lin**4/(384*v.modulus*v.inertia);
      steps=[
        `Simply supported UDL: reaction = ${fmt(w)} × ${fmt(v.span)} / 2 = ${fmt(reaction)} lb at each support.`,
        `Maximum moment = wL²/8 = ${fmt(moment)} lb·ft at midspan.`,
        `Maximum deflection = 5wL⁴/(384EI) = ${fmt(deflection)} in at midspan.`
      ];
    }else if(mode===1){
      const P=v.pointLoad;
      reaction=P/2; maxShear=reaction; moment=P*v.span/4; total=P;
      deflection=P*Lin**3/(48*v.modulus*v.inertia);
      steps=[
        `Simply supported center point load: reaction = ${fmt(P)} / 2 = ${fmt(reaction)} lb at each support.`,
        `Maximum moment = PL/4 = ${fmt(moment)} lb·ft at midspan.`,
        `Maximum deflection = PL³/(48EI) = ${fmt(deflection)} in at midspan.`
      ];
    }else if(mode===2){
      const w=v.load;
      reaction=w*v.span; maxShear=reaction; moment=w*v.span**2/2; total=w*v.span;
      deflection=(w/12)*Lin**4/(8*v.modulus*v.inertia);
      steps=[
        `Cantilever UDL: fixed-support vertical reaction = wL = ${fmt(reaction)} lb.`,
        `Maximum fixed-end moment = wL²/2 = ${fmt(moment)} lb·ft.`,
        `Free-end deflection = wL⁴/(8EI) = ${fmt(deflection)} in.`
      ];
    }else{
      const P=v.pointLoad;
      reaction=P; maxShear=P; moment=P*v.span; total=P;
      deflection=P*Lin**3/(3*v.modulus*v.inertia);
      steps=[
        `Cantilever end point load: fixed-support vertical reaction = ${fmt(reaction)} lb.`,
        `Maximum fixed-end moment = PL = ${fmt(moment)} lb·ft.`,
        `Free-end deflection = PL³/(3EI) = ${fmt(deflection)} in.`
      ];
    }
    return result([
      row('moment','Maximum bending moment',moment,'lb·ft'),
      row('reaction',mode<2?'Vertical reaction per support':'Fixed-support vertical reaction',reaction,'lb'),
      row('shear','Maximum shear magnitude',maxShear,'lb'),
      row('deflection',mode<2?'Maximum elastic deflection':'Free-end elastic deflection',deflection,'in'),
      row('total','Total applied vertical load',total,'lb')
    ],steps);
  }
};
const excavation:Model={fields:[...rectangle,length('depth','Excavation depth',4),{...number('swell','Loose-volume increase (swell)',20,0,'Site-specific example. 20% means 1 bank yd³ becomes 1.2 loose yd³.'),max:200,unit:'%'},price('USD/yd3')],formula:'Bank volume = length × width × depth; loose volume = bank volume × (1 + swell / 100).',assumptions:['Vertical rectangular excavation. Sloped sides, working room, overbreak and irregular ground need separate measured allowances.','The cost basis is bank cubic yards. Loose haulage volumes are shown separately. Swell is not a second waste allowance.'],sources:['https://www.fhwa.dot.gov/construction/'],calculate(v,u){const bank=v.length*v.width*v.depth,loose=bank*(1+v.swell/100);return result(withCost([row('bank','In-place (bank) volume',bank/27,'yd³'),row('loose','Loose haulage volume',loose/27,'yd³'),row('m3','Bank volume',bank/FT_PER_M**3,'m³')],v.price,u.price,{'USD/yd3':bank/27}),[`${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} / 27 = ${fmt(bank/27)} bank yd³.`,`${fmt(bank/27)} × ${fmt(1+v.swell/100)} = ${fmt(loose/27)} loose yd³.`]);}};

const excavationCost: Model = {
  fields: [
    ...rectangle,
    length('depth','Excavation depth',4),
    { ...number('swell','Loose-volume increase (swell)',20,0,'Enter a project-specific swell factor. 20% means 1 bank yd³ becomes 1.2 loose yd³.'), max:200, unit:'%' },
    number('bankRate','Excavation quote (USD / bank yd³)',0,0,'Enter the contractor quote for excavation per in-place bank cubic yard.'),
    number('haulRate','Haul / disposal quote (USD / loose yd³)',0,0,'Enter the quoted haul or disposal rate per loose cubic yard, if applicable.'),
    number('equipment','Fixed equipment / mobilization (USD)',0,0),
    number('labor','Additional labor (USD)',0,0),
  ],
  formula:'Bank yd³ = length × width × depth / 27; loose yd³ = bank yd³ × (1 + swell/100); total cost = bank yd³ × excavation rate + loose yd³ × haul rate + fixed equipment + labor.',
  assumptions:[
    'Rectangular vertical-sided excavation. Sloped sides, working room, overbreak and irregular ground must be measured separately.',
    'Excavation pricing basis varies by contractor. Enter rates that match the bank and loose-volume definitions shown on this page.',
    'Utility conflicts, dewatering, rock, shoring, permits, trucking minimums and site access are excluded unless you include them in the quoted rates or fixed costs.'
  ],
  sources:['https://www.fhwa.dot.gov/construction/'],
  calculate(v){
    const bankFt3=v.length*v.width*v.depth;
    const bank=bankFt3/27;
    const loose=bank*(1+v.swell/100);
    const excavationCharge=bank*v.bankRate;
    const haulCharge=loose*v.haulRate;
    const total=excavationCharge+haulCharge+v.equipment+v.labor;
    return result([
      row('total','Estimated excavation total',total,'USD'),
      row('bank','In-place bank volume',bank,'yd³'),
      row('loose','Loose haul volume',loose,'yd³'),
      row('excavation','Excavation charge',excavationCharge,'USD'),
      row('haul','Haul / disposal charge',haulCharge,'USD'),
      row('fixed','Equipment + labor',v.equipment+v.labor,'USD'),
    ],[
      fmt(v.length)+' × '+fmt(v.width)+' × '+fmt(v.depth)+' / 27 = '+fmt(bank)+' bank yd³.',
      fmt(bank)+' × '+fmt(1+v.swell/100)+' = '+fmt(loose)+' loose yd³.',
      'Excavation '+fmt(bank)+' yd³ × '+fmt(v.bankRate)+' plus haul '+fmt(loose)+' yd³ × '+fmt(v.haulRate)+' plus fixed costs = '+fmt(total)+' USD.'
    ]);
  }
};

const wallFraming: Model = {
  fields: [
    length('length','Wall length',20),
    length('height','Stud height',8),
    length('spacing','Maximum stud spacing',16,'in'),
    count('extra','Additional studs for corners / openings',0,0),
    count('topPlates','Top plate layers',2,0),
    count('bottomPlates','Bottom plate layers',1,0),
    allowance,
    price('USD/ft')
  ],
  formula:'Base studs = ceil(wall length / maximum spacing) + 1; installed studs = base studs + extra studs; lumber length = studs × stud height + wall length × (top + bottom plate layers).',
  assumptions:[
    'Straight wall with end studs included. Enter extra studs required by corners, intersections and openings from the framing plan.',
    'This is a lumber takeoff, not a structural design. Stud spacing, headers, king/jack studs, blocking and load-path details come from the project requirements.',
    'Plate length assumes each plate layer runs the full entered wall length. Purchasing allowance is applied to total linear footage.'
  ],
  sources:[],
  calculate(v,u){
    const base=roundUp(v.length/v.spacing)+1;
    const studs=base+v.extra;
    const studFeet=studs*v.height;
    const plateFeet=v.length*(v.topPlates+v.bottomPlates);
    const net=studFeet+plateFeet;
    const order=net*waste(v);
    return result(withCost([
      row('studs','Installed studs',studs,'studs',true),
      row('base','Base layout studs',base,'studs',true),
      row('studFeet','Stud lumber length',studFeet,'ft'),
      row('plateFeet','Plate lumber length',plateFeet,'ft'),
      row('net','Net framing lumber',net,'ft'),
      row('order','Lumber including allowance',order,'ft')
    ],v.price,u.price,{'USD/ft':order}),[
      'ceil('+fmt(v.length)+' ft ÷ '+fmt(v.spacing*12)+' in) + 1 = '+base+' base studs.',
      base+' + '+v.extra+' additional studs = '+studs+' installed studs.',
      studs+' × '+fmt(v.height)+' ft + '+fmt(v.length)+' × ('+v.topPlates+' + '+v.bottomPlates+') = '+fmt(net)+' linear ft before allowance.'
    ]);
  }
};

export const structureModels:Record<string,Model>={
  grid,spaced,spacing,roofArea,roofCover,rafter,beam,excavation,excavationCost,wallFraming,
  'bar-length':{fields:[count('quantity','Number of bars',16),length('length','Length per bar',20),size,allowance,price('USD/ft')],formula:'Cut length = count × length per bar; mass = cut length × allowance factor × bar mass per foot.',assumptions:['Straight bars of the same size. Bends, hooks and laps are additional lengths taken from the bar schedule.','US bar mass is nominal; a shipment may differ within product tolerances.'],sources:['https://www.inchcalculator.com/rebar-material-calculator/',crsi],calculate(v,u){const net=v.quantity*v.length,order=net*waste(v),lb=order*barWeight(v.size);return result(withCost([row('length','Net total length',net,'ft'),row('order','Length including allowance',order,'ft'),row('weight','Nominal order weight',lb,'lb'),row('tons','Nominal order weight',lb/2000,'US tons')],v.price,u.price,{'USD/ft':order}),[`${v.quantity} bars × ${fmt(v.length)} ft = ${fmt(net)} ft.`,`Order length ${fmt(order)} ft × ${barWeight(v.size)} lb/ft = ${fmt(lb)} lb.`]);}},
  lap:{fields:[length('lap','Specified lap length per splice',24,'in'),count('quantity','Number of splices',10,0)],formula:'Additional lap length = specified length per splice × number of splices.',assumptions:['Enter the lap length from the approved plans. This tool totals an already specified lap; it does not derive a required code splice length.','There is no universal 40-diameter lap rule. Concrete strength, bar grade, size, cover, spacing and confinement affect required laps.'],sources:[crsi],calculate(v){return result([row('length','Additional steel for laps',v.lap*v.quantity,'ft'),row('meters','Additional steel for laps',v.lap*v.quantity/FT_PER_M,'m')],[`${fmt(v.lap)} ft per splice × ${v.quantity} = ${fmt(v.lap*v.quantity)} ft.`]);}},
  mesh:{fields:[...rectangle,length('sheetLength','Mesh sheet length',10),length('sheetWidth','Mesh sheet width',5),positiveOrZero(length('lap','Sheet overlap in both directions',6,'in')),allowance,price('USD/unit')],formula:'Sheets per direction = max(1, ceil((covered length − overlap)/(sheet length − overlap))); total = rows × columns.',assumptions:['Rectangular sheets laid in one orientation with equal overlaps. Edge sheets may be trimmed; this is a layout estimate without offcut reuse.','Required mesh size, laps and supports are specified by the project design.'],sources:[crsi],calculate(v,u){requireCondition(v.lap<v.sheetLength&&v.lap<v.sheetWidth,'lap','Overlap must be smaller than both sheet dimensions.');const cols=Math.max(1,roundUp((v.length-v.lap)/(v.sheetLength-v.lap))),rows=Math.max(1,roundUp((v.width-v.lap)/(v.sheetWidth-v.lap))),n=cols*rows,order=roundUp(n*waste(v));return result(withCost([row('order','Mesh sheets with spares',order,'sheets',true),row('installed','Sheets in layout',n,'sheets',true),row('rows','Rows',rows,'rows',true),row('columns','Columns',cols,'columns',true)],v.price,u.price,{'USD/unit':order}),[`${cols} columns × ${rows} rows = ${n} sheets before spares.`]);}},
  chairs:{fields:[...rectangle,length('spacing','Maximum support spacing',4),allowance,price('USD/unit')],formula:'Supports = (ceil(length / maximum spacing) + 1) × (ceil(width / maximum spacing) + 1).',assumptions:['A rectangular support grid with support lines at both edges. This is more conservative than area divided by spacing squared.','Actual support placement, load capacity and edge setbacks come from the reinforcement support plan.'],sources:[crsi],calculate(v,u){const n=(roundUp(v.length/v.spacing)+1)*(roundUp(v.width/v.spacing)+1),order=roundUp(n*waste(v));return result(withCost([row('order','Chairs with spares',order,'chairs',true),row('installed','Chairs in grid',n,'chairs',true)],v.price,u.price,{'USD/unit':order}),[`Grid supports: (ceil(${fmt(v.length)}/${fmt(v.spacing)}) + 1) × (ceil(${fmt(v.width)}/${fmt(v.spacing)}) + 1) = ${n}.`]);}},
  boardFeet:{fields:[length('thickness','Board thickness used for pricing',2,'in'),length('width','Board width used for pricing',6,'in'),length('length','Board length',8),count('quantity','Number of boards',10),allowance,price('USD/unit')],formula:'Board feet = thickness(in) × width(in) × length(ft) × quantity / 12.',assumptions:['One board foot is 144 in³. Use nominal or actual dimensions consistently with the seller’s pricing convention.','This is volume pricing, not a cutting plan or a count of framing members. Price is dollars per board foot.'],sources:[],calculate(v,u){const per=v.thickness*12*v.width*12*v.length/12,net=per*v.quantity,order=net*waste(v);return result(withCost([row('boardFeet','Board feet including allowance',order,'board ft'),row('net','Net board feet',net,'board ft'),row('per','Board feet per board',per,'board ft')],v.price,u.price,{'USD/unit':order}),[`${fmt(v.thickness*12)} × ${fmt(v.width*12)} × ${fmt(v.length)} / 12 = ${fmt(per)} board ft per board.`,`${fmt(per)} × ${v.quantity} × ${fmt(waste(v))} = ${fmt(order)} board ft.`]);}},
  'beam-load':{fields:[area('area','Tributary supported area',100),number('dead','Dead load (lb/ft²)',10,0),number('live','Live / snow load (lb/ft²)',40,0),length('span','Loaded beam length',10),number('self','Beam self-weight (lb/ft)',0,0)],formula:'Total load = tributary area × (dead + live load) + beam length × self-weight; equivalent line load = total / beam length.',assumptions:['User-specified unfactored loads distributed uniformly for estimation. Different load combinations and concentrated loads need separate analysis.','Does not calculate the maximum safe load or select a member size.'],sources:[awc],calculate(v){const total=v.area*(v.dead+v.live)+v.span*v.self;return result([row('line','Equivalent uniform line load',total/v.span,'lb/ft'),row('load','Total applied load',total,'lb')],[`${fmt(v.area)} × (${fmt(v.dead)} + ${fmt(v.live)}) + ${fmt(v.span)} × ${fmt(v.self)} = ${fmt(total)} lb.`]);}},
  header:{fields:[length('span','Simply supported header span',6),number('load','Uniform line load (lb/ft)',300,0),number('allowable','Adjusted allowable bending stress (psi)',undefined,undefined,'Obtain the value for the exact material, grade and design conditions from the designer.'),length('breadth','Total rectangular section breadth',3,'in')],formula:'Bending-only required section modulus S = wL² × 12 / (8 × allowable stress); rectangular depth = √(6S / breadth).',assumptions:['Bending demand only for a simply supported rectangular section under uniform load. The output is not a recommended nominal lumber size.','Deflection, shear, bearing, stability, connections, built-up member action and local code requirements can govern. An engineer must complete the design.'],sources:[awc],calculate(v){const moment=v.load*v.span**2/8,S=moment*12/v.allowable,depth=Math.sqrt(6*S/(v.breadth*12));return result([row('section','Bending-only required section modulus',S,'in³'),row('depth','Bending-only rectangular depth',depth,'in'),row('moment','Maximum bending demand',moment,'lb·ft')],[`M = ${fmt(moment)} lb·ft = ${fmt(moment*12)} lb·in.`,`S = ${fmt(moment*12)} / ${fmt(v.allowable)} = ${fmt(S)} in³.`,`Depth = √(6 × ${fmt(S)} / ${fmt(v.breadth*12)}) = ${fmt(depth)} in.`],['Do not choose or construct a structural header from this bending calculation alone.']);}},
  'roof-pitch':{fields:[positiveOrZero(length('rise','Vertical rise',6,'in')),length('run','Horizontal run',12,'in')],formula:'Slope = rise/run; pitch per 12 = 12 × slope; angle = atan(slope) × 180/π.',assumptions:['Run is horizontal distance, not the sloping rafter length. A zero rise is a valid flat plane.'],sources:[],calculate(v){const slope=v.rise/v.run;return result([row('pitch','Rise per 12 units of run',12*slope,':12'),row('angle','Angle above horizontal',Math.atan(slope)*180/Math.PI,'°'),row('slope','Slope',slope*100,'%'),row('multiplier','Roof slope multiplier',Math.hypot(1,slope),'×')],[`${fmt(v.rise)} ft ÷ ${fmt(v.run)} ft = ${fmt(slope)}.`,`12 × ${fmt(slope)} = ${fmt(12*slope)}:12.`]);}},
  flashing:{fields:[length('length','Total flashing run',40),length('stock','Stock piece length',10),positiveOrZero(length('overlap','Overlap between pieces',3,'in')),allowance,price('USD/unit')],formula:'Installed pieces = max(1, ceil((run − overlap)/(stock length − overlap))); purchased pieces = ceil(installed pieces × allowance factor).',assumptions:['One continuous straight run; first piece contributes its full length and each later piece loses the overlap.','Corners, step flashing at shingles, end laps and bends require a separate takeoff. Use manufacturer-specified overlaps.'],sources:[],calculate(v,u){requireCondition(v.overlap<v.stock,'overlap','Overlap must be smaller than stock length.');const n=Math.max(1,roundUp((v.length-v.overlap)/(v.stock-v.overlap))),order=roundUp(n*waste(v));return result(withCost([row('pieces','Stock pieces with spares',order,'pieces',true),row('installed','Installed pieces',n,'pieces',true),row('stock','Purchased stock length',order*v.stock,'ft')],v.price,u.price,{'USD/unit':order}),[`Round (${fmt(v.length)} − ${fmt(v.overlap)}) / (${fmt(v.stock)} − ${fmt(v.overlap)}) up = ${n} pieces.`]);}},
  backfill:{fields:[...rectangle,length('depth','Trench depth',4),positiveOrZero(length('diameter','Outside pipe diameter',12,'in')),allowance],formula:'Backfill = trench length × (trench width × depth − π × outside pipe diameter² / 4).',assumptions:['One circular pipe extends the full trench length. Bedding already placed, ducts, manholes and other occupied volumes need separate deductions.','This is placed volume, not loose delivered volume; apply the supplier’s compaction conversion separately if needed.'],sources:[],calculate(v){requireCondition(v.diameter<=v.width&&v.diameter<=v.depth,'diameter','The pipe outside diameter must fit within both trench width and depth.');const trench=v.length*v.width*v.depth,pipe=v.length*Math.PI*v.diameter**2/4,net=trench-pipe;return result([row('order','Backfill with allowance',net*waste(v)/27,'yd³'),row('net','Net placed backfill',net/27,'yd³'),row('pipe','Pipe displacement',pipe/27,'yd³')],[`${fmt(trench)} − ${fmt(pipe)} = ${fmt(net)} ft³ of backfill.`]);}},
  cutFill:{fields:[{...volume('cut','Cut (bank volume)',10),min:0},{...volume('fill','Required compacted fill',8),min:0},{...number('shrink','Bank-to-compacted volume reduction',0,0),max:99,unit:'%'},{...number('swell','Bank-to-loose volume increase',20,0),max:200,unit:'%'}],formula:'Bank volume required for fill = compacted fill / (1 − shrink / 100); bank balance = cut − required bank fill; loose balance = bank balance × (1 + swell / 100).',assumptions:['Balance compares material on the same bank-volume basis. Positive means excess/export; negative means shortage/import.','Assumes reusable soil of consistent properties. Unsuitable soil, topsoil stripping and material segregation are excluded. Shrink/swell require site information.'],sources:['https://www.fhwa.dot.gov/construction/'],calculate(v){const required=v.fill/(1-v.shrink/100),balance=v.cut-required;return result([row('balance','Bank balance (positive = export)',balance/27,'yd³'),row('loose','Loose balance (positive = export)',balance*(1+v.swell/100)/27,'yd³'),row('required','Bank material needed for fill',required/27,'yd³')],[`Compacted fill ${fmt(v.fill/27)} / ${fmt(1-v.shrink/100)} = ${fmt(required/27)} bank yd³.`,`Cut ${fmt(v.cut/27)} − required ${fmt(required/27)} = ${fmt(balance/27)} bank yd³.`]);}},
};
