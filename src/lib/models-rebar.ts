import type { Field, Model } from './calculator-types.ts';
import {
  FT_PER_M, allowance, count, fmt, length, number, positiveOrZero,
  price, requireCondition, result, roundUp, row, waste, withCost,
} from './calculator-math.ts';

const crsiPlacing = 'https://www.crsi.org/reinforcing-basics/reinforced-concrete/placing-bars/';
const crsiLap = 'https://www.crsi.org/reinforcing-basics/reinforcing-steel/splicing-bars/lap-splices/';
const crsiTerms = 'https://www.crsi.org/reinforcing-basics/reinforced-concrete-terminology/';
const gerdau = 'https://www2.gerdau.com/products/straight-rebar';
const inchRebar = 'https://www.inchcalculator.com/rebar-material-calculator/';
const inchWeight = 'https://www.inchcalculator.com/rebar-weight-calculator/';
const inchMesh = 'https://www.inchcalculator.com/concrete-reinforcing-mesh-calculator/';
const omniRebar = 'https://www.omnicalculator.com/construction/rebar';

const barSpecs: Record<string, { diameterIn: number; lbPerFt: number }> = {
  '3': { diameterIn: 0.375, lbPerFt: 0.376 },
  '4': { diameterIn: 0.500, lbPerFt: 0.668 },
  '5': { diameterIn: 0.625, lbPerFt: 1.043 },
  '6': { diameterIn: 0.750, lbPerFt: 1.502 },
  '7': { diameterIn: 0.875, lbPerFt: 2.044 },
  '8': { diameterIn: 1.000, lbPerFt: 2.670 },
  '9': { diameterIn: 1.128, lbPerFt: 3.400 },
  '10': { diameterIn: 1.270, lbPerFt: 4.303 },
  '11': { diameterIn: 1.410, lbPerFt: 5.313 },
  '14': { diameterIn: 1.693, lbPerFt: 7.650 },
  '18': { diameterIn: 2.257, lbPerFt: 13.600 },
};

const barSize: Field = {
  id: 'size',
  label: 'US rebar size (#)',
  value: 4,
  min: 3,
  max: 18,
  integer: true,
  dimension: 'number',
  options: [3,4,5,6,7,8,9,10,11,14,18].map((n) => ({ value: n, label: `#${n}` })),
  help: 'ASTM inch-pound bar designation. Nominal diameters and linear weights use published North American rebar data.',
};

function spec(size: number) {
  const s = barSpecs[String(size)];
  requireCondition(Boolean(s), 'size', 'Choose a listed US bar size: #3–#11, #14 or #18.');
  return s;
}

function weightRows(lengthFt: number, size: number, prefix = '') {
  const s = spec(size);
  const lb = lengthFt * s.lbPerFt;
  return [
    row(prefix + 'weight', prefix ? 'Order weight' : 'Nominal weight', lb, 'lb'),
    row(prefix + 'kg', prefix ? 'Order weight' : 'Nominal weight', lb * 0.45359237, 'kg'),
    row(prefix + 'tons', prefix ? 'Order weight' : 'Nominal weight', lb / 2000, 'US tons'),
    row(prefix + 'tonnes', prefix ? 'Order weight' : 'Nominal weight', lb * 0.45359237 / 1000, 'metric tonnes'),
  ];
}

function gridValues(v: Record<string, number>) {
  const gridL = v.length - 2 * v.cover;
  const gridW = v.width - 2 * v.cover;
  requireCondition(gridL > 0 && gridW > 0, 'cover', 'Twice the edge offset must be smaller than both layout dimensions.');
  const barsAcrossL = roundUp(gridL / v.spacing) + 1;
  const barsAcrossW = roundUp(gridW / v.spacing) + 1;
  const actualL = barsAcrossL > 1 ? gridL / (barsAcrossL - 1) : gridL;
  const actualW = barsAcrossW > 1 ? gridW / (barsAcrossW - 1) : gridW;
  const netLength = barsAcrossL * gridW + barsAcrossW * gridL;
  return { gridL, gridW, barsAcrossL, barsAcrossW, actualL, actualW, netLength };
}

const rebarCalculator: Model = {
  fields: [
    length('length', 'Slab / grid length', 20, 'ft'),
    length('width', 'Slab / grid width', 10, 'ft'),
    positiveOrZero(length('cover', 'Edge offset to bar center', 2, 'in')),
    length('spacing', 'Maximum bar spacing', 16, 'in'),
    barSize,
    length('stockLength', 'Supplier stock-bar length', 20, 'ft'),
    allowance,
    price('USD/ft', ['USD/ft', 'USD/unit', 'USD/lb', 'USD/ton']),
  ],
  formula: 'Grid dimensions = slab dimensions − 2 × centerline offset. Bar count per direction = ceil(usable dimension / max spacing) + 1. Total cut length = count × perpendicular grid dimension.',
  assumptions: [
    'A single orthogonal mat is estimated. Bar size, spacing and edge position come from the project drawings; this is a takeoff, not reinforcement design.',
    'Edge offset is measured to bar centerline. Convert clear concrete cover from the plan to centerline offset before entering it.',
    'Equivalent stock-piece count is total order footage divided by stock length and rounded up; an actual cut/splice plan can require more stock bars.',
  ],
  sources: [crsiPlacing, gerdau, inchRebar, omniRebar],
  calculate(v, u) {
    const g = gridValues(v);
    const orderLength = g.netLength * waste(v);
    const s = spec(v.size);
    const lb = orderLength * s.lbPerFt;
    const stockPieces = roundUp(orderLength / v.stockLength);
    const rows = [
      row('bars', 'Installed grid bars', g.barsAcrossL + g.barsAcrossW, 'bars', true),
      row('acrossL', 'Bars spanning grid width', g.barsAcrossL, 'bars', true),
      row('acrossW', 'Bars spanning grid length', g.barsAcrossW, 'bars', true),
      row('gridL', 'Rebar grid length', g.gridL, 'ft'),
      row('gridW', 'Rebar grid width', g.gridW, 'ft'),
      row('actualL', 'Equalized spacing along length', g.actualL * 12, 'in'),
      row('actualW', 'Equalized spacing along width', g.actualW * 12, 'in'),
      row('netLength', 'Net cut length', g.netLength, 'ft'),
      row('orderLength', 'Length including allowance', orderLength, 'ft'),
      row('stockPieces', 'Minimum equivalent stock bars', stockPieces, 'bars', true),
      row('weight', 'Nominal order weight', lb, 'lb'),
      row('tons', 'Nominal order weight', lb / 2000, 'US tons'),
    ];
    if (Number.isFinite(v.price)) {
      const q: Record<string, number> = {
        'USD/ft': orderLength,
        'USD/unit': stockPieces,
        'USD/lb': lb,
        'USD/ton': lb / 2000,
      };
      rows.push(row('cost', 'Estimated rebar material cost', q[u.price] * v.price, 'USD'));
    }
    return result(rows, [
      `Grid: ${fmt(v.length)} ft − 2 × ${fmt(v.cover * 12)} in = ${fmt(g.gridL)} ft; width = ${fmt(g.gridW)} ft.`,
      `Bars: ceil(${fmt(g.gridL)} ÷ ${fmt(v.spacing)}) + 1 = ${g.barsAcrossL}; opposite direction = ${g.barsAcrossW}.`,
      `Cut length: ${g.barsAcrossL} × ${fmt(g.gridW)} + ${g.barsAcrossW} × ${fmt(g.gridL)} = ${fmt(g.netLength)} ft.`,
      `Equalized spacing: ${fmt(g.actualL * 12)} in along length and ${fmt(g.actualW * 12)} in along width; both are at or below the entered ${fmt(v.spacing * 12)} in maximum.`,
      `Order length ${fmt(orderLength)} ft; minimum equivalent ${v.stockLength}-ft stock bars = ${stockPieces}.`,
    ]);
  },
};

const rebarWeight: Model = {
  fields: [
    count('quantity', 'Number of bars', 16),
    length('length', 'Length per bar', 20, 'ft'),
    barSize,
    allowance,
  ],
  formula: 'Net length = bar count × length per bar. Nominal weight = length × published nominal linear weight for the selected US bar size.',
  assumptions: [
    'Nominal ASTM inch-pound bar weights are used; actual shipments can vary within product tolerances.',
    'Material allowance increases order length and order weight; it does not change the installed bar count.',
    'This is a weight takeoff, not reinforcement sizing or structural design.',
  ],
  sources: [gerdau, inchWeight],
  calculate(v) {
    const s = spec(v.size);
    const netLength = v.quantity * v.length;
    const orderLength = netLength * waste(v);
    const netLb = netLength * s.lbPerFt;
    const orderLb = orderLength * s.lbPerFt;
    return result([
      row('lbPerFt', 'Nominal weight per foot', s.lbPerFt, 'lb/ft'),
      row('diameter', 'Nominal bar diameter', s.diameterIn, 'in'),
      row('netLength', 'Net total length', netLength, 'ft'),
      row('orderLength', 'Length including allowance', orderLength, 'ft'),
      row('netWeight', 'Net nominal weight', netLb, 'lb'),
      row('orderWeight', 'Order nominal weight', orderLb, 'lb'),
      row('kg', 'Order nominal weight', orderLb * 0.45359237, 'kg'),
      row('tons', 'Order nominal weight', orderLb / 2000, 'US tons'),
      row('tonnes', 'Order nominal weight', orderLb * 0.45359237 / 1000, 'metric tonnes'),
    ], [
      `${v.quantity} × ${fmt(v.length)} ft = ${fmt(netLength)} ft net length.`,
      `#${v.size} nominal weight = ${fmt(s.lbPerFt)} lb/ft; net = ${fmt(netLb)} lb.`,
      `Allowance factor ${fmt(waste(v))} → ${fmt(orderLength)} ft and ${fmt(orderLb)} lb to order.`,
    ]);
  },
};

const rebarQuantity: Model = {
  fields: [
    length('length', 'Reinforced area length', 20, 'ft'),
    length('width', 'Reinforced area width', 10, 'ft'),
    positiveOrZero(length('cover', 'Edge offset to bar center', 2, 'in')),
    length('spacing', 'Maximum bar spacing', 16, 'in'),
    length('stockLength', 'Supplier stock-bar length', 20, 'ft'),
    barSize,
    allowance,
  ],
  formula: 'Grid bars are rounded up from usable grid dimensions and maximum spacing. Purchasing quantity = ceil(total cut length × allowance factor / stock length).',
  assumptions: [
    'One orthogonal reinforcement mat is estimated with bars at both usable grid edges.',
    'Stock-bar count is a minimum equivalent by total footage, not a cutting-optimization or splice-detailing plan.',
    'Use the spacing, cover and bar size specified by the project design.',
  ],
  sources: [crsiPlacing, inchRebar, gerdau],
  calculate(v) {
    const g = gridValues(v);
    const orderLength = g.netLength * waste(v);
    const pieces = roundUp(orderLength / v.stockLength);
    const lb = orderLength * spec(v.size).lbPerFt;
    return result([
      row('pieces', 'Minimum equivalent stock bars', pieces, 'bars', true),
      row('installed', 'Installed grid bars', g.barsAcrossL + g.barsAcrossW, 'bars', true),
      row('rows', 'Bars spanning grid length', g.barsAcrossW, 'bars', true),
      row('columns', 'Bars spanning grid width', g.barsAcrossL, 'bars', true),
      row('netLength', 'Net cut length', g.netLength, 'ft'),
      row('orderLength', 'Length including allowance', orderLength, 'ft'),
      row('weight', 'Nominal order weight', lb, 'lb'),
      row('actualL', 'Equalized spacing along length', g.actualL * 12, 'in'),
      row('actualW', 'Equalized spacing along width', g.actualW * 12, 'in'),
    ], [
      `${g.barsAcrossL} + ${g.barsAcrossW} = ${g.barsAcrossL + g.barsAcrossW} installed grid bars.`,
      `Net cut length = ${fmt(g.netLength)} ft; with allowance = ${fmt(orderLength)} ft.`,
      `ceil(${fmt(orderLength)} ÷ ${fmt(v.stockLength)}) = ${pieces} minimum equivalent stock bars.`,
    ]);
  },
};

