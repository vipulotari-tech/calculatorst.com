import type { Field, Model } from './calculator-types.ts';
import { FT_PER_M, allowance, count, fmt, length, number, positiveOrZero, price, requireCondition, result, roundUp, row, volume, waste } from './calculator-math.ts';
import { concreteResult, densityField, densityLb, yieldField } from './models-materials.ts';

const geometry = 'https://www.calculatorsoup.com/calculators/construction/concrete-calculator.php';
const quikrete = 'https://www.quikrete.com/calculator/main.asp';
const patioGuide = 'https://www.concretenetwork.com/concrete/howmuch/for-a-patio.html';
const drivewayGuide = 'https://www.concretenetwork.com/concrete/howmuch/for-a-driveway.html';
const patioCostGuide = 'https://www.inchcalculator.com/cost-to-install-concrete-patio/';
const drivewayCostGuide = 'https://www.inchcalculator.com/concrete-driveway-cost-guide/';

const zone = (mode: number) => ({ field: 'mode', equals: mode });
const modeOptions = (min: number, max: number, labels: { value: number; label: string }[]) => ({
  id: 'mode', label: 'Calculation mode', value: 0, integer: true, min, max,
  options: labels,
});
const scope = (labels: { value: number; label: string }[]) => ({
  id: 'scope', label: 'Estimate scope', value: 0, integer: true, min: 0, max: 1, options: labels,
});

