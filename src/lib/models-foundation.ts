import type { Field, Model } from './calculator-types.ts';
import {
  FT_PER_M, allowance, area, count, fmt, length, number, positiveOrZero,
  price, requireCondition, result, roundUp, row, waste,
} from './calculator-math.ts';
import { concreteResult, densityField, densityLb, yieldField } from './models-materials.ts';

const geometry = 'https://www.calculatorsoup.com/calculators/construction/concrete-calculator.php';
const inchFooting = 'https://www.inchcalculator.com/concrete-footing-calculator/';
const footingGuide = 'https://www.concretenetwork.com/concrete/footing_fundamentals/';
const excavationGuide = 'https://www.fhwa.dot.gov/construction/';
const aci = 'https://www.concrete.org/general/frequently-asked-concrete-questions-faqs';

const concreteInputs: Field[] = [
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag', 'USD/ton']),
];

function priceBasis(cuFt: number, v: Record<string, number>, u: Record<string, string>) {
  const orderFt3 = cuFt * waste(v);
  const orderYd3 = orderFt3 / 27;
  const bags = roundUp(orderFt3 / v.yield);
  const lb = orderFt3 * densityLb(v.density, u.density);
  const basis: Record<string, number> = {
    'USD/yd3': orderYd3,
    'USD/m3': orderFt3 / FT_PER_M ** 3,
    'USD/ft3': orderFt3,
    'USD/bag': bags,
    'USD/ton': lb / 2000,
  };
  return { orderFt3, orderYd3, bags, lb, priceQty: basis[u.price] ?? orderYd3 };
}

const stripFooting: Model = {
  fields: [
    length('length', 'Total footing run (centerline)', 40, 'ft'),
    length('width', 'Footing width', 16, 'in'),
    length('depth', 'Footing depth', 8, 'in'),
    count('quantity', 'Identical footing runs', 1),
    ...concreteInputs,
  ],
  formula: 'V = centerline run × footing width × footing depth × quantity.',
  assumptions: [
    'Use centerline run for connected continuous footings so corners are not counted twice.',
    'Width and depth are design inputs from the approved project requirements; this calculator does not size a footing.',
    'Stepped footings should be divided into separate non-overlapping segments and summed.',
  ],
  sources: [geometry, inchFooting, footingGuide],
  calculate(v, u) {
    const cross = v.width * v.depth;
    const cuFt = v.length * cross * v.quantity;
    return concreteResult(cuFt, v, u, [
      `Cross-section: ${fmt(v.width)} ft × ${fmt(v.depth)} ft = ${fmt(cross)} ft².`,
      `Volume: ${fmt(v.length)} ft × ${fmt(cross)} ft² × ${v.quantity} = ${fmt(cuFt)} ft³.`,
    ], [
      row('crossArea', 'Footing cross-section area', cross, 'ft²'),
      row('linearFt', 'Total centerline run', v.length * v.quantity, 'ft'),
    ]);
  },
};

const padFooting: Model = {
  fields: [
    { id: 'shape', label: 'Pad shape', value: 0, integer: true, min: 0, max: 2, options: [
      { value: 0, label: 'Rectangular' },
      { value: 1, label: 'Square' },
      { value: 2, label: 'Round' },
    ] },
    { ...length('length', 'Pad length', 30, 'in'), visibleWhen: { field: 'shape', equals: 0 } },
    { ...length('width', 'Pad width', 24, 'in'), visibleWhen: { field: 'shape', equals: 0 } },
    { ...length('side', 'Pad side', 24, 'in'), visibleWhen: { field: 'shape', equals: 1 } },
    { ...length('diameter', 'Pad diameter', 24, 'in'), visibleWhen: { field: 'shape', equals: 2 } },
    length('depth', 'Pad depth', 12, 'in'),
    count('quantity', 'Number of pads', 4),
    ...concreteInputs,
  ],
  formula: 'Rectangular: V = L × W × D × Q. Square: V = S² × D × Q. Round: V = π × (D/2)² × depth × Q.',
  assumptions: [
    'Pad dimensions are formed concrete dimensions, not excavation dimensions.',
    'Pad size and thickness are structural-design inputs; this tool estimates material quantity only.',
    'For stepped or pedestal-on-pad foundations, calculate each non-overlapping concrete component separately.',
  ],
  sources: [geometry, inchFooting, footingGuide],
  calculate(v, u) {
    const shape = Math.round(v.shape);
    let footprint: number;
    let label: string;
    if (shape === 1) {
      footprint = v.side * v.side;
      label = `Square footprint: ${fmt(v.side)}² = ${fmt(footprint)} ft².`;
    } else if (shape === 2) {
      const r = v.diameter / 2;
      footprint = Math.PI * r * r;
      label = `Round footprint: π × ${fmt(r)}² = ${fmt(footprint)} ft².`;
    } else {
      footprint = v.length * v.width;
      label = `Rectangular footprint: ${fmt(v.length)} × ${fmt(v.width)} = ${fmt(footprint)} ft².`;
    }
    const per = footprint * v.depth;
    const cuFt = per * v.quantity;
    return concreteResult(cuFt, v, u, [
      label,
      `Per pad: ${fmt(footprint)} ft² × ${fmt(v.depth)} ft = ${fmt(per)} ft³; × ${v.quantity} = ${fmt(cuFt)} ft³.`,
    ], [
      row('footprint', 'Footprint area per pad', footprint, 'ft²'),
      row('perPad', 'Concrete per pad', per, 'ft³'),
    ]);
  },
};

const pierFooting: Model = {
  fields: [
    length('diameter', 'Pier shaft diameter', 12, 'in'),
    length('depth', 'Pier shaft depth', 36, 'in'),
    count('quantity', 'Number of piers', 6),
    positiveOrZero(length('bellDiameter', 'Bell / enlarged base diameter (0 = none)', 0, 'in')),
    positiveOrZero(length('bellDepth', 'Bell / enlarged base thickness (0 = none)', 0, 'in')),
    ...concreteInputs,
  ],
  formula: 'Shaft V = π × (diameter/2)² × depth × quantity. Optional base extra = π × [(bell diameter/2)² − (shaft diameter/2)²] × bell thickness × quantity.',
  assumptions: [
    'The shaft is modeled as a cylinder. Optional enlarged-base volume is modeled as an annular cylindrical enlargement at the bottom.',
    'Use zero for bell/base dimensions when the pier is a straight cylinder.',
    'Pier diameter, embedment, bell geometry and reinforcement are project-design inputs; this calculator does not determine bearing capacity or frost depth.',
  ],
  sources: [geometry, inchFooting, footingGuide],
  calculate(v, u) {
    const r = v.diameter / 2;
    const shaftPer = Math.PI * r * r * v.depth;
    let bellExtraPer = 0;
    if (v.bellDiameter > 0 || v.bellDepth > 0) {
      requireCondition(v.bellDiameter > v.diameter, 'bellDiameter', 'Bell diameter must be larger than the shaft diameter.');
      requireCondition(v.bellDepth > 0, 'bellDepth', 'Enter a positive bell/base thickness or set both bell fields to zero.');
      const br = v.bellDiameter / 2;
      bellExtraPer = Math.PI * (br * br - r * r) * v.bellDepth;
    }
    const per = shaftPer + bellExtraPer;
    const cuFt = per * v.quantity;
    return concreteResult(cuFt, v, u, [
      `Shaft per pier: π × ${fmt(r)}² × ${fmt(v.depth)} = ${fmt(shaftPer)} ft³.`,
      bellExtraPer > 0 ? `Enlarged-base extra per pier = ${fmt(bellExtraPer)} ft³.` : 'No enlarged-base volume entered.',
      `Total: ${fmt(per)} ft³/pier × ${v.quantity} = ${fmt(cuFt)} ft³.`,
    ], [
      row('perPier', 'Concrete per pier', per, 'ft³'),
      row('shaftPer', 'Shaft volume per pier', shaftPer, 'ft³'),
      row('bellExtra', 'Enlarged-base extra per pier', bellExtraPer, 'ft³'),
    ]);
  },
};

const footingVolume: Model = {
  fields: [
    { id: 'shape', label: 'Footing geometry', value: 0, integer: true, min: 0, max: 3, options: [
      { value: 0, label: 'Strip / continuous' },
      { value: 1, label: 'Rectangular pad' },
      { value: 2, label: 'Square pad' },
      { value: 3, label: 'Round pad / pier' },
    ] },
    { ...length('length', 'Length / run', 20, 'ft'), visibleWhen: { field: 'shape', in: [0, 1] } },
    { ...length('width', 'Width', 16, 'in'), visibleWhen: { field: 'shape', in: [0, 1] } },
    { ...length('side', 'Square side', 24, 'in'), visibleWhen: { field: 'shape', equals: 2 } },
    { ...length('diameter', 'Diameter', 18, 'in'), visibleWhen: { field: 'shape', equals: 3 } },
    length('depth', 'Depth', 10, 'in'),
    count('quantity', 'Quantity', 1),
    allowance,
  ],
  formula: 'Volume is the selected footing footprint area × depth × quantity; order volume = geometric volume × allowance factor.',
  assumptions: [
    'This page intentionally focuses on volume conversion only; use Footing Concrete Calculator for bags, weight and cost.',
    'Dimensions must describe the finished concrete geometry.',
    'For stepped or irregular footings, split the takeoff into non-overlapping sections.',
  ],
  sources: [geometry, inchFooting],
  calculate(v) {
    const shape = Math.round(v.shape);
    let footprint: number;
    if (shape === 2) footprint = v.side * v.side;
    else if (shape === 3) footprint = Math.PI * (v.diameter / 2) ** 2;
    else footprint = v.length * v.width;
    const netFt3 = footprint * v.depth * v.quantity;
    const orderFt3 = netFt3 * waste(v);
    return result([
      row('orderYd', 'Volume including allowance', orderFt3 / 27, 'yd³'),
      row('netYd', 'Geometric volume', netFt3 / 27, 'yd³'),
      row('ft3', 'Volume including allowance', orderFt3, 'ft³'),
      row('m3', 'Volume including allowance', orderFt3 / FT_PER_M ** 3, 'm³'),
      row('liters', 'Volume including allowance', orderFt3 / FT_PER_M ** 3 * 1000, 'L'),
      row('footprint', 'Footprint area per footing', footprint, 'ft²'),
    ], [
      `Footprint area = ${fmt(footprint)} ft².`,
      `${fmt(footprint)} × ${fmt(v.depth)} × ${v.quantity} = ${fmt(netFt3)} ft³ geometric.`,
      `Allowance factor ${fmt(waste(v))} → ${fmt(orderFt3)} ft³ = ${fmt(orderFt3 / 27)} yd³.`,
    ]);
  },
};

const footingConcrete: Model = {
  fields: [
    { id: 'shape', label: 'Footing geometry', value: 0, integer: true, min: 0, max: 3, options: [
      { value: 0, label: 'Strip / continuous' },
      { value: 1, label: 'Rectangular pad' },
      { value: 2, label: 'Square pad' },
      { value: 3, label: 'Round pad / pier' },
    ] },
    { ...length('length', 'Length / run', 20, 'ft'), visibleWhen: { field: 'shape', in: [0, 1] } },
    { ...length('width', 'Width', 16, 'in'), visibleWhen: { field: 'shape', in: [0, 1] } },
    { ...length('side', 'Square side', 24, 'in'), visibleWhen: { field: 'shape', equals: 2 } },
    { ...length('diameter', 'Diameter', 18, 'in'), visibleWhen: { field: 'shape', equals: 3 } },
    length('depth', 'Depth', 10, 'in'),
    count('quantity', 'Quantity', 1),
    ...concreteInputs,
  ],
  formula: 'Concrete quantity = selected footing geometry × quantity, then allowance, bag rounding, density-based weight and selected price basis.',
  assumptions: [
    'This is the broad footing material estimator. Dedicated strip, pad and pier pages expose project-specific outputs.',
    'Footing geometry must come from project requirements; this calculator does not size foundations.',
    'Bag count uses the mixed yield you enter and rounds up to whole bags.',
  ],
  sources: [geometry, inchFooting, footingGuide],
  calculate(v, u) {
    const shape = Math.round(v.shape);
    let footprint: number;
    if (shape === 2) footprint = v.side * v.side;
    else if (shape === 3) footprint = Math.PI * (v.diameter / 2) ** 2;
    else footprint = v.length * v.width;
    const cuFt = footprint * v.depth * v.quantity;
    return concreteResult(cuFt, v, u, [
      `Footprint area = ${fmt(footprint)} ft².`,
      `${fmt(footprint)} × ${fmt(v.depth)} × ${v.quantity} = ${fmt(cuFt)} ft³.`,
    ], [row('footprint', 'Footprint area per footing', footprint, 'ft²')]);
  },
};

const foundationWall: Model = {
  fields: [
    length('length', 'Total wall length (centerline)', 80, 'ft'),
    length('height', 'Wall height', 8, 'ft'),
    length('thickness', 'Wall thickness', 8, 'in'),
    positiveOrZero(area('openings', 'Combined opening area', 0, 0), { help: 'Total wall-face area of doors, windows and utility openings.' }),
    count('quantity', 'Identical wall sections', 1),
    ...concreteInputs,
  ],
  formula: 'Gross wall V = centerline length × height × thickness × quantity. Opening deduction = opening area × thickness × quantity.',
  assumptions: [
    'Use centerline wall length so connected corners are counted once.',
    'Opening input is wall-face area and is converted to volume by multiplying by wall thickness.',
    'Form-contact area reports the two main wall faces only; ends, corners, pilasters and special forms are separate.',
  ],
  sources: [geometry, aci],
  calculate(v, u) {
    const gross = v.length * v.height * v.thickness * v.quantity;
    const openingsFt3 = v.openings * v.thickness * v.quantity;
    requireCondition(openingsFt3 <= gross, 'openings', 'Opening volume cannot exceed the measured wall volume.');
    const net = gross - openingsFt3;
    const face = v.length * v.height * v.quantity;
    return concreteResult(net, v, u, [
      `Gross: ${fmt(v.length)} × ${fmt(v.height)} × ${fmt(v.thickness)} × ${v.quantity} = ${fmt(gross)} ft³.`,
      `Openings: ${fmt(v.openings)} ft² × ${fmt(v.thickness)} × ${v.quantity} = ${fmt(openingsFt3)} ft³; net = ${fmt(net)} ft³.`,
    ], [
      row('gross', 'Gross wall volume', gross, 'ft³'),
      row('openingsVolume', 'Opening deduction', openingsFt3, 'ft³'),
      row('faceArea', 'Wall face area (one side)', face, 'ft²'),
      row('forms', 'Main form-contact area (both sides)', face * 2, 'ft²'),
    ]);
  },
};

const basementWall: Model = {
  fields: [
    length('length', 'Basement outside length', 30, 'ft'),
    length('width', 'Basement outside width', 20, 'ft'),
    length('height', 'Wall height', 8, 'ft'),
    length('thickness', 'Wall thickness', 8, 'in'),
    positiveOrZero(area('openings', 'Combined opening area', 20, 0)),
    positiveOrZero(length('extraWall', 'Additional interior / jog wall length', 0, 'ft')),
    ...concreteInputs,
  ],
  formula: 'Wall run = 2 × (length + width) + extra wall length. Net wall volume = run × height × thickness − opening area × thickness.',
  assumptions: [
    'The main basement is modeled as a rectangle; add measured interior/jog wall length separately.',
    'Opening area is deducted once from the wall-face area.',
    'This estimates cast-in-place wall concrete and main face-form area; footings, slab, reinforcement, waterproofing and drainage are separate.',
  ],
  sources: [geometry, aci, footingGuide],
  calculate(v, u) {
    const perimeter = 2 * (v.length + v.width) + v.extraWall;
    const gross = perimeter * v.height * v.thickness;
    const openingFt3 = v.openings * v.thickness;
    requireCondition(openingFt3 <= gross, 'openings', 'Opening area is larger than the measured basement wall face.');
    const net = gross - openingFt3;
    const face = perimeter * v.height;
    return concreteResult(net, v, u, [
      `Wall run: 2 × (${fmt(v.length)} + ${fmt(v.width)}) + ${fmt(v.extraWall)} = ${fmt(perimeter)} ft.`,
      `Gross: ${fmt(perimeter)} × ${fmt(v.height)} × ${fmt(v.thickness)} = ${fmt(gross)} ft³.`,
      `Opening deduction = ${fmt(openingFt3)} ft³; net = ${fmt(net)} ft³.`,
    ], [
      row('perimeter', 'Total basement wall run', perimeter, 'ft'),
      row('floorArea', 'Basement footprint area', v.length * v.width, 'ft²'),
      row('gross', 'Gross wall volume', gross, 'ft³'),
      row('forms', 'Main form-contact area (both sides)', face * 2, 'ft²'),
    ]);
  },
};

const crawlSpace: Model = {
  fields: [
    length('length', 'Crawl-space outside length', 30, 'ft'),
    length('width', 'Crawl-space outside width', 20, 'ft'),
    length('wallHeight', 'Stem-wall height', 3, 'ft'),
    length('thickness', 'Stem-wall thickness', 8, 'in'),
    positiveOrZero(length('interiorWall', 'Interior stem-wall length', 0, 'ft')),
    positiveOrZero(area('openings', 'Vent / access opening area', 8, 0)),
    ...concreteInputs,
  ],
  formula: 'Total stem-wall run = outside perimeter + interior stem-wall length. Net volume = run × wall height × thickness − opening area × thickness.',
  assumptions: [
    'The outside crawl-space footprint is modeled as a rectangle; interior stem-wall length is added separately.',
    'Vent and access openings are entered as total wall-face area and deducted once.',
    'This estimates stem-wall concrete only. Footings, piers, vapor barrier, excavation, drainage and framing are separate.',
  ],
  sources: [geometry, aci],
  calculate(v, u) {
    const outside = 2 * (v.length + v.width);
    const run = outside + v.interiorWall;
    const gross = run * v.wallHeight * v.thickness;
    const openingFt3 = v.openings * v.thickness;
    requireCondition(openingFt3 <= gross, 'openings', 'Vent/access opening area exceeds the measured stem-wall face.');
    const net = gross - openingFt3;
    return concreteResult(net, v, u, [
      `Outside perimeter: 2 × (${fmt(v.length)} + ${fmt(v.width)}) = ${fmt(outside)} ft.`,
      `Total stem-wall run: ${fmt(outside)} + ${fmt(v.interiorWall)} = ${fmt(run)} ft.`,
      `Gross: ${fmt(run)} × ${fmt(v.wallHeight)} × ${fmt(v.thickness)} = ${fmt(gross)} ft³; openings = ${fmt(openingFt3)} ft³.`,
    ], [
      row('perimeter', 'Outside crawl-space perimeter', outside, 'ft'),
      row('wallRun', 'Total stem-wall run', run, 'ft'),
      row('floorArea', 'Crawl-space footprint area', v.length * v.width, 'ft²'),
      row('gross', 'Gross stem-wall volume', gross, 'ft³'),
    ]);
  },
};

const foundationExcavation: Model = {
  fields: [
    length('length', 'Foundation footprint length', 30, 'ft'),
    length('width', 'Foundation footprint width', 20, 'ft'),
    length('depth', 'Excavation depth', 6, 'ft'),
    positiveOrZero(length('workingRoom', 'Working room each side', 1.5, 'ft')),
    number('swell', 'Loose-volume swell (%)', 20, 0, 'Enter the project-specific bank-to-loose swell factor.'),
    number('overbreak', 'Excavation / overbreak allowance (%)', 0, 0, 'Optional extra bank volume for measured overbreak or irregular excavation.'),
    number('bankRate', 'Excavation quote (USD / bank yd³)', 0, 0),
    number('haulRate', 'Haul/disposal quote (USD / loose yd³)', 0, 0),
    number('fixed', 'Mobilization / fixed cost (USD)', 0, 0),
  ],
  formula: 'Excavation L/W = foundation footprint + 2 × working room. Bank volume = L × W × depth × (1 + overbreak%). Loose volume = bank volume × (1 + swell%).',
  assumptions: [
    'Rectangular vertical-sided excavation. Sloped sides, benches, shoring and irregular ground require separate geometry.',
    'Working room is added on both sides of each plan dimension.',
    'Overbreak increases bank excavation once; swell converts bank volume to loose haul volume and is not a second waste factor.',
  ],
  sources: [excavationGuide],
  calculate(v) {
    const excL = v.length + 2 * v.workingRoom;
    const excW = v.width + 2 * v.workingRoom;
    const rawFt3 = excL * excW * v.depth;
    const bankFt3 = rawFt3 * (1 + v.overbreak / 100);
    const bankYd3 = bankFt3 / 27;
    const looseYd3 = bankYd3 * (1 + v.swell / 100);
    const excavationCharge = bankYd3 * v.bankRate;
    const haulCharge = looseYd3 * v.haulRate;
    const total = excavationCharge + haulCharge + v.fixed;
    return result([
      row('bank', 'Bank excavation volume', bankYd3, 'yd³'),
      row('loose', 'Loose haul volume', looseYd3, 'yd³'),
      row('m3', 'Bank excavation volume', bankFt3 / FT_PER_M ** 3, 'm³'),
      row('excL', 'Excavation plan length', excL, 'ft'),
      row('excW', 'Excavation plan width', excW, 'ft'),
      row('excavationCharge', 'Excavation charge', excavationCharge, 'USD'),
      row('haulCharge', 'Haul / disposal charge', haulCharge, 'USD'),
      row('total', 'Entered-scope excavation total', total, 'USD'),
    ], [
      `Plan with working room: (${fmt(v.length)} + 2 × ${fmt(v.workingRoom)}) × (${fmt(v.width)} + 2 × ${fmt(v.workingRoom)}) = ${fmt(excL)} × ${fmt(excW)} ft.`,
      `${fmt(excL)} × ${fmt(excW)} × ${fmt(v.depth)} × ${fmt(1 + v.overbreak / 100)} = ${fmt(bankYd3)} bank yd³.`,
      `${fmt(bankYd3)} × ${fmt(1 + v.swell / 100)} = ${fmt(looseYd3)} loose yd³.`,
    ]);
  },
};

const foundationCost: Model = {
  fields: [
    { id: 'foundationType', label: 'Foundation concrete geometry', value: 0, integer: true, min: 0, max: 2, options: [
      { value: 0, label: 'Slab / pad' },
      { value: 1, label: 'Concrete piers' },
      { value: 2, label: 'Continuous strip footing' },
    ] },
    { ...length('length', 'Slab length / footing run', 20, 'ft'), visibleWhen: { field: 'foundationType', in: [0, 2] } },
    { ...length('width', 'Slab width', 20, 'ft'), visibleWhen: { field: 'foundationType', equals: 0 } },
    { ...length('thickness', 'Slab thickness', 4, 'in'), visibleWhen: { field: 'foundationType', equals: 0 } },
    { ...count('pierCount', 'Number of piers', 6), visibleWhen: { field: 'foundationType', equals: 1 } },
    { ...length('pierDiameter', 'Pier diameter', 12, 'in'), visibleWhen: { field: 'foundationType', equals: 1 } },
    { ...length('pierDepth', 'Pier depth', 36, 'in'), visibleWhen: { field: 'foundationType', equals: 1 } },
    { ...length('footingWidth', 'Footing width', 16, 'in'), visibleWhen: { field: 'foundationType', equals: 2 } },
    { ...length('footingDepth', 'Footing depth', 8, 'in'), visibleWhen: { field: 'foundationType', equals: 2 } },
    count('quantity', 'Identical sections', 1),
    allowance,
    densityField,
    yieldField,
    price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag', 'USD/ton']),
    { id: 'scope', label: 'Estimate scope', value: 0, integer: true, min: 0, max: 1, options: [
      { value: 0, label: 'Concrete material only' },
      { value: 1, label: 'Entered project costs' },
    ] },
    { ...number('tax', 'Material tax (%)', 0, 0), visibleWhen: { field: 'scope', equals: 1 } },
    { ...number('delivery', 'Delivery / short-load fees (USD)', 0, 0), visibleWhen: { field: 'scope', equals: 1 } },
    { ...number('excavation', 'Excavation / sitework (USD)', 0, 0), visibleWhen: { field: 'scope', equals: 1 } },
    { ...number('forms', 'Forms (USD)', 0, 0), visibleWhen: { field: 'scope', equals: 1 } },
    { ...number('reinforcement', 'Reinforcement (USD)', 0, 0), visibleWhen: { field: 'scope', equals: 1 } },
    { ...number('waterproofing', 'Waterproofing / drainage (USD)', 0, 0), visibleWhen: { field: 'scope', equals: 1 } },
    { ...number('labor', 'Labor / equipment (USD)', 0, 0), visibleWhen: { field: 'scope', equals: 1 } },
  ],
  formula: 'Concrete volume follows selected geometry. Material cost uses the selected price basis. Full scope adds only entered tax and project-cost line items.',
  assumptions: [
    'This estimates concrete material and only the additional costs you enter; it is not a contractor bid.',
    'Foundation type, dimensions, reinforcement, frost depth and bearing requirements are design inputs.',
    'Material-only mode ignores hidden project-cost values.',
  ],
  sources: [geometry, inchFooting, footingGuide],
  calculate(v, u) {
    const type = Math.round(v.foundationType);
    let cuFt: number;
    let geometryStep: string;
    if (type === 1) {
      const r = v.pierDiameter / 2;
      cuFt = Math.PI * r * r * v.pierDepth * v.pierCount * v.quantity;
      geometryStep = `Piers: π × ${fmt(r)}² × ${fmt(v.pierDepth)} × ${v.pierCount} × ${v.quantity} = ${fmt(cuFt)} ft³.`;
    } else if (type === 2) {
      cuFt = v.length * v.footingWidth * v.footingDepth * v.quantity;
      geometryStep = `Strip: ${fmt(v.length)} × ${fmt(v.footingWidth)} × ${fmt(v.footingDepth)} × ${v.quantity} = ${fmt(cuFt)} ft³.`;
    } else {
      cuFt = v.length * v.width * v.thickness * v.quantity;
      geometryStep = `Slab/pad: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.thickness)} × ${v.quantity} = ${fmt(cuFt)} ft³.`;
    }
    const b = priceBasis(cuFt, v, u);
    const material = Number.isFinite(v.price) ? b.priceQty * v.price : 0;
    const full = Math.round(v.scope) === 1;
    const tax = full ? material * v.tax / 100 : 0;
    const extras = full ? v.delivery + v.excavation + v.forms + v.reinforcement + v.waterproofing + v.labor : 0;
    const total = material + tax + extras;
    return result([
      row('total', full ? 'Estimated entered-scope total' : 'Estimated concrete material total', total, 'USD'),
      row('yards', 'Concrete to order', b.orderYd3, 'yd³'),
      row('ft3', 'Concrete to order', b.orderFt3, 'ft³'),
      row('bags', 'Bags at entered yield', b.bags, 'bags', true),
      row('weight', 'Estimated order weight', b.lb, 'lb'),
      row('materials', 'Concrete material subtotal', material, 'USD'),
      ...(full ? [
        row('tax', 'Material tax', tax, 'USD'),
        row('delivery', 'Delivery / short-load', v.delivery, 'USD'),
        row('excavation', 'Excavation / sitework', v.excavation, 'USD'),
        row('forms', 'Forms', v.forms, 'USD'),
        row('reinforcement', 'Reinforcement', v.reinforcement, 'USD'),
        row('waterproofing', 'Waterproofing / drainage', v.waterproofing, 'USD'),
        row('labor', 'Labor / equipment', v.labor, 'USD'),
      ] : []),
    ], [
      geometryStep,
      `Allowance → ${fmt(b.orderYd3)} yd³ to order.`,
      `Selected price basis: ${fmt(b.priceQty)} ${u.price || 'USD/yd3'} × $${fmt(v.price)} = $${fmt(material)}.`,
      full ? `Entered project additions + tax produce $${fmt(total)} total.` : 'Material-only scope excludes hidden project-cost values.',
    ]);
  },
};

export const foundationModels: Record<string, Model> = {
  'foundation-cost-dedicated': foundationCost,
  'foundation-excavation-dedicated': foundationExcavation,
  'strip-footing-dedicated': stripFooting,
  'pad-footing-dedicated': padFooting,
  'pier-footing-dedicated': pierFooting,
  'footing-volume-dedicated': footingVolume,
  'footing-concrete-dedicated': footingConcrete,
  'foundation-wall-dedicated': foundationWall,
  'basement-wall-dedicated': basementWall,
  'crawl-space-dedicated': crawlSpace,
};