const rebarCost: Model = {
  fields: [
    { id: 'mode', label: 'Quantity input', value: 0, min: 0, max: 1, integer: true, options: [
      { value: 0, label: 'Bar count × cut length' },
      { value: 1, label: 'Known total cut length' },
    ] },
    { ...count('quantity', 'Number of bars', 16), visibleWhen: { field: 'mode', equals: 0 } },
    { ...length('length', 'Cut length per bar', 20, 'ft'), visibleWhen: { field: 'mode', equals: 0 } },
    { ...length('totalLength', 'Known total cut length', 320, 'ft'), visibleWhen: { field: 'mode', equals: 1 } },
    barSize,
    length('stockLength', 'Supplier stock-bar length', 20, 'ft'),
    allowance,
    { ...price('USD/ft', ['USD/ft', 'USD/unit', 'USD/lb', 'USD/ton']), optional: false },
    number('tax', 'Material sales tax (%)', 0, 0),
    number('delivery', 'Delivery / fixed material fee (USD)', 0, 0),
  ],
  formula: 'Net length comes from count × cut length or entered total. Order length = net × allowance factor. Material subtotal uses selected price basis; total = subtotal + tax + delivery.',
  assumptions: [
    'Per-stock-bar pricing uses minimum equivalent pieces by total footage; a real cut/splice schedule can require additional stock.',
    'Price, tax and delivery must come from the actual supplier quote.',
    'Fabrication, bends, hooks, lap steel, couplers, tying and installation labor are excluded unless already embedded in the quote.',
  ],
  sources: [gerdau, inchRebar, omniRebar],
  calculate(v, u) {
    const netLength = Math.round(v.mode) === 1 ? v.totalLength : v.quantity * v.length;
    const orderLength = netLength * waste(v);
    const pieces = roundUp(orderLength / v.stockLength);
    const lb = orderLength * spec(v.size).lbPerFt;
    const q: Record<string, number> = {
      'USD/ft': orderLength,
      'USD/unit': pieces,
      'USD/lb': lb,
      'USD/ton': lb / 2000,
    };
    const material = q[u.price] * v.price;
    const tax = material * v.tax / 100;
    const total = material + tax + v.delivery;
    return result([
      row('total', 'Estimated rebar material total', total, 'USD'),
      row('materials', 'Rebar material subtotal', material, 'USD'),
      row('tax', 'Material tax', tax, 'USD'),
      row('delivery', 'Delivery / fixed fee', v.delivery, 'USD'),
      row('netLength', 'Net cut length', netLength, 'ft'),
      row('orderLength', 'Length including allowance', orderLength, 'ft'),
      row('stockPieces', 'Minimum equivalent stock bars', pieces, 'bars', true),
      row('weight', 'Nominal order weight', lb, 'lb'),
      row('tons', 'Nominal order weight', lb / 2000, 'US tons'),
    ], [
      Math.round(v.mode) === 1 ? `Entered net cut length = ${fmt(netLength)} ft.` : `${v.quantity} × ${fmt(v.length)} ft = ${fmt(netLength)} ft net.`,
      `Allowance → ${fmt(orderLength)} ft, ${pieces} minimum equivalent stock bars and ${fmt(lb)} lb nominal weight.`,
      `${fmt(q[u.price])} ${u.price} × $${fmt(v.price)} = $${fmt(material)}; tax + delivery → $${fmt(total)}.`,
    ]);
  },
};