// ==========================================================
// THICKNESS — slab / driveway thickness math with 3 modes
// Shared by slab-thickness-calculator and driveway-thickness-calculator.
// Mode A: known volume -> average thickness. Mode B: chosen thickness ->
// required concrete. Mode C: compare quantity across chosen thicknesses.
// This solves coverage/depth MATH; it never selects a structurally
// adequate slab or pavement thickness.
// ==========================================================
const thicknessFields: Field[] = [
  modeOptions(0, 2, [
    { value: 0, label: 'Volume → average thickness' },
    { value: 1, label: 'Thickness → concrete required' },
    { value: 2, label: 'Compare thickness scenarios' },
  ]),
  length('length', 'Length', 10),
  length('width', 'Width', 10),
  { ...volume('volume', 'Concrete volume', 1), visibleWhen: zone(0) },
  { ...length('thickness', 'Selected thickness', 4, 'in'), visibleWhen: zone(1) },
  { ...length('compareA', 'Scenario A thickness', 4, 'in'), visibleWhen: zone(2) },
  { ...length('compareB', 'Scenario B thickness', 5, 'in'), visibleWhen: zone(2) },
  { ...length('compareC', 'Scenario C thickness', 6, 'in'), visibleWhen: zone(2) },
  { ...allowance, visibleWhen: { field: 'mode', in: [1, 2] } },
  { ...densityField, visibleWhen: { field: 'mode', in: [1, 2] } },
  { ...yieldField, visibleWhen: { field: 'mode', in: [1, 2] } },
  { ...price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']), visibleWhen: { field: 'mode', in: [1, 2] } },
];

const thickness: Model = {
  fields: thicknessFields,
  formula: 'Mode A: average thickness = volume / (length × width). Mode B: volume = length × width × selected thickness, then allowance, bags and weight. Mode C: volume = length × width × thickness for each scenario.',
  assumptions: [
    'This tool converts between concrete volume, footprint area and thickness mathematically. It does not determine a structurally adequate slab or pavement thickness.',
    'Thickness is an input from the project design. Vehicle loading, soil, base preparation, reinforcement, climate and local requirements can govern the required section.',
    'Mode B and Mode C estimate material quantity for the thickness scenarios you choose; they are not thickness recommendations.',
    'Volume and area must describe the same placed or compacted condition.',
  ],
  sources: [geometry, quikrete],
  calculate(v, u) {
    const area = v.length * v.width;
    requireCondition(area > 0, 'width', 'Length and width must cover a positive area.');
    const mode = Math.round(v.mode);

    if (mode === 0) {
      const depthFt = v.volume / area;
      return result(
        [
          row('depth', 'Average thickness (in)', depthFt * 12, 'in'),
          row('mm', 'Average thickness (mm)', depthFt / FT_PER_M * 1000, 'mm'),
          row('cm', 'Average thickness (cm)', depthFt * 12 * 2.54, 'cm'),
          row('ft', 'Average thickness (ft)', depthFt, 'ft'),
          row('area', 'Covered area (ft²)', area, 'ft²'),
          row('m2', 'Covered area (m²)', area / FT_PER_M ** 2, 'm²'),
        ],
        [
          `Area: ${fmt(v.length)} × ${fmt(v.width)} = ${fmt(area)} ft².`,
          `Average thickness = ${fmt(v.volume)} ft³ ÷ ${fmt(area)} ft² = ${fmt(depthFt)} ft = ${fmt(depthFt * 12)} in.`,
          'This is the average material depth for even distribution of the given volume. It is not a structural thickness recommendation.',
        ]
      );
    }

    if (mode === 1) {
      const cuFt = area * v.thickness;
      const extra = [row('area', 'Covered area (ft²)', area, 'ft²')];
      return concreteResult(cuFt, v, {}, [
        `Volume: ${fmt(area)} ft² × ${fmt(v.thickness)} ft = ${fmt(cuFt)} ft³.`,
        'This is the concrete quantity for the thickness you selected — a quantity result, not a thickness recommendation.',
      ], extra);
    }

    // Mode C — compare scenarios
    const scenarios = [
      { key: 'A', in: v.compareA },
      { key: 'B', in: v.compareB },
      { key: 'C', in: v.compareC },
    ];
    const rows: { key: string; label: string; value: number; unit: string; discrete?: boolean }[] = [];
    const steps: string[] = [`Area: ${fmt(area)} ft². Each scenario is geometric volume with and without the ${fmt(v.waste)}% allowance.`];
    for (const s of scenarios) {
      const cuFt = area * s.in;
      const orderFt3 = cuFt * waste(v);
      const orderYd3 = orderFt3 / 27;
      const bags = roundUp(orderFt3 / v.yield);
      const weightLb = orderFt3 * densityLb(v.density, u.density);
      rows.push(row(`vol${s.key}`, `Concrete @ ${fmt(s.in * 12)} in (geometric, yd³)`, cuFt / 27, 'yd³'));
      rows.push(row(`order${s.key}`, `Order @ ${fmt(s.in * 12)} in (with allowance, yd³)`, orderYd3, 'yd³'));
      rows.push(row(`bags${s.key}`, `Bags @ ${fmt(s.in * 12)} in`, bags, 'bags', true));
      rows.push(row(`weight${s.key}`, `Order weight @ ${fmt(s.in * 12)} in`, weightLb, 'lb'));
      if (Number.isFinite(v.price)) {
        const bases: Record<string, number> = {
          'USD/yd3': orderYd3,
          'USD/m3': orderFt3 / FT_PER_M ** 3,
          'USD/ft3': orderFt3,
          'USD/bag': bags,
        };
        const priceQty = bases[u.price] ?? orderYd3;
        rows.push(row(`cost${s.key}`, `Material cost @ ${fmt(s.in * 12)} in`, priceQty * v.price, 'USD'));
      }
      steps.push(
        `Scenario ${s.key} — ${fmt(s.in * 12)} in: ${fmt(cuFt / 27)} yd³ geometric; ${fmt(orderYd3)} yd³ ordered; ` +
        `bags = ceil(${fmt(orderFt3)} ÷ ${fmt(v.yield)}) = ${bags}; order weight ≈ ${fmt(weightLb)} lb.`
      );
    }
    steps.push('These are quantity comparisons for the thicknesses you entered — not recommendations of any scenario.');
    return result(rows, steps, [
      'Changing thickness changes the material quantity; it does not by itself change the required reinforcement, base or curing approach.',
    ]);
  },
};

// ==========================================================
// PATIO CONCRETE — rectangular or circular patio quantities
// ==========================================================
const patioShape = {
  id: 'patioShape', label: 'Patio shape', value: 0, integer: true, min: 0, max: 1,
  options: [
    { value: 0, label: 'Rectangle' },
    { value: 1, label: 'Circle' },
  ],
};

const patioConcrete: Model = {
  fields: [
    patioShape,
    { ...length('length', 'Patio length', 12), visibleWhen: { field: 'patioShape', equals: 0 } },
    { ...length('width', 'Patio width', 10), visibleWhen: { field: 'patioShape', equals: 0 } },
    { ...length('diameter', 'Patio diameter', 12, 'ft'), visibleWhen: { field: 'patioShape', equals: 1 } },
    length('thickness', 'Patio thickness', 4, 'in'),
    count('quantity', 'Identical patios'),
    { ...positiveOrZero(length('subbaseDepth', 'Gravel subbase depth (0 = none)', 0, 'in')),
      group: 'Material & assumptions',
      help: 'Optional compacted gravel base under the patio. Enter the thickness from your base design.' },
    { ...number('truckCapacity', 'Ready-mix truck capacity (yd³)', 10, 1, 'Planning value for load count. Enter the supplier truck capacity.'), group: 'Material & assumptions' },
    allowance,
    densityField,
    yieldField,
    price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']),
  ],
  formula: 'Rectangle: V = L × W × T. Circle: V = π × (D/2)² × T. Subbase V = area × subbase depth. Perimeter (forms): rectangle 2(L+W), circle πD.',
  assumptions: [
    'A simple rectangular or circular patio with uniform thickness. Irregular footprints should be split into non-overlapping simple sections.',
    'Patio thickness is a project-design input. Enter the specified thickness; the calculator only converts geometry into quantity.',
    'The subbase quantity is compacted gravel volume; loose delivered volume depends on the supplier compaction factor.',
    'Form perimeter assumes forms on the full perimeter of the shape.',
    'Ready-mix load count is a planning estimate based only on the truck capacity you enter; supplier minimums and dispatch rules are separate.',
  ],
  sources: [geometry, quikrete, patioGuide],
  calculate(v, u) {
    const circle = Math.round(v.patioShape) === 1;
    const area = circle ? Math.PI * (v.diameter / 2) ** 2 : v.length * v.width;
    const cuFt = area * v.thickness * v.quantity;
    const orderYd = cuFt * waste(v) / 27;
    const loads = Math.max(1, roundUp(orderYd / v.truckCapacity));
    const lastLoad = Math.max(0, orderYd - (loads - 1) * v.truckCapacity);
    const extra: { key: string; label: string; value: number; unit: string; discrete?: boolean }[] = [
      row('area', 'Patio area per section (ft²)', area, 'ft²'),
      row('m2', 'Patio area per section (m²)', area / FT_PER_M ** 2, 'm²'),
      row('perimeter', 'Form perimeter (ft)', (circle ? Math.PI * v.diameter : 2 * (v.length + v.width)) * v.quantity, 'ft'),
      row('loads', 'Ready-mix truck loads (planning)', loads, 'loads', true),
      row('lastLoad', 'Final truck portion (yd³)', lastLoad, 'yd³'),
    ];
    const steps = circle
      ? [`Circle: π × (${fmt(v.diameter)}/2)² × ${fmt(v.thickness)} × ${v.quantity} = ${fmt(cuFt)} ft³.`]
      : [`Rectangle: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.thickness)} × ${v.quantity} = ${fmt(cuFt)} ft³.`];
    if (v.subbaseDepth > 0) {
      const subFt3 = area * v.subbaseDepth * v.quantity;
      extra.push(row('subbase', 'Gravel subbase volume (yd³)', subFt3 / 27, 'yd³'));
      steps.push(`Gravel subbase: ${fmt(area)} ft² × ${fmt(v.subbaseDepth)} ft × ${v.quantity} = ${fmt(subFt3 / 27)} yd³ (compacted).`);
    }
    steps.push(`${fmt(orderYd)} yd³ ÷ ${fmt(v.truckCapacity)} yd³ per truck = ${loads} load(s); final load ≈ ${fmt(lastLoad)} yd³.`);
    return concreteResult(cuFt, v, u, steps, extra);
  },
};

// ==========================================================
// DRIVEWAY CONCRETE — rectangle, rectangle + apron, or
// trapezoid (varying width) driveway quantities
// ==========================================================
const driveShape = {
  id: 'driveShape', label: 'Driveway shape', value: 0, integer: true, min: 0, max: 2,
  options: [
    { value: 0, label: 'Rectangle' },
    { value: 1, label: 'Rectangle + apron' },
    { value: 2, label: 'Trapezoid (varying width)' },
  ],
};

const drivewayConcrete: Model = {
  fields: [
    driveShape,
    length('length', 'Driveway length', 24),
    { ...length('width', 'Driveway width', 10), visibleWhen: { field: 'driveShape', in: [0, 1] } },
    { ...length('apronLength', 'Apron length (street end)', 4, 'ft'), visibleWhen: { field: 'driveShape', equals: 1 } },
    { ...length('apronWidth', 'Apron width', 14, 'ft'), visibleWhen: { field: 'driveShape', equals: 1 } },
    { ...length('widthStreet', 'Width at street end', 10, 'ft'), visibleWhen: { field: 'driveShape', equals: 2 } },
    { ...length('widthHouse', 'Width at house end', 20, 'ft'), visibleWhen: { field: 'driveShape', equals: 2 } },
    length('thickness', 'Driveway thickness', 4, 'in'),
    count('quantity', 'Identical driveways'),
    { ...positiveOrZero(length('subbaseDepth', 'Compacted gravel base depth (0 = none)', 0, 'in')),
      group: 'Material & assumptions',
      help: 'Optional compacted base quantity. Enter the project base thickness; loose delivered volume can differ.' },
    { ...number('truckCapacity', 'Ready-mix truck capacity (yd³)', 10, 1, 'Planning value for load count. Enter the actual truck capacity used by the ready-mix supplier.'),
      group: 'Material & assumptions' },
    allowance,
    densityField,
    yieldField,
    price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']),
  ],
  formula: 'Rectangle: V = L × W × T. With apron: V = (main L × main W + apron L × apron W) × T. Trapezoid: area = length × (width at street + width at house) / 2, then V = area × T.',
  assumptions: [
    'The apron is modeled as a separate rectangle added at one end and is assumed to use the same thickness as the main driveway.',
    'Trapezoid mode uses area = length × average width. This is exact only when the width changes linearly along the length; for irregular widths, split the driveway into rectangles.',
    'Driveway thickness must come from the pavement/project design. This calculator estimates material quantity for the thickness you enter.',
    'Truck load count is a planning estimate; capacity varies by supplier, distance and mix type.',
    'Optional gravel-base output is compacted geometric volume for the same footprint; loose delivered volume can differ.',
  ],
  sources: [geometry, quikrete, drivewayGuide],
  calculate(v, u) {
    const shape = Math.round(v.driveShape);
    let area: number;
    let steps: string[];
    if (shape === 1) {
      area = v.length * v.width + v.apronLength * v.apronWidth;
      steps = [`Main drive: ${fmt(v.length)} × ${fmt(v.width)} = ${fmt(v.length * v.width)} ft²; apron: ${fmt(v.apronLength)} × ${fmt(v.apronWidth)} = ${fmt(v.apronLength * v.apronWidth)} ft².`];
    } else if (shape === 2) {
      requireCondition(v.widthStreet > 0 && v.widthHouse > 0, 'widthStreet', 'Enter positive widths at both ends.');
      area = v.length * (v.widthStreet + v.widthHouse) / 2;
      steps = [`Trapezoid area = ${fmt(v.length)} × (${fmt(v.widthStreet)} + ${fmt(v.widthHouse)}) / 2 = ${fmt(area)} ft² (average-width approximation).`];
    } else {
      area = v.length * v.width;
      steps = [`Rectangle: ${fmt(v.length)} × ${fmt(v.width)} = ${fmt(area)} ft².`];
    }
    const cuFt = area * v.thickness * v.quantity;
    const orderYd = cuFt * waste(v) / 27;
    const loads = Math.max(1, roundUp(orderYd / v.truckCapacity));
    const lastLoad = Math.max(0, orderYd - (loads - 1) * v.truckCapacity);
    steps.push(`${fmt(orderYd)} yd³ ÷ ${fmt(v.truckCapacity)} yd³ per truck = ${loads} load(s); final load ≈ ${fmt(lastLoad)} yd³.`);
    const extra: { key: string; label: string; value: number; unit: string; discrete?: boolean }[] = [
      row('area', 'Driveway area per section (ft²)', area, 'ft²'),
      row('loads', 'Ready-mix truck loads (planning)', loads, 'loads', true),
      row('lastLoad', 'Final truck portion (yd³)', lastLoad, 'yd³'),
    ];
    if (v.subbaseDepth > 0) {
      const subbaseFt3 = area * v.subbaseDepth * v.quantity;
      extra.push(row('subbase', 'Compacted gravel base (yd³)', subbaseFt3 / 27, 'yd³'));
      steps.push(`Gravel base: ${fmt(area)} ft² × ${fmt(v.subbaseDepth)} ft × ${v.quantity} = ${fmt(subbaseFt3 / 27)} yd³ compacted.`);
    }
    return concreteResult(cuFt, v, u, steps, extra);
  },
};

// ==========================================================
// GARAGE SLAB — slab + thickened perimeter + gravel base +
// vapor barrier + forms
// ==========================================================
const garageSlab: Model = {
  fields: [
    length('length', 'Garage length', 20),
    length('width', 'Garage width', 20),
    length('thickness', 'Slab thickness', 4, 'in'),
    count('quantity', 'Identical slab sections'),
    positiveOrZero(length('edgeDepth', 'Thickened perimeter total depth (0 = none)', 0, 'in')),
    positiveOrZero(length('edgeWidth', 'Thickened perimeter width', 0, 'in')),
    { ...positiveOrZero(length('gravelDepth', 'Compacted gravel base depth (0 = none)', 4, 'in')),
      group: 'Material & assumptions',
      help: 'Optional gravel base under the slab. Enter the compacted base thickness specified for the project.' },
    { id: 'vaporBarrier', label: 'Vapor barrier', value: 0, integer: true, min: 0, max: 1,
      options: [
        { value: 0, label: 'None' },
        { value: 1, label: 'Include under slab' },
      ], group: 'Material & assumptions' },
    { ...number('truckCapacity', 'Ready-mix truck capacity (yd³)', 10, 1, 'Planning value for load count. Enter the supplier truck capacity.'), group: 'Material & assumptions' },
    allowance,
    densityField,
    yieldField,
    price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']),
  ],
  formula: 'Slab V = L × W × T × sections. Thickened-edge extra V = [L × W − (L − 2w) × (W − 2w)] × (edge depth − slab thickness) × sections. Gravel base V = L × W × base depth. Vapor barrier area = L × W.',
  assumptions: [
    'The thickened edge is modeled as an inward perimeter band inside the slab footprint; corner areas are counted once. Extra depth equals total edge depth minus slab thickness.'
    'Gravel base quantity is compacted volume; loose delivered volume depends on the supplier conversion.',
    'Slab thickness must come from the project design. Vehicle type alone does not determine the required section.',
    'This estimates material quantity; rebar, dowels, insulation and finishing are separate items.',
    'Ready-mix load count is a planning estimate based on the truck capacity you enter.',
  ],
  sources: [geometry, quikrete],
  calculate(v, u) {
    const floor = v.length * v.width * v.quantity;
    const slabCuFt = floor * v.thickness;
    let edgeFt3 = 0;
    if (v.edgeDepth > v.thickness && v.edgeWidth > 0) {
      requireCondition(2 * v.edgeWidth < v.length && 2 * v.edgeWidth < v.width, 'edgeWidth', 'Twice the thickened-edge width must be smaller than both slab dimensions.');
      const bandArea = v.length * v.width - (v.length - 2 * v.edgeWidth) * (v.width - 2 * v.edgeWidth);
      edgeFt3 = bandArea * v.quantity * (v.edgeDepth - v.thickness);
    }
    const total = slabCuFt + edgeFt3;
    const steps = [
      `Slab: ${fmt(floor)} ft² × ${fmt(v.thickness)} ft = ${fmt(slabCuFt)} ft³.`,
    ];
    const extra: { key: string; label: string; value: number; unit: string; discrete?: boolean }[] = [
      row('floor', 'Floor area (ft²)', floor, 'ft²'),
      row('slabOnly', 'Slab concrete (ft³)', slabCuFt, 'ft³'),
    ];
    if (edgeFt3 > 0) {
      extra.push(row('edge', 'Thickened perimeter (ft³)', edgeFt3, 'ft³'));
      steps.push(`Thickened perimeter: ${fmt(edgeFt3)} ft³ added (total edge depth ${fmt(v.edgeDepth * 12)} in versus ${fmt(v.thickness * 12)} in slab thickness).`);
    }
    if (v.gravelDepth > 0) {
      const gravelFt3 = floor * v.gravelDepth;
      extra.push(row('gravel', 'Gravel base volume (yd³)', gravelFt3 / 27, 'yd³'));
      steps.push(`Gravel base: ${fmt(floor)} ft² × ${fmt(v.gravelDepth)} ft = ${fmt(gravelFt3 / 27)} yd³ (compacted).`);
    }
    if (Math.round(v.vaporBarrier) === 1) {
      extra.push(row('vapor', 'Vapor barrier area (ft²)', floor, 'ft²'));
    }
    extra.push(row('forms', 'Form perimeter (ft)', 2 * (v.length + v.width) * v.quantity, 'ft'));
    const orderYd = total * waste(v) / 27;
    const loads = Math.max(1, roundUp(orderYd / v.truckCapacity));
    const lastLoad = Math.max(0, orderYd - (loads - 1) * v.truckCapacity);
    extra.push(row('loads', 'Ready-mix truck loads (planning)', loads, 'loads', true));
    extra.push(row('lastLoad', 'Final truck portion (yd³)', lastLoad, 'yd³'));
    steps.push(`${fmt(orderYd)} yd³ ÷ ${fmt(v.truckCapacity)} yd³ per truck = ${loads} load(s); final load ≈ ${fmt(lastLoad)} yd³.`);
    return concreteResult(total, v, u, steps, extra);
  },
};

// ==========================================================
// PROJECT COST — shared engine for the slab / patio / driveway
// cost calculators. Material-only scope vs full project estimate.
// ==========================================================
const ITEM_LABEL: Record<string, string> = {
  delivery: 'Delivery fee',
  shortLoad: 'Short-load fee',
  pump: 'Concrete pump fee',
  subbase: 'Subbase / gravel',
  reinforcement: 'Reinforcement',
  forms: 'Formwork',
  finishing: 'Finishing',
  decorative: 'Decorative finish',
  joints: 'Control-joint cutting',
  labor: 'Labor charge',
  demolition: 'Demolition / removal',
  disposal: 'Disposal / haul-away',
};

function lineItem(id: string, label: string, help: string): Field {
  return { ...number(id, `${label} ($)`, 0, 0), group: 'Cost', help, visibleWhen: { field: 'scope', equals: 1 } };
}

const taxField: Field = {
  ...number('tax', 'Sales tax on material (%)', 0, 0, 'Tax applies to the material subtotal only, not delivery, labor or fees.'),
  group: 'Cost',
  visibleWhen: { field: 'scope', equals: 1 },
};

function projectCostResult(
  cuFt: number,
  v: Record<string, number>,
  u: Record<string, string>,
  itemIds: string[],
  steps: string[]
) {
  const total = cuFt * waste(v);
  const bags = roundUp(total / v.yield);
  const lb = total * densityLb(v.density, u.density);
  const volumes: Record<string, number> = {
    'USD/yd3': total / 27,
    'USD/m3': total / FT_PER_M ** 3,
    'USD/ft3': total,
    'USD/bag': bags,
    'USD/ton': lb / 2000,
  };
  const qty = volumes[u.price] ?? total / 27;
  const rows: { key: string; label: string; value: number; unit: string; discrete?: boolean }[] = [
    row('order', 'Concrete to order', total / 27, 'yd³'),
    row('net', 'Geometric volume', cuFt / 27, 'yd³'),
    row('ft3', 'Order volume (ft³)', total, 'ft³'),
    row('m3', 'Order volume (m³)', total / FT_PER_M ** 3, 'm³'),
    row('bags', `Bags (entered yield ${fmt(v.yield)} ft³)`, bags, 'bags', true),
    row('weight', 'Estimated order weight (lb)', lb, 'lb'),
    row('tons', 'Estimated order weight (US tons)', lb / 2000, 'US tons'),
  ];

  if (Number.isFinite(v.price)) {
    const materials = qty * v.price;
    const fullScope = Math.round(v.scope) === 1;
    const taxAmt = fullScope ? materials * (v.tax / 100) : 0;
    const itemValues = fullScope
      ? itemIds.map((id) => ({ id, value: Number.isFinite(v[id]) ? v[id] : 0 }))
      : itemIds.map((id) => ({ id, value: 0 }));
    const sumItems = itemValues.reduce((sum, item) => sum + item.value, 0);
    const totalCost = materials + taxAmt + sumItems;
    const area = v.length * v.width * (v.quantity ?? 1);
    const costPerSqFt = area > 0 ? totalCost / area : NaN;
    const effectivePerYd3 = total / 27 > 0 ? totalCost / (total / 27) : NaN;

    rows.push(
      row('materials', 'Material subtotal', materials, 'USD'),
      ...(fullScope ? [row('tax', 'Material tax', taxAmt, 'USD')] : []),
      ...itemValues.filter(it => it.value > 0).map(it => row(it.id, ITEM_LABEL[it.id], it.value, 'USD')),
      row('total', fullScope ? 'Estimated project total' : 'Estimated material total', totalCost, 'USD'),
    );
    if (Number.isFinite(effectivePerYd3)) rows.push(row('effYd3', 'Effective cost per yd³', effectivePerYd3, 'USD/yd³'));
    if (Number.isFinite(costPerSqFt)) rows.push(row('sqft', 'Cost per square foot', costPerSqFt, 'USD/ft²'));

    const totalRow = rows.splice(rows.findIndex(r => r.key === 'total'), 1)[0];
    rows.unshift(totalRow);

    steps.push(`Material: ${fmt(qty)} units × ${fmt(v.price)} = ${fmt(materials)}.`);
    if (fullScope) {
      steps.push(`Material tax ${fmt(v.tax)}% = ${fmt(taxAmt)}.`);
      itemValues.filter(it => it.value > 0).forEach(it => steps.push(`${ITEM_LABEL[it.id]}: ${fmt(it.value)}.`));
    } else {
      steps.push('Material-only scope ignores hidden project-fee values.');
    }
    steps.push(`Estimated total: ${fmt(totalCost)}.`);
  } else {
    steps.push('Enter a material price to build the cost breakdown.');
  }
  return result(rows, steps);
}

// 1. SLAB COST — rectangular slab, material-only or full project scope
const slabCost: Model = {
  fields: [
    length('length', 'Slab length', 10),
    length('width', 'Slab width', 10),
    length('depth', 'Slab thickness', 4, 'in'),
    count('quantity', 'Identical slabs'),
    allowance,
    densityField,
    yieldField,
    price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag', 'USD/ton']),
    scope([
      { value: 0, label: 'Concrete material only' },
      { value: 1, label: 'Full project estimate' },
    ]),
    lineItem('delivery', 'Delivery fee', 'Flat delivery charge, not per yard.'),
    lineItem('shortLoad', 'Short-load fee', 'Applied when an order falls below the supplier minimum.'),
    lineItem('pump', 'Pump fee', 'Flat boom or line pump charge.'),
    lineItem('subbase', 'Subbase / gravel', 'Compacted gravel base material.'),
    lineItem('reinforcement', 'Reinforcement', 'Rebar, mesh, chairs and tie wire.'),
    lineItem('forms', 'Formwork', 'Form material and stakes.'),
    lineItem('finishing', 'Finishing', 'Screeding, troweling, curing compound.'),
    lineItem('labor', 'Labor', 'Crew labor for the slab.'),
    taxField,
  ],
  formula: 'Volume = L × W × T × quantity. Total = material subtotal × (1 + tax/100) + delivery + short-load + pump + subbase + reinforcement + forms + finishing + labor.',
  assumptions: [
    'Material-only scope estimates only concrete quantity × price and ignores hidden project-fee values. Full-project scope adds only the editable line items you enter.'
    'Thickness must come from the project plans or engineer; volume alone does not establish load capacity.',
    'Tax applies to the material subtotal only. Delivery, labor and fees are not taxed unless your jurisdiction requires otherwise.',
    'All prices are editable planning values — use supplier quotes. National averages are not local quotes.',
  ],
  sources: [quikrete, geometry, 'https://www.inchcalculator.com/concrete-cost-calculators/'],
  calculate(v, u) {
    const cuFt = v.length * v.width * v.depth * v.quantity;
    return projectCostResult(cuFt, v, u, ['delivery', 'shortLoad', 'pump', 'subbase', 'reinforcement', 'forms', 'finishing', 'labor'], [
      `Volume: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} × ${v.quantity} = ${fmt(cuFt)} ft³.`,
      `With ${fmt(v.waste)}% allowance: ${fmt(cuFt * waste(v))} ft³ = ${fmt(cuFt * waste(v) / 27)} yd³.`,
    ]);
  },
};

// 2. PATIO COST — patio-specific line items (finish, decorative, removal)
const patioCost: Model = {
  fields: [
    length('length', 'Patio length', 12),
    length('width', 'Patio width', 10),
    length('depth', 'Patio thickness', 4, 'in'),
    count('quantity', 'Identical patios'),
    allowance,
    densityField,
    yieldField,
    price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag', 'USD/ton']),
    scope([
      { value: 0, label: 'Concrete material only' },
      { value: 1, label: 'Full project estimate' },
    ]),
    lineItem('delivery', 'Delivery fee', 'Flat delivery charge, not per yard.'),
    lineItem('shortLoad', 'Short-load fee', 'Applied when an order falls below the supplier minimum.'),
    lineItem('pump', 'Pump fee', 'Flat boom or line pump charge.'),
    lineItem('subbase', 'Subbase / gravel', 'Compacted gravel base material.'),
    lineItem('reinforcement', 'Reinforcement', 'Mesh, rebar or fiber.'),
    lineItem('forms', 'Formwork', 'Form material and stakes.'),
    lineItem('finishing', 'Finishing / sealer', 'Screeding, troweling, sealer.'),
    lineItem('decorative', 'Decorative finish', 'Stamped, exposed aggregate or colored finish allowance.'),
    lineItem('demolition', 'Demolition / removal', 'Removing an existing patio before placement.'),
    lineItem('labor', 'Labor', 'Crew labor for the patio.'),
    taxField,
  ],
  formula: 'Volume = L × W × T × quantity. Total = material subtotal × (1 + tax/100) + delivery + short-load + pump + subbase + reinforcement + forms + finishing + decorative + demolition + labor.',
  assumptions: [
    'Material-only scope estimates just the concrete quantity × price. Full-project scope adds the editable line items you enter.',
    'Patio thickness is a project-design input. Enter the specified thickness for the quantity estimate.',
    'Decorative finish and demolition allowances are self-entered planning values — no preset prices are assumed. Get a local quote.',
    'Tax applies to the material subtotal only. All prices are editable planning values.',
  ],
  sources: [quikrete, geometry, patioCostGuide],
  calculate(v, u) {
    const cuFt = v.length * v.width * v.depth * v.quantity;
    return projectCostResult(cuFt, v, u, ['delivery', 'shortLoad', 'pump', 'subbase', 'reinforcement', 'forms', 'finishing', 'decorative', 'demolition', 'labor'], [
      `Volume: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} × ${v.quantity} = ${fmt(cuFt)} ft³.`,
      `With ${fmt(v.waste)}% allowance: ${fmt(cuFt * waste(v))} ft³ = ${fmt(cuFt * waste(v) / 27)} yd³.`,
    ]);
  },
};

// 3. DRIVEWAY COST — replacement scope, subbase, joints, disposal
const drivewayCost: Model = {
  fields: [
    length('length', 'Driveway length', 24),
    length('width', 'Driveway width', 10),
    length('depth', 'Driveway thickness', 4, 'in'),
    count('quantity', 'Identical driveways'),
    allowance,
    densityField,
    yieldField,
    price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag', 'USD/ton']),
    scope([
      { value: 0, label: 'Concrete material only' },
      { value: 1, label: 'Full project / replacement estimate' },
    ]),
    lineItem('delivery', 'Delivery fee', 'Flat delivery charge, not per yard.'),
    lineItem('shortLoad', 'Short-load fee', 'Applied when an order falls below the supplier minimum.'),
    lineItem('pump', 'Pump fee', 'Flat boom or line pump charge.'),
    lineItem('subbase', 'Subbase / gravel', 'Compacted subbase material under the driveway.'),
    lineItem('reinforcement', 'Reinforcement', 'Rebar, mesh or fiber.'),
    lineItem('forms', 'Formwork', 'Forms, stakes and related edge material.'),
    lineItem('joints', 'Control-joint cutting', 'Sawcutting or tooled joint allowance.'),
    lineItem('finishing', 'Finishing', 'Screeding, troweling, curing compound.'),
    lineItem('demolition', 'Demolition / removal', 'Removing the existing driveway slab.'),
    lineItem('disposal', 'Disposal / haul-away', 'Removing and hauling broken concrete.'),
    lineItem('labor', 'Labor', 'Crew labor for the driveway.'),
    taxField,
  ],
  formula: 'Volume = L × W × T × quantity. Total = material subtotal × (1 + tax/100) + delivery + short-load + pump + subbase + reinforcement + forms + joints + finishing + demolition + disposal + labor.',
  assumptions: [
    'Material-only scope estimates just the concrete quantity × price. Full-project scope adds the editable line items you enter.',
    'Replacement line items (demolition, disposal) represent work already chosen by the user — they are not automatically added.',
    'Driveway thickness is a project-design input. Enter the specified thickness for the quantity estimate.',
    'Tax applies to the material subtotal only. All prices are editable planning values.',
  ],
  sources: [quikrete, geometry, drivewayCostGuide],
  calculate(v, u) {
    const cuFt = v.length * v.width * v.depth * v.quantity;
    return projectCostResult(cuFt, v, u, ['delivery', 'shortLoad', 'pump', 'subbase', 'reinforcement', 'forms', 'joints', 'finishing', 'demolition', 'disposal', 'labor'], [
      `Volume: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} × ${v.quantity} = ${fmt(cuFt)} ft³.`,
      `With ${fmt(v.waste)}% allowance: ${fmt(cuFt * waste(v))} ft³ = ${fmt(cuFt * waste(v) / 27)} yd³.`,
    ]);
  },
};

export const slabModels: Record<string, Model> = {
  thickness,
  'patio-concrete': patioConcrete,
  'driveway-concrete': drivewayConcrete,
  'garage-slab': garageSlab,
  'slab-cost': slabCost,
  'patio-cost': patioCost,
  'driveway-cost': drivewayCost,
};