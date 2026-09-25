import type { Model } from './calculator-types.ts';
import { FT_PER_M, allowance, area, count, fmt, length, netArea, number, openings, positiveOrZero, price, rectangle, requireCondition, result, roundUp, row, waste, withCost } from './calculator-math.ts';
const coverage:Model={fields:[...rectangle,openings,{...area('coverage','Effective coverage per package',20),group:'Material & assumptions',help:'Use the package coverage for the selected product, thickness, application and installation method.'},allowance,price('USD/unit',['USD/unit','USD/ft2','USD/m2'])],formula:'Net area = length × width − openings; packages = ceil(net area × allowance factor / coverage per package).',assumptions:['Uniform product coverage. Enter the manufacturer’s effective coverage, not an assumed universal package size.','Allowance is applied to unrounded area. Whole packages are rounded up once at the end.'],sources:[],calculate(v,u){const net=netArea(v),order=net*waste(v),packages=roundUp(order/v.coverage);return result(withCost([row('packages','Whole packages to order',packages,'packages',true),row('area','Net project area',net,'ft²'),row('order','Required coverage with allowance',order,'ft²'),row('purchased','Coverage purchased',packages*v.coverage,'ft²'),row('m2','Required coverage',order/FT_PER_M**2,'m²')],v.price,u.price,{'USD/unit':packages,'USD/ft2':packages*v.coverage,'USD/m2':packages*v.coverage/FT_PER_M**2}),[`${fmt(v.length*v.width)} − ${fmt(v.openings)} = ${fmt(net)} ft².`,`${fmt(net)} × ${fmt(waste(v))} = ${fmt(order)} ft².`,`Round ${fmt(order)} / ${fmt(v.coverage)} up = ${packages} packages.`]);}};
const paintFields=[...rectangle,length('height','Room wall height',8),openings,count('coats','Number of coats',2),number('coverage','Coverage per gallon (ft²/US gal)',350),number('container','Container size (US gal)',1),allowance,price('USD/unit')];
function paintResult(net:number,v:Record<string,number>,u:Record<string,string>){requireCondition(net>=0,'openings','Excluded area cannot exceed the surface area.');const coated=net*v.coats,gallons=coated*waste(v)/v.coverage,containers=roundUp(gallons/v.container);return result(withCost([row('containers','Containers to buy',containers,'containers',true),row('gallons','Calculated paint requirement',gallons,'US gal'),row('liters','Calculated paint requirement',gallons*3.785411784,'L'),row('area','Net surface area',net,'ft²'),row('purchased','Paint purchased',containers*v.container,'US gal')],v.price,u.price,{'USD/unit':containers}),[`${fmt(net)} ft² × ${v.coats} coats × ${fmt(waste(v))} / ${fmt(v.coverage)} = ${fmt(gallons)} US gal.`,`Round ${fmt(gallons)} / ${fmt(v.container)} up = ${containers} containers.`]);}
const paint:Model={fields:paintFields,formula:'Wall area = 2 × (room length + room width) × wall height − excluded area; paint = area × coats × allowance factor / coverage.',assumptions:['Four rectangular walls; ceiling and trim are excluded. Measure recesses and extra walls separately.','Coverage is a product- and surface-specific example, per coat. Rough or porous surfaces may need more paint. Container price is the price of one entered container size.'],sources:['https://www.sherwin-williams.com/homeowners/color/color-tools/paint-calculator'],calculate(v,u){return paintResult(2*(v.length+v.width)*v.height-v.openings,v,u);}};
const tile:Model={fields:[...rectangle,length('tileLength','Tile / paver length',12,'in'),length('tileWidth','Tile / paver width',12,'in'),positiveOrZero(length('joint','Joint width',0.125,'in')),allowance,price('USD/unit')],formula:'Rows = ceil((floor width + joint)/(unit width + joint)); columns = ceil((floor length + joint)/(unit length + joint)); units = rows × columns.',assumptions:['Straight rectangular grid. Counts a whole unit for each edge cut and assumes no reuse of offcuts; diagonal layouts and patterns require a separate layout.','Allowance covers breakage and spare units after the basic layout count. Expansion perimeter gaps are excluded.'],sources:[],calculate(v,u){const columns=roundUp((v.length+v.joint)/(v.tileLength+v.joint)),rows=roundUp((v.width+v.joint)/(v.tileWidth+v.joint)),base=columns*rows,n=roundUp(base*waste(v));return result(withCost([row('units','Units to buy',n,'units',true),row('base','Units in straight layout',base,'units',true),row('area','Surface area',v.length*v.width,'ft²'),row('rows','Rows',rows,'rows',true),row('columns','Columns',columns,'columns',true)],v.price,u.price,{'USD/unit':n}),[`${rows} rows × ${columns} columns = ${base} units before spares.`,`Round ${base} × ${fmt(waste(v))} up = ${n}.`]);}};
const jointFill:Model={fields:[...rectangle,length('tileLength','Tile / paver length',12,'in'),length('tileWidth','Tile / paver width',12,'in'),positiveOrZero(length('joint','Joint width',0.125,'in')),length('depth','Filled joint depth',0.375,'in'),number('density','Fill density (kg/m³)',1600,undefined,'Use the product’s installed or bulk density, matching the volume state. This is an editable example.'),number('bagMass','Bag mass (kg)',5),allowance,price('USD/unit')],formula:'Joint fraction = 1 − Ltile × Wtile / ((Ltile + joint) × (Wtile + joint)); fill volume ≈ area × joint fraction × filled depth.',assumptions:['Repeating rectangular grid with fully filled joints. This is an interior-area approximation; perimeter joints, irregular pavers and joint profiles differ.','Density and yield vary by product. A manufacturer coverage table matched to unit size, joint width and depth is preferable for a final order.'],sources:['https://www.mapei.com/us/en-us/product-calculator/tile-grouts'],calculate(v,u){const fraction=1-v.tileLength*v.tileWidth/((v.tileLength+v.joint)*(v.tileWidth+v.joint)),cuFt=v.length*v.width*fraction*v.depth*waste(v),m3=cuFt/FT_PER_M**3,kg=m3*v.density,bags=roundUp(kg/v.bagMass);return result(withCost([row('weight','Estimated joint fill',kg,'kg'),row('bags','Whole bags',bags,'bags',true),row('liters','Filled joint volume',m3*1000,'L'),row('ft3','Filled joint volume',cuFt,'ft³')],v.price,u.price,{'USD/unit':bags}),[`Joint fraction: ${fmt(fraction*100)}% of the tiled surface.`,`${fmt(v.length*v.width)} ft² × ${fmt(fraction)} × ${fmt(v.depth)} ft × ${fmt(waste(v))} = ${fmt(cuFt)} ft³.`,`${fmt(m3)} m³ × ${fmt(v.density)} kg/m³ = ${fmt(kg)} kg.`]);}};

const drywallSheet: Model = {
  fields: [
    area('area','Drywall surface area',480),
    length('sheetLength','Sheet length',8),
    length('sheetWidth','Sheet width',4),
    allowance,
    price('USD/unit')
  ],
  formula:'Sheet area = sheet length × sheet width; sheets to order = ceil(surface area × allowance factor / sheet area).',
  assumptions:[
    'Use the measured drywall surface area after any opening deductions that you intend to exclude.',
    'This is an area-based sheet takeoff. It does not optimize sheet orientation, seam layout, offcut reuse or fastening pattern.',
    'Enter the actual sheet dimensions being purchased. Different sheet sizes can produce different whole-sheet counts for the same area.'
  ],
  sources:['https://www.certainteed.com/products/drywall-products/regular-drywall'],
  calculate(v,u){
    const sheetArea=v.sheetLength*v.sheetWidth;
    requireCondition(sheetArea>0,'sheetLength','Sheet dimensions must produce a positive sheet area.');
    const orderArea=v.area*waste(v);
    const sheets=roundUp(orderArea/sheetArea);
    const purchased=sheets*sheetArea;
    return result(withCost([
      row('sheets','Drywall sheets to order',sheets,'sheets',true),
      row('sheetArea','Area per sheet',sheetArea,'ft²'),
      row('order','Required coverage with allowance',orderArea,'ft²'),
      row('purchased','Purchased sheet area',purchased,'ft²'),
      row('extra','Purchased area above required coverage',purchased-orderArea,'ft²')
    ],v.price,u.price,{'USD/unit':sheets}),[
      fmt(v.sheetLength)+' × '+fmt(v.sheetWidth)+' = '+fmt(sheetArea)+' ft² per sheet.',
      fmt(v.area)+' × '+fmt(waste(v))+' = '+fmt(orderArea)+' ft² required with allowance.',
      'Round '+fmt(orderArea)+' ÷ '+fmt(sheetArea)+' up = '+sheets+' sheets.'
    ]);
  }
};