const rebarSpacing: Model = {
  fields: [
    { id: 'mode', label: 'Solve for', value: 0, min: 0, max: 1, integer: true, options: [
      { value: 0, label: 'Equal spacing from installed bar count' },
      { value: 1, label: 'Required bar count from maximum spacing' },
    ] },
    length('length', 'Overall layout distance', 20, 'ft'),
    positiveOrZero(length('cover', 'End offset to bar center', 2, 'in')),
    { ...count('quantity', 'Installed bars', 16, 2), visibleWhen: { field: 'mode', equals: 0 } },
    { ...length('spacing', 'Maximum center spacing', 16, 'in'), visibleWhen: { field: 'mode', equals: 1 } },
  ],
  formula: 'Usable centerline distance = overall distance − 2 × end offset. Count mode: equal spacing = usable / (bars − 1). Maximum-spacing mode: bars = ceil(usable / max spacing) + 1.',
  assumptions: [
    'Spacing is center-to-center. End offset is measured from concrete edge to the centerline of the end bar.',
    'This solves layout geometry for inputs from the placing drawings; it does not choose a permitted reinforcement spacing.',
  ],
  sources: [crsiPlacing, crsiTerms],
  calculate(v) {
    const usable = v.length - 2 * v.cover;
    requireCondition(usable > 0, 'cover', 'Twice the end offset must be smaller than the overall layout distance.');
    let bars: number;
    let actual: number;
    if (Math.round(v.mode) === 1) {
      bars = roundUp(usable / v.spacing) + 1;
      actual = usable / (bars - 1);
    } else {
      bars = v.quantity;
      actual = usable / (bars - 1);
    }
    return result([
      row('bars', 'Installed bars', bars, 'bars', true),
      row('usable', 'Usable centerline distance', usable, 'ft'),
      row('spacing', 'Equal center spacing', actual * 12, 'in'),
      row('mm', 'Equal center spacing', actual / FT_PER_M * 1000, 'mm'),
    ], [
      `Usable distance: ${fmt(v.length)} ft − 2 × ${fmt(v.cover * 12)} in = ${fmt(usable)} ft.`,
      Math.round(v.mode) === 1
        ? `ceil(${fmt(usable)} ÷ ${fmt(v.spacing)}) + 1 = ${bars} bars; equalized spacing = ${fmt(actual * 12)} in.`
        : `${fmt(usable)} ft ÷ (${bars} − 1) = ${fmt(actual * 12)} in center-to-center.`,
    ]);
  },
};

const rebarLength: Model = {
  fields: [
    count('quantity', 'Number of cut bars', 16),
    length('length', 'Cut length per bar', 20, 'ft'),
    length('stockLength', 'Supplier stock-bar length', 20, 'ft'),
    allowance,
  ],
  formula: 'Net cut length = count × cut length. Order footage = net × allowance factor. Minimum equivalent stock bars = ceil(order footage / stock length).',
  assumptions: [
    'Straight cut lengths only. Bends, hooks, lap splices and couplers are separate takeoffs.',
    'Equivalent stock-bar count is based on total footage and is not a cutting optimization; real fabrication can require more stock.',
  ],
  sources: [gerdau],
  calculate(v) {
    const net = v.quantity * v.length;
    const order = net * waste(v);
    const pieces = roundUp(order / v.stockLength);
    return result([
      row('net', 'Net total cut length', net, 'ft'),
      row('order', 'Length including allowance', order, 'ft'),
      row('meters', 'Length including allowance', order / FT_PER_M, 'm'),
      row('pieces', 'Minimum equivalent stock bars', pieces, 'bars', true),
      row('stockPurchased', 'Equivalent stock footage', pieces * v.stockLength, 'ft'),
    ], [
      `${v.quantity} × ${fmt(v.length)} ft = ${fmt(net)} ft net cut length.`,
      `${fmt(net)} × ${fmt(waste(v))} = ${fmt(order)} ft with allowance.`,
      `ceil(${fmt(order)} ÷ ${fmt(v.stockLength)}) = ${pieces} minimum equivalent stock bars.`,
    ]);
  },
};