export const finishModels:Record<string,Model>={
  coverage,paint,tile,jointFill,drywallSheet,
  area:{fields:[...rectangle,openings],formula:'Net rectangular area = length × width − excluded area.',assumptions:['Flat rectangular area, not total three-dimensional surface area. For L-shaped rooms, calculate non-overlapping rectangles and add them.'],sources:[],calculate(v){const a=netArea(v);return result([row('area','Net area',a,'ft²'),row('m2','Net area',a/FT_PER_M**2,'m²'),row('yd2','Net area',a/9,'yd²')],[`${fmt(v.length)} × ${fmt(v.width)} − ${fmt(v.openings)} = ${fmt(a)} ft².`]);}},
  carpet:{fields:[...rectangle,length('rollWidth','Carpet roll width',12),allowance,price('USD/ft2',['USD/ft2','USD/m2'])],formula:'Strips = ceil(room width / roll width); purchased length = strips × room length × allowance factor; purchased area = purchased length × roll width.',assumptions:['All strips run along the entered room length, with no reuse of offcuts. Swap room length and width to compare seam direction.','Pattern repeat, pile direction, seams and irregular alcoves may require additional stock. Price applies to the full roll area purchased, not just room area.'],sources:[],calculate(v,u){const strips=roundUp(v.width/v.rollWidth),linear=strips*v.length*waste(v),bought=linear*v.rollWidth,net=v.length*v.width;return result(withCost([row('order','Roll area to buy',bought/9,'yd²'),row('linear','Linear roll length',linear,'ft'),row('strips','Full-width strips',strips,'strips',true),row('area','Room area',net,'ft²'),row('offcuts','Order area above room area',bought-net,'ft²')],v.price,u.price,{'USD/ft2':bought,'USD/m2':bought/FT_PER_M**2}),[`ceil(${fmt(v.width)} / ${fmt(v.rollWidth)}) = ${strips} strips.`,`${strips} × ${fmt(v.length)} × ${fmt(waste(v))} = ${fmt(linear)} linear ft.`,`${fmt(linear)} × ${fmt(v.rollWidth)} / 9 = ${fmt(bought/9)} square yards purchased.`]);}},
  ceilingPaint:{...paint,fields:paintFields.filter(f=>f.id!=='height'),formula:'Ceiling area = room length × room width − excluded area; paint = ceiling area × coats × allowance factor / coverage.',assumptions:['One flat rectangular ceiling; walls and trim are excluded. Sloped ceilings require their actual surface dimensions.','Use product coverage per coat and the actual container size.'],calculate(v,u){return paintResult(netArea(v),v,u);}},
  paintCoverage:{fields:[number('paint','Available paint (US gal)',1,0),number('coverage','Product coverage (ft²/US gal/coat)',350),count('coats','Number of coats',2)],formula:'Surface coverage = available paint × product coverage / coats.',assumptions:['The result is one surface receiving all entered coats. Texture, absorption and application loss reduce real coverage.'],sources:['https://www.sherwin-williams.com/homeowners/color/color-tools/paint-calculator'],calculate(v){const a=v.paint*v.coverage/v.coats;return result([row('area','Surface that can receive all coats',a,'ft²'),row('m2','Surface coverage',a/FT_PER_M**2,'m²')],[`${fmt(v.paint)} × ${fmt(v.coverage)} / ${v.coats} = ${fmt(a)} ft².`]);}},
  drywall:{...coverage,fields:[...rectangle,length('height','Wall height',8),openings,{...number('ceiling','Include ceiling',0,0),max:1,integer:true,options:[{value:0,label:'No'},{value:1,label:'Yes'}]},area('coverage','Area per sheet',32),allowance,price('USD/unit')],formula:'Area = 2 × (length + width) × height + optional ceiling area − openings; sheets = ceil(area × allowance factor / sheet area).',assumptions:['Four walls of a rectangular room; optional flat ceiling. Whole-sheet purchasing estimate, not an optimized cut layout.','Enter the sheet size and opening deductions actually used in your plan.'],calculate(v,u){const a=2*(v.length+v.width)*v.height+(v.ceiling?v.length*v.width:0)-v.openings;requireCondition(a>=0,'openings','Openings cannot exceed wall and ceiling area.');const n=roundUp(a*waste(v)/v.coverage);return result(withCost([row('sheets','Drywall sheets',n,'sheets',true),row('area','Net covering area',a,'ft²'),row('order','Area with allowance',a*waste(v),'ft²')],v.price,u.price,{'USD/unit':n}),[`2 × (${fmt(v.length)} + ${fmt(v.width)}) × ${fmt(v.height)} + ${v.ceiling?'ceiling':'0'} − ${fmt(v.openings)} = ${fmt(a)} ft².`,`Round ${fmt(a)} × ${fmt(waste(v))} / ${fmt(v.coverage)} up = ${n} sheets.`]);}},
  drywallScrews:{fields:[count('sheets','Number of installed sheets',10,0),count('perSheet','Screws per sheet from fastening plan',32),count('perBox','Screws per box',200),allowance,price('USD/unit')],formula:'Screws = ceil(sheets × screws per sheet × allowance factor); boxes = ceil(screws / screws per box).',assumptions:['Screw schedule depends on sheet size, orientation, support spacing and wall/ceiling assembly. The example count is not a fastening specification.'],sources:[],calculate(v,u){const screws=roundUp(v.sheets*v.perSheet*waste(v)),boxes=roundUp(screws/v.perBox);return result(withCost([row('screws','Screws with spares',screws,'screws',true),row('boxes','Whole boxes',boxes,'boxes',true)],v.price,u.price,{'USD/unit':boxes}),[`${v.sheets} × ${v.perSheet} × ${fmt(waste(v))}, rounded up = ${screws} screws.`,`Round ${screws}/${v.perBox} up = ${boxes} boxes.`]);}},
  drywallTape:{fields:[positiveOrZero(length('length','Total seams and taped corners',100)),length('roll','Tape length per roll',250),allowance,price('USD/unit')],formula:'Tape = seam length × allowance factor; rolls = ceil(tape / roll length).',assumptions:['Measure seams and inside corners once. Paper-faced corner beads or specialty tapes may be separate products.','This uses actual joint length rather than treating drywall area as a tape length.'],sources:[],calculate(v,u){const total=v.length*waste(v),rolls=roundUp(total/v.roll);return result(withCost([row('rolls','Tape rolls',rolls,'rolls',true),row('length','Tape including allowance',total,'ft')],v.price,u.price,{'USD/unit':rolls}),[`${fmt(v.length)} × ${fmt(waste(v))} = ${fmt(total)} ft; divide by ${fmt(v.roll)} ft/roll and round up.`]);}},
  sprayFoam:{fields:[...rectangle,length('depth','Installed foam thickness',2,'in'),number('coverage','Usable yield per kit (board ft)',200,undefined,'One board foot = one square foot at one inch thick. Use expected field yield, which may be lower than laboratory yield.'),allowance,price('USD/unit')],formula:'Foam board feet = area in ft² × thickness in inches; kits = ceil(board feet × allowance factor / kit yield).',assumptions:['Uniform finished thickness. Theoretical kit yield can fall with temperature, substrate and application losses.','Does not determine R-value, vapor control requirements or whether a foam system is suitable for the assembly.'],sources:[],calculate(v,u){const bf=v.length*v.width*v.depth*12,order=bf*waste(v),kits=roundUp(order/v.coverage);return result(withCost([row('kits','Foam kits',kits,'kits',true),row('boardFeet','Foam including allowance',order,'board ft'),row('net','Net installed foam',bf,'board ft')],v.price,u.price,{'USD/unit':kits}),[`${fmt(v.length*v.width)} ft² × ${fmt(v.depth*12)} in = ${fmt(bf)} board ft.`,`Round ${fmt(order)} / ${fmt(v.coverage)} up = ${kits} kits.`]);}},
  deckMud:{
    fields:[
      ...rectangle,
      length('thickness','Average mud bed thickness',1.5,'in','For a sloped bed, use the measured average thickness rather than the edge or drain thickness alone.'),
      {id:'yield',label:'Mixed yield per bag',value:0.41,unit:'ft3',units:['ft3','m3','L'],dimension:'volume',min:0.0001,group:'Material & assumptions',help:'Use the exact product yield. The 0.41 ft³ default matches an example 50 lb QUIKRETE Deck Mud bag; its 75 lb bag is listed at about 0.62 ft³.'},
      allowance,
      price('USD/bag')
    ],
    formula:'Net deck mud volume = length × width × average thickness; order volume = net volume × allowance factor; bags = ceil(order volume / mixed yield per bag).',
    assumptions:[
      'Uniform average bed thickness over a rectangular area. For slopes or uneven substrates, use a measured average thickness or split the floor into sections.',
      'The default bag yield is an editable product example, not a universal deck-mud yield. Replace it with the yield printed on the exact bag or product data sheet.',
      'This calculator estimates material quantity only. It does not select a shower-pan slope, minimum mortar thickness, waterproofing system or sand-to-cement mix design.'
    ],
    sources:['https://www.quikrete.com/pdfs/data_sheet-deck%20mud%20-%20154-50%20-76.pdf'],
    calculate(v,u){
      const a=v.length*v.width;
      const net=a*v.thickness;
      const order=net*waste(v);
      const bags=roundUp(order/v.yield);
      const coverage=v.yield/v.thickness;
      return result(
        withCost([
          row('bags','Whole bags to order',bags,'bags',true),
          row('area','Floor area',a,'ft²'),
          row('net','Net mud volume',net,'ft³'),
          row('order','Mud volume with allowance — ft³',order,'ft³'),
          row('yards','Mud volume with allowance — yd³',order/27,'yd³'),
          row('coverage','Coverage per bag at entered thickness',coverage,'ft²')
        ],v.price,u.price,{'USD/bag':bags}),
        [
          `${fmt(v.length)} × ${fmt(v.width)} = ${fmt(a)} ft².`,
          `${fmt(a)} ft² × ${fmt(v.thickness*12)} in ÷ 12 = ${fmt(net)} ft³.`,
          `${fmt(net)} × ${fmt(waste(v))} = ${fmt(order)} ft³ including allowance.`,
          `Round ${fmt(order)} ÷ ${fmt(v.yield)} ft³/bag up = ${bags} bags.`
        ]
      );
    }
  },
  concreteCrackRepair:{
    fields:[
      length('length','Total crack length',25,'ft'),
      length('width','Average filled crack width',0.25,'in'),
      length('depth','Average filled depth',0.5,'in'),
      count('quantity','Similar cracks',1),
      {...number('cartridge','Usable product volume per cartridge',10.1,0.01,'Enter the usable fluid volume stated for the exact tube or cartridge.'),unit:'fl oz',units:['fl oz'],group:'Material & assumptions'},
      allowance,
      price('USD/unit')
    ],
    formula:'Theoretical crack volume = length × width × depth × crack count; required fluid volume = theoretical volume × allowance factor; cartridges = ceil(required fluid ounces / cartridge fluid ounces).',
    assumptions:[
      'Models each filled crack as a rectangular prism with a constant average width and depth. Routed, V-shaped, irregular or partially filled cracks require measured geometry.',
      'Package volume is editable because products come in different cartridge sizes. Backer rod, bond-breaker material, injection ports and unused residue can change actual product consumption.',
      'This is a quantity estimator, not a diagnosis of crack cause or a structural repair design. Follow the repair-product instructions and project requirements.'
    ],
    sources:[
      'https://www.quikrete.com/productlines/concretecracksealant.asp',
      'https://www.quikrete.com/productlines/fastset-concrete-crack-repair.aspx'
    ],
    calculate(v,u){
      const netFt3=v.length*v.width*v.depth*v.quantity;
      const orderFt3=netFt3*waste(v);
      const netIn3=netFt3*1728;
      const orderIn3=orderFt3*1728;
      const fluidOunces=orderIn3*128/231;
      const ml=fluidOunces*29.5735295625;
      const cartridges=roundUp(fluidOunces/v.cartridge);
      return result(
        withCost([
          row('cartridges','Whole cartridges to order',cartridges,'cartridges',true),
          row('net','Theoretical crack volume',netIn3,'in³'),
          row('order','Volume with allowance',orderIn3,'in³'),
          row('floz','Required fluid volume',fluidOunces,'fl oz'),
          row('ml','Required fluid volume',ml,'mL')
        ],v.price,u.price,{'USD/unit':cartridges}),
        [
          `${fmt(v.length)} ft × ${fmt(v.width*12)} in × ${fmt(v.depth*12)} in × ${v.quantity} = ${fmt(netIn3)} in³ theoretical volume.`,
          `${fmt(netIn3)} × ${fmt(waste(v))} = ${fmt(orderIn3)} in³ including allowance.`,
          `${fmt(orderIn3)} in³ × 128 / 231 = ${fmt(fluidOunces)} US fl oz.`,
          `Round ${fmt(fluidOunces)} ÷ ${fmt(v.cartridge)} fl oz/cartridge up = ${cartridges} cartridges.`
        ]
      );
    }
  },
  stucco:{
    fields:[
      length('length','Total wall length',40,'ft'),
      length('height','Average wall height',10,'ft'),
      openings,
      {...number('baseCoats','Base coats (scratch / brown)',2,0),integer:true,max:3,group:'Material & assumptions',help:'Traditional three-coat work normally has two base coats. Enter the number required by your specified system.'},
      {...area('baseCoverage','Base-coat coverage per bag',20,0.01),group:'Material & assumptions',help:'Use coverage from the exact product at the specified coat thickness. The 20 ft² default is the conservative end of QUIKRETE’s listed 20–24 ft² per 80 lb bag at 3/8 in.'},
      {...number('finishCoats','Finish coats',1,0),integer:true,max:3,group:'Material & assumptions',help:'Enter zero if the selected assembly does not use a separate bagged finish coat.'},
      {...area('finishCoverage','Finish-coat coverage per bag',70,0.01),group:'Material & assumptions',help:'Use the exact product coverage. QUIKRETE lists about 70 ft² per 80 lb Finish Coat Stucco bag at 1/8 in, with texture affecting coverage.'},
      allowance
    ],
    formula:'Net wall area = total wall length × average wall height − openings; bags per coat type = ceil(net area × allowance factor × coat count / coverage per bag).',
    assumptions:[
      'One combined wall takeoff with a common average height. Measure different heights or detached wall sections separately when that is clearer.',
      'Coverage depends on product, coat thickness, substrate and texture. The defaults are editable examples from manufacturer literature, not universal stucco coverage rates.',
      'This estimates bag quantity only. It does not select lath, weather barrier, control joints, coat thickness, curing method or code-compliant stucco assembly.'
    ],
    sources:[
      'https://www.quikrete.com/PDFs/DATA_SHEET-Scratch%20and%20Brown%20Base%20Coat%20Stucco%20%201139.pdf',
      'https://www.quikrete.com/PDFs/DATA_SHEET-Finish%20Coat%20Stucco%201201.pdf'
    ],
    calculate(v){
      const gross=v.length*v.height;
      const net=gross-v.openings;
      requireCondition(net>=0,'openings','Openings cannot exceed the measured wall area.');
      requireCondition(v.baseCoats+v.finishCoats>0,'baseCoats','Enter at least one base or finish coat.');
      const orderArea=net*waste(v);
      const baseBags=v.baseCoats>0?roundUp(orderArea*v.baseCoats/v.baseCoverage):0;
      const finishBags=v.finishCoats>0?roundUp(orderArea*v.finishCoats/v.finishCoverage):0;
      const total=baseBags+finishBags;
      return result([
        row('total','Total stucco bags',total,'bags',true),
        row('base','Base-coat bags',baseBags,'bags',true),
        row('finish','Finish-coat bags',finishBags,'bags',true),
        row('area','Net wall area',net,'ft²'),
        row('order','Area with allowance',orderArea,'ft²')
      ],[
        `${fmt(v.length)} × ${fmt(v.height)} − ${fmt(v.openings)} = ${fmt(net)} ft² net wall area.`,
        `${fmt(net)} × ${fmt(waste(v))} = ${fmt(orderArea)} ft² with allowance.`,
        `Base: ceil(${fmt(orderArea)} × ${v.baseCoats} ÷ ${fmt(v.baseCoverage)}) = ${baseBags} bags.`,
        `Finish: ceil(${fmt(orderArea)} × ${v.finishCoats} ÷ ${fmt(v.finishCoverage)}) = ${finishBags} bags.`
      ]);
    }
  },

};