const rebarGrid: Model = {
  fields: [
    length('length', 'Grid area length', 20, 'ft'),
    length('width', 'Grid area width', 10, 'ft'),
    positiveOrZero(length('cover', 'Edge offset to bar center', 2, 'in')),
    length('spacing', 'Maximum center spacing', 16, 'in'),
    allowance,
  ],
  formula: 'Grid dimensions = area dimensions − 2 × centerline offset. Bars per direction = ceil(grid dimension / max spacing) + 1. Equalized spacing = grid dimension / intervals.',
  assumptions: [
    'One orthogonal mat is laid out. This page focuses on grid geometry and linear footage rather than bar weight or price.',
    'Bar spacing and edge position must come from the placing drawings or project design.',
  ],
  sources: [crsiPlacing, inchRebar, omniRebar],
  calculate(v) {
    const g = gridValues(v);
    const order = g.netLength * waste(v);
    return result([
      row('gridL', 'Grid length', g.gridL, 'ft'),
      row('gridW', 'Grid width', g.gridW, 'ft'),
      row('bars', 'Installed grid bars', g.barsAcrossL + g.barsAcrossW, 'bars', true),
      row('acrossL', 'Bars spanning grid width', g.barsAcrossL, 'bars', true),
      row('acrossW', 'Bars spanning grid length', g.barsAcrossW, 'bars', true),
      row('actualL', 'Equalized spacing along length', g.actualL * 12, 'in'),
      row('actualW', 'Equalized spacing along width', g.actualW * 12, 'in'),
      row('netLength', 'Net grid bar length', g.netLength, 'ft'),
      row('orderLength', 'Grid length including allowance', order, 'ft'),
    ], [
      `Usable grid = ${fmt(g.gridL)} × ${fmt(g.gridW)} ft.`,
      `Bars by direction = ${g.barsAcrossL} and ${g.barsAcrossW}; equalized spacing = ${fmt(g.actualL * 12)} in × ${fmt(g.actualW * 12)} in.`,
      `Net grid bar length = ${fmt(g.netLength)} ft; with allowance = ${fmt(order)} ft.`,
    ]);
  },
};

const rebarLap: Model = {
  fields: [
    length('lap', 'Specified lap length per splice', 24, 'in'),
    count('quantity', 'Number of lap splices', 10, 0),
    barSize,
    allowance,
    price('USD/ft', ['USD/ft', 'USD/lb', 'USD/ton']),
  ],
  formula: 'Additional lap steel = specified lap length × splice count. Order lap steel = additional length × allowance factor. Weight uses nominal linear weight for the selected bar size.',
  assumptions: [
    'Enter lap length from the approved structural/placing drawings. This calculator deliberately does not derive a required development or lap-splice length.',
    'Required lap length depends on concrete strength, steel grade, bar size, cover, spacing, confinement, coating and splice condition.',
    'The output is additional steel attributable to laps only; base bar lengths are separate.',
  ],
  sources: [crsiLap, gerdau],
  calculate(v, u) {
    const net = v.lap * v.quantity;
    const order = net * waste(v);
    const lb = order * spec(v.size).lbPerFt;
    const rows = [
      row('net', 'Additional lap steel', net, 'ft'),
      row('order', 'Lap steel including allowance', order, 'ft'),
      row('meters', 'Lap steel including allowance', order / FT_PER_M, 'm'),
      row('weight', 'Nominal lap-steel weight', lb, 'lb'),
      row('kg', 'Nominal lap-steel weight', lb * 0.45359237, 'kg'),
    ];
    if (Number.isFinite(v.price)) {
      const q: Record<string, number> = { 'USD/ft': order, 'USD/lb': lb, 'USD/ton': lb / 2000 };
      rows.push(row('cost', 'Estimated lap-steel material cost', q[u.price] * v.price, 'USD'));
    }
    return result(rows, [
      `${fmt(v.lap * 12)} in/splice × ${v.quantity} = ${fmt(net)} ft additional lap steel.`,
      `Allowance → ${fmt(order)} ft; #${v.size} nominal lap-steel weight = ${fmt(lb)} lb.`,
    ]);
  },
};

function sheetsFor(targetL: number, targetW: number, sheetL: number, sheetW: number, lap: number) {
  requireCondition(lap < sheetL && lap < sheetW, 'lap', 'Overlap must be smaller than both sheet dimensions.');
  const cols = Math.max(1, roundUp((targetL - lap) / (sheetL - lap)));
  const rows = Math.max(1, roundUp((targetW - lap) / (sheetW - lap)));
  const coveredL = sheetL + Math.max(0, cols - 1) * (sheetL - lap);
  const coveredW = sheetW + Math.max(0, rows - 1) * (sheetW - lap);
  return { cols, rows, count: cols * rows, coveredL, coveredW };
}

const reinforcementMesh: Model = {
  fields: [
    length('length', 'Slab length', 20, 'ft'),
    length('width', 'Slab width', 10, 'ft'),
    length('sheetLength', 'Mesh sheet / roll length', 10, 'ft'),
    length('sheetWidth', 'Mesh sheet / roll width', 5, 'ft'),
    positiveOrZero(length('lap', 'Overlap at adjoining edges', 6, 'in')),
    allowance,
    price('USD/unit'),
  ],
  formula: 'For each sheet orientation, count = ceil((target − overlap)/(sheet − overlap)) in each direction. The calculator uses the orientation requiring fewer installed sheets, then applies purchasing allowance.',
  assumptions: [
    'Rectangular slab and rectangular sheets/rolls. The calculator compares both 90° orientations and chooses the one with fewer installed pieces.',
    'Overlap is entered as a physical dimension, not a percent. Use the lap required by the mesh product or project design.',
    'Offcut reuse between separate areas is not modeled.',
  ],
  sources: [inchMesh, crsiPlacing],
  calculate(v, u) {
    const a = sheetsFor(v.length, v.width, v.sheetLength, v.sheetWidth, v.lap);
    const b = sheetsFor(v.length, v.width, v.sheetWidth, v.sheetLength, v.lap);
    const best = b.count < a.count ? b : a;
    const usedSheetL = b.count < a.count ? v.sheetWidth : v.sheetLength;
    const usedSheetW = b.count < a.count ? v.sheetLength : v.sheetWidth;
    const order = roundUp(best.count * waste(v));
    const slabArea = v.length * v.width;
    const purchasedArea = order * v.sheetLength * v.sheetWidth;
    return result(withCost([
      row('order', 'Mesh sheets / rolls with spares', order, 'pieces', true),
      row('installed', 'Installed sheets / rolls', best.count, 'pieces', true),
      row('rows', 'Layout rows', best.rows, 'rows', true),
      row('columns', 'Layout columns', best.cols, 'columns', true),
      row('sheetAlongL', 'Selected sheet dimension along slab length', usedSheetL, 'ft'),
      row('sheetAlongW', 'Selected sheet dimension along slab width', usedSheetW, 'ft'),
      row('coveredL', 'Layout coverage length', best.coveredL, 'ft'),
      row('coveredW', 'Layout coverage width', best.coveredW, 'ft'),
      row('slabArea', 'Slab area', slabArea, 'ft²'),
      row('purchasedArea', 'Gross purchased mesh area', purchasedArea, 'ft²'),
    ], v.price, u.price, { 'USD/unit': order }), [
      `Best orientation uses ${fmt(usedSheetL)} × ${fmt(usedSheetW)} ft along the slab axes.`,
      `${best.cols} columns × ${best.rows} rows = ${best.count} installed sheets/rolls before purchasing allowance.`,
      `Allowance → ${order} pieces to purchase.`,
    ]);
  },
};

const rebarChairs: Model = {
  fields: [
    length('length', 'Supported mat length', 20, 'ft'),
    length('width', 'Supported mat width', 10, 'ft'),
    positiveOrZero(length('edgeOffset', 'Support-grid edge offset', 0, 'in')),
    length('spacingL', 'Maximum chair spacing along length', 4, 'ft'),
    length('spacingW', 'Maximum chair spacing along width', 4, 'ft'),
    allowance,
    price('USD/unit'),
  ],
  formula: 'Usable support-grid dimensions = mat dimensions − 2 × edge offset. Supports per axis = ceil(usable dimension / maximum spacing) + 1. Total chairs = axis counts multiplied.',
  assumptions: [
    'This is a rectangular planning grid, not a support-design rule. Chair type, capacity, spacing and edge setbacks come from the reinforcement support plan.',
    'Supports are counted at every grid intersection. Continuous bolsters or support bars require a different takeoff.',
    'Allowance adds spare chairs after the installed grid count is calculated.',
  ],
  sources: [crsiPlacing, crsiTerms],
  calculate(v, u) {
    const l = v.length - 2 * v.edgeOffset;
    const w = v.width - 2 * v.edgeOffset;
    requireCondition(l > 0 && w > 0, 'edgeOffset', 'Twice the support-grid edge offset must be smaller than both mat dimensions.');
    const nL = roundUp(l / v.spacingL) + 1;
    const nW = roundUp(w / v.spacingW) + 1;
    const installed = nL * nW;
    const order = roundUp(installed * waste(v));
    const actualL = l / (nL - 1);
    const actualW = w / (nW - 1);
    return result(withCost([
      row('order', 'Chairs with spares', order, 'chairs', true),
      row('installed', 'Installed chair grid', installed, 'chairs', true),
      row('alongL', 'Chair locations along length', nL, 'locations', true),
      row('alongW', 'Chair locations along width', nW, 'locations', true),
      row('actualL', 'Equalized chair spacing along length', actualL, 'ft'),
      row('actualW', 'Equalized chair spacing along width', actualW, 'ft'),
      row('gridL', 'Support-grid length', l, 'ft'),
      row('gridW', 'Support-grid width', w, 'ft'),
    ], v.price, u.price, { 'USD/unit': order }), [
      `Support grid = ${fmt(l)} × ${fmt(w)} ft after edge offset.`,
      `ceil(${fmt(l)} ÷ ${fmt(v.spacingL)}) + 1 = ${nL}; opposite axis = ${nW}.`,
      `${nL} × ${nW} = ${installed} installed chairs; allowance → ${order} to purchase.`,
    ]);
  },
};

export const rebarModels: Record<string, Model> = {
  'rebar-general-dedicated': rebarCalculator,
  'rebar-weight-dedicated': rebarWeight,
  'rebar-quantity-dedicated': rebarQuantity,
  'rebar-cost-dedicated': rebarCost,
  'rebar-spacing-dedicated': rebarSpacing,
  'rebar-length-dedicated': rebarLength,
  'rebar-grid-dedicated': rebarGrid,
  'rebar-lap-dedicated': rebarLap,
  'reinforcement-mesh-dedicated': reinforcementMesh,
  'rebar-chair-dedicated': rebarChairs,
};
