import type { Field, Model } from './calculator-types.ts';
import { FT_PER_M, LB_PER_KG, allowance, count, fmt, length, netArea, number, openings, positiveOrZero, price, rectangle, requireCondition, result, roundUp, row, volume, waste, withCost, area } from './calculator-math.ts';

// --- Shared concrete configuration ---
const quikrete = 'https://www.quikrete.com/calculator/main.asp';
const cmha = 'https://www.cmha.org/resource/tek-04-02a/';
const geometry = 'https://www.calculatorsoup.com/calculators/construction/concrete-calculator.php';
const acicr = 'https://www.concrete.org/general/frequently-asked-concrete-questions-faqs';

// Standard density for normal-weight concrete: 150 lb/ft³ (ACI 318 typical, QUIKRETE spec sheet)
// Lightweight: ~110-115 lb/ft³, Heavyweight: up to 300+ lb/ft³
const DEFAULT_DENSITY = 150; // lb/ft³ — normal weight structural concrete per ACI 318R

// Standard 80-lb bag yields ~0.60 ft³ (QUIKRETE, Sakrete spec sheets)
const DEFAULT_YIELD = 0.60; // ft³ per 80-lb bag

// Bag yield constants (cubic feet of mixed concrete per bag, manufacturer published)
// 40-lb: ~0.30 ft³, 50-lb: ~0.375 ft³, 60-lb: ~0.45 ft³, 80-lb: ~0.60 ft³
const BAG_YIELD_80 = 0.60;
const BAG_YIELD_60 = 0.45;
const BAG_YIELD_50 = 0.375;
const BAG_YIELD_40 = 0.30;

// Density conversion factors — published in ACI 318R, Engineering Toolbox
// Normal-weight concrete: 150 lb/ft³ (≈ 2400 kg/m³)
// Lightweight concrete: 110–130 lb/ft³
// Heavyweight concrete: up to ~350 lb/ft³
const DENSITY_NORMAL = 150;
const DENSITY_LIGHTWEIGHT = 110;
const DENSITY_HEAVYWEIGHT = 250;

// Sensitive: density factor for mass calculations where the default is too low
const DENSITY_DENSITY_SAFETY_MIN = 70;
const DENSITY_DENSITY_SAFETY_MAX = 350;

// Helper: build a concrete result with all standard outputs
export function concreteResult(
  cuFt: number,
  v: Record<string, number>,
  u: Record<string, string>,
  steps: string[],
  extraRows?: { key: string; label: string; value: number; unit: string; discrete?: boolean }[]
) {
  const total = cuFt * waste(v);
  const bags = roundUp(total / v.yield);
  const lb = total * densityLb(v.density, u.density);
  const totalM3 = total / FT_PER_M ** 3;
  const rows = [
    row('order', 'Concrete to order', total / 27, 'yd³'),
    row('net', 'Geometric volume', cuFt / 27, 'yd³'),
    row('ft3', 'Order volume (ft³)', total, 'ft³'),
    row('m3', 'Order volume (m³)', totalM3, 'm³'),
    row('L', 'Order volume (L)', totalM3 * 1000, 'L'),
    row('bags', `Bags (entered yield ${fmt(v.yield)} ft³)`, bags, 'bags', true),
    row('bags60', 'Bags (60-lb @ 0.45 ft³)', roundUp(total / BAG_YIELD_60), 'bags', true),
    row('bags40', 'Bags (40-lb @ 0.30 ft³)', roundUp(total / BAG_YIELD_40), 'bags', true),
    row('weight', 'Estimated order weight (lb)', lb, 'lb'),
    row('kg', 'Estimated order weight (kg)', lb / LB_PER_KG, 'kg'),
    row('tons', 'Estimated order weight (US tons)', lb / 2000, 'US tons'),
    row('tonnes', 'Estimated order weight (metric tonnes)', lb / LB_PER_KG / 1000, 'metric tonnes'),
    ...(extraRows ?? []),
  ];
  withCost(rows, v.price, u.price, {
    'USD/yd3': total / 27,
    'USD/m3': totalM3,
    'USD/ft3': total,
    'USD/bag': bags,
  });
  return result(
    rows,
    [
      ...steps,
      `Allowance: ${fmt(cuFt)} ft³ × ${fmt(waste(v))} = ${fmt(total)} ft³.`,
      `Bags: round ${fmt(total)} ÷ ${fmt(v.yield)} ft³ (entered yield) up to ${bags}.`,
      `Weight: ${fmt(total)} ft³ × ${fmt(densityLb(v.density, u.density))} lb/ft³ = ${fmt(lb)} lb.`,
    ],
    [
      'Bag yield is mixed concrete volume; bag mass is not the weight of cured concrete.',
      'Density 150 lb/ft³ = 4,050 lb/yd³ is normal-weight concrete per ACI 318R. Supplier values for your mix and moisture condition are more reliable.'
    ]
  );
}

export const densityField: Field = {
  ...number('density', 'Material density', 150, undefined, 'Example bulk density. Replace with a supplier value for the same moisture and compaction condition. Normal-weight concrete is ~150 lb/ft³ per ACI 318R; lightweight ~110; heavyweight ~250 lb/ft³.'),
  unit: 'lb/ft3',
  units: ['lb/ft3', 'kg/m3', 'ton/yd3'],
  group: 'Material & assumptions'
};
export function densityLb(v: number, unit: string): number {
  return unit === 'kg/m3' ? v * LB_PER_KG / FT_PER_M ** 3 : unit === 'ton/yd3' ? v * 2000 / 27 : v;
}
export const yieldField: Field = {
  ...volume('yield', 'Mixed yield per bag', 0.6),
  unit: 'ft3',
  group: 'Material & assumptions',
  help: 'Read the yield printed on the bag. 0.60 ft³ is an example for an 80 lb standard concrete mix, not every product.'
};

// Helper: shared minimum fields most concrete calculators include
const concreteSharedFields: Field[] = [
  allowance,
  { ...densityField },
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']),
];

// Helper: boilerplate assumptions
const standardAssumptions = [
  'Dimensions describe the final placed concrete. Formwork displacement is excluded.',
  'Thickness and reinforcement must come from project plans; volume alone does not establish load capacity.',
  'Split irregular shapes into non-overlapping simple shapes and calculate each separately.',
];

// Custom yield field — used by wall calculator with default 0.45 (60-lb)
const yieldField60: Field = { ...yieldField, value: 0.45 };

// ==========================================================
// 1.  Concrete Calculator — generic multi-shape utility
// ==========================================================
type ShapeType = 'slab' | 'footing' | 'wall';
type ShapeIdx = 0 | 1 | 2 | 3;

const concreteGenericFields: Field[] = [
  { id: 'shape', label: 'Project type', value: 0, unit: '', integer: true, min: 0, max: 3,
    options: [
      { value: 0, label: 'Rectangular slab' },
      { value: 1, label: 'Strip footing' },
      { value: 2, label: 'Wall (rectangular)' },
      { value: 3, label: 'Cylinder / column' },
    ] },
  { ...rectangle[0], help: 'Use the actual formed or placed length.', visibleWhen: { field: 'shape', in: [0, 1, 2] } },
  { ...rectangle[1], help: 'Used for slabs and strip footings only.', visibleWhen: { field: 'shape', in: [0, 1] } },
  { ...length('depth', 'Slab thickness / footing depth', 4, 'in', 'For slabs enter thickness; for strip footings enter the footing depth.'), visibleWhen: { field: 'shape', in: [0, 1] } },
  { ...length('thickness', 'Wall thickness', 8, 'in', 'Wall mode only. Enter the formed wall thickness from the project requirements.'), visibleWhen: { field: 'shape', equals: 2 } },
  { ...length('diameter', 'Cylinder / column diameter', 12, 'in', 'Cylinder mode only. Enter the finished concrete diameter.'), visibleWhen: { field: 'shape', equals: 3 } },
  { ...length('height', 'Wall / cylinder height', 8, 'ft', 'Used for wall and cylinder modes.'), visibleWhen: { field: 'shape', in: [2, 3] } },
  count('quantity', 'Identical sections', 1),
];

const concreteGeneric: Model = {
  fields: [...concreteGenericFields, ...concreteSharedFields],
  formula: 'Slab/footing: V = length × width × thickness × quantity. Wall: V = length × height × thickness × quantity. Cylinder: V = π × (D/2)² × H × quantity.',
  assumptions: [
    ...standardAssumptions,
    'Slab and footing use the same rectangular formula with different naming conventions.',
    'Wall thickness must be entered separately in the thickness field.',
    'The cylinder mode uses diameter × height. For circular slabs, use the dedicated Slab calculator.',
  ],
  sources: [geometry, quikrete, acicr],
  calculate(v, u) {
    const shapeIdx = Math.round(v.shape) as ShapeIdx;
    let cuFt: number;
    let steps: string[];

    if (shapeIdx === 2) {
      requireCondition(v.length > 0, 'length', 'Enter a wall length greater than zero.');
      requireCondition(v.height > 0, 'height', 'Enter a wall height greater than zero.');
      requireCondition(v.thickness > 0, 'thickness', 'Enter a wall thickness greater than zero.');
      cuFt = v.length * v.height * v.thickness * v.quantity;
      steps = [
        `Wall: ${fmt(v.length)} × ${fmt(v.height)} × ${fmt(v.thickness)} × ${v.quantity} = ${fmt(cuFt)} ft³.`,
      ];
    } else if (shapeIdx === 1) {
      requireCondition(v.length > 0, 'length', 'Enter a footing length greater than zero.');
      requireCondition(v.width > 0, 'width', 'Enter a footing width greater than zero.');
      requireCondition(v.depth > 0, 'depth', 'Enter a footing depth greater than zero.');
      cuFt = v.length * v.width * v.depth * v.quantity;
      steps = [
        `Footing: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} × ${v.quantity} = ${fmt(cuFt)} ft³.`,
      ];
    } else if (shapeIdx === 3) {
      requireCondition(v.diameter > 0, 'diameter', 'Enter a cylinder diameter greater than zero.');
      requireCondition(v.height > 0, 'height', 'Enter a cylinder height greater than zero.');
      const r = v.diameter / 2;
      cuFt = Math.PI * r * r * v.height * v.quantity;
      steps = [
        `Cylinder: π × (${fmt(v.diameter)}/2)² × ${fmt(v.height)} × ${v.quantity} = ${fmt(cuFt)} ft³.`,
      ];
    } else {
      requireCondition(v.length > 0, 'length', 'Enter a slab length greater than zero.');
      requireCondition(v.width > 0, 'width', 'Enter a slab width greater than zero.');
      requireCondition(v.depth > 0, 'depth', 'Enter a slab thickness greater than zero.');
      cuFt = v.length * v.width * v.depth * v.quantity;
      steps = [
        `Slab: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} × ${v.quantity} = ${fmt(cuFt)} ft³.`,
      ];
    }
    return concreteResult(cuFt, v, u, steps);
  },
};

// ==========================================================
// 2.  Concrete Volume Calculator — geometry-focused
// ==========================================================
const concreteVolumeFields: Field[] = [
  { id: 'shape', label: 'Concrete shape', value: 0, unit: '', integer: true, min: 0, max: 8,
    options: [
      { value: 0, label: 'Rectangular slab / prism' },
      { value: 1, label: 'Round slab / cylinder / column' },
      { value: 2, label: 'Hollow tube / annular cylinder' },
      { value: 3, label: 'Curb + gutter' },
      { value: 4, label: 'Solid stairs (mass fill)' },
      { value: 5, label: 'Triangle prism / wedge' },
      { value: 6, label: 'Concrete wall' },
      { value: 7, label: 'Strip footing' },
      { value: 8, label: 'Square / rectangular column' },
    ] },
  { ...length('length', 'Length', 20, 'ft', 'Used for rectangular slabs/prisms, curbs, walls and strip footings.'), visibleWhen: { field: 'shape', in: [0, 3, 6, 7, 8] } },
  { ...length('width', 'Width', 10, 'ft', 'Used for rectangular slabs/prisms, strip footings and rectangular columns.'), visibleWhen: { field: 'shape', in: [0, 7, 8] } },
  { ...length('depth', 'Slab thickness / footing depth', 4, 'in', 'For rectangular slabs enter thickness; for strip footings enter depth.'), visibleWhen: { field: 'shape', in: [0, 7] } },
  { ...length('thickness', 'Wall thickness', 8, 'in', 'Wall mode only.'), visibleWhen: { field: 'shape', equals: 6 } },
  { ...length('diameter', 'Outer diameter', 12, 'in', 'Used for round slabs/cylinders and hollow tubes.'), visibleWhen: { field: 'shape', in: [1, 2] } },
  { ...length('height', 'Height / circular depth', 8, 'ft', 'Use the cylinder or column height, or the depth of a round slab.'), visibleWhen: { field: 'shape', in: [1, 2, 6, 8] } },
  { ...positiveOrZero(length('innerDiameter', 'Inner diameter', 6, 'in', 'Hollow-tube mode only. Must be greater than zero and smaller than the outer diameter.')), visibleWhen: { field: 'shape', equals: 2 } },
  { ...length('curbWidth', 'Curb width', 6, 'in', 'Horizontal width of the raised curb section.'), visibleWhen: { field: 'shape', equals: 3 } },
  { ...length('curbHeight', 'Total curb height', 12, 'in', 'Total curb height measured from the bottom of the curb section.'), visibleWhen: { field: 'shape', equals: 3 } },
  { ...length('gutterWidth', 'Gutter width beyond curb', 18, 'in', 'Horizontal gutter/flag width beyond the curb.'), visibleWhen: { field: 'shape', equals: 3 } },
  { ...length('gutterDepth', 'Gutter thickness', 6, 'in', 'Thickness of the gutter section beyond the curb.'), visibleWhen: { field: 'shape', equals: 3 } },
  { ...length('stairWidth', 'Stair width', 4, 'ft'), visibleWhen: { field: 'shape', equals: 4 } },
  { ...length('rise', 'Rise per step', 7, 'in'), visibleWhen: { field: 'shape', equals: 4 } },
  { ...length('run', 'Tread depth', 11, 'in'), visibleWhen: { field: 'shape', equals: 4 } },
  { ...count('steps', 'Number of steps', 4), visibleWhen: { field: 'shape', equals: 4 } },
  { ...positiveOrZero(length('landing', 'Additional top landing length', 0, 'ft', 'Optional solid landing extending beyond the top tread. Enter 0 for none.')), visibleWhen: { field: 'shape', equals: 4 } },
  { ...length('base', 'Triangle base / run', 36, 'in', 'Horizontal base of the triangular cross-section.'), visibleWhen: { field: 'shape', equals: 5 } },
  { ...length('triHeight', 'Triangle height / rise', 12, 'in', 'Vertical height of the triangular cross-section.'), visibleWhen: { field: 'shape', equals: 5 } },
  { ...length('wedgeLength', 'Prism width / wedge length', 10, 'ft', 'Length perpendicular to the triangular cross-section.'), visibleWhen: { field: 'shape', equals: 5 } },
  count('quantity', 'Identical sections', 1),
];

const concreteVolume: Model = {
  fields: [...concreteVolumeFields, ...concreteSharedFields],
  formula: 'Rectangular slab/prism, wall, footing and rectangular column: V = L × W × H using the active dimensions. Round slab/cylinder: V = π × (D/2)² × H. Hollow tube: V = π/4 × (Dₒ² − Dᵢ²) × H. Curb + gutter: V = L × (curb width × total curb height + gutter width beyond curb × gutter thickness). Solid stairs: V = width × rise × run × n(n+1)/2 plus any solid top landing. Triangle prism/wedge: V = 0.5 × base × height × prism length. Every shape is multiplied by the number of identical sections.',
  assumptions: [
    ...standardAssumptions,
    'Round slab, cylinder and round-column mode use the same circular-prism formula; the height field acts as slab depth when the shape is shallow.',
    'For hollow tubes, the inner diameter must be greater than zero and smaller than the outer diameter.',
    'Curb + gutter mode uses two non-overlapping rectangles: total curb width × total curb height, plus the gutter width beyond the curb × gutter thickness. This matches the dedicated Concrete Curb Calculator convention.',
    'Stairs are treated as solid mass-fill steps from a level base; each succeeding tread is one riser taller.',
    'The optional top landing is treated as a solid rectangular extension at the full stair height.',
    'Triangle prism / wedge mode uses a right-triangle cross-section and a constant perpendicular length.',
    'Quantity multiplies the complete volume of the selected shape.',
  ],
  sources: [quikrete, acicr, geometry],
  calculate(v, u) {
    const s = Math.round(v.shape);
    let cuFt = 0;
    let steps: string[] = [];

    if (s === 1) {
      requireCondition(v.diameter > 0, 'diameter', 'Enter an outer diameter greater than zero.');
      requireCondition(v.height > 0, 'height', 'Enter a circular depth or height greater than zero.');
      const r = v.diameter / 2;
      const each = Math.PI * r * r * v.height;
      cuFt = each * v.quantity;
      steps = [`Round slab / cylinder: π × (${fmt(v.diameter)}/2)² × ${fmt(v.height)} = ${fmt(each)} ft³ each; × ${v.quantity} = ${fmt(cuFt)} ft³.`];
    } else if (s === 2) {
      requireCondition(v.diameter > 0, 'diameter', 'Enter an outer diameter greater than zero.');
      requireCondition(v.innerDiameter > 0, 'innerDiameter', 'Enter an inner diameter greater than zero for a hollow tube.');
      requireCondition(v.innerDiameter < v.diameter, 'innerDiameter', 'Inner diameter must be smaller than outer diameter.');
      requireCondition(v.height > 0, 'height', 'Enter a tube height greater than zero.');
      const ro = v.diameter / 2;
      const ri = v.innerDiameter / 2;
      const outerArea = Math.PI * ro * ro;
      const innerArea = Math.PI * ri * ri;
      const each = (outerArea - innerArea) * v.height;
      cuFt = each * v.quantity;
      steps = [
        `Outer area: π × (${fmt(v.diameter)}/2)² = ${fmt(outerArea)} ft².`,
        `Inner area: π × (${fmt(v.innerDiameter)}/2)² = ${fmt(innerArea)} ft².`,
        `Net annular area × ${fmt(v.height)} ft = ${fmt(each)} ft³ each; × ${v.quantity} = ${fmt(cuFt)} ft³.`,
      ];
    } else if (s === 3) {
      requireCondition(v.length > 0, 'length', 'Enter a curb length greater than zero.');
      requireCondition(v.curbWidth > 0, 'curbWidth', 'Enter a curb width greater than zero.');
      requireCondition(v.curbHeight > 0, 'curbHeight', 'Enter a curb height greater than zero.');
      requireCondition(v.gutterWidth > 0, 'gutterWidth', 'Enter a gutter width greater than zero.');
      requireCondition(v.gutterDepth > 0, 'gutterDepth', 'Enter a gutter thickness greater than zero.');
      const curbArea = v.curbWidth * v.curbHeight;
      const gutterArea = v.gutterWidth * v.gutterDepth;
      const each = v.length * (curbArea + gutterArea);
      cuFt = each * v.quantity;
      steps = [
        `Curb area: ${fmt(v.curbWidth)} × ${fmt(v.curbHeight)} = ${fmt(curbArea)} ft².`,
        `Gutter area beyond curb: ${fmt(v.gutterWidth)} × ${fmt(v.gutterDepth)} = ${fmt(gutterArea)} ft².`,
        `Cross-section × ${fmt(v.length)} ft = ${fmt(each)} ft³ each; × ${v.quantity} = ${fmt(cuFt)} ft³.`,
      ];
    } else if (s === 4) {
      requireCondition(v.stairWidth > 0, 'stairWidth', 'Enter a stair width greater than zero.');
      requireCondition(v.rise > 0, 'rise', 'Enter a rise greater than zero.');
      requireCondition(v.run > 0, 'run', 'Enter a tread depth greater than zero.');
      requireCondition(v.steps >= 1, 'steps', 'Enter at least one step.');
      const steppedMass = v.stairWidth * v.rise * v.run * v.steps * (v.steps + 1) / 2;
      const landingMass = v.stairWidth * v.landing * v.steps * v.rise;
      const each = steppedMass + landingMass;
      cuFt = each * v.quantity;
      steps = [
        `Stepped mass: ${fmt(v.stairWidth)} × ${fmt(v.rise)} × ${fmt(v.run)} × ${v.steps}×(${v.steps}+1)/2 = ${fmt(steppedMass)} ft³.`,
        v.landing > 0 ? `Top landing: ${fmt(v.stairWidth)} × ${fmt(v.landing)} × ${fmt(v.steps * v.rise)} = ${fmt(landingMass)} ft³.` : 'No additional top landing length entered.',
        `Total each = ${fmt(each)} ft³; × ${v.quantity} = ${fmt(cuFt)} ft³.`,
      ];
    } else if (s === 5) {
      requireCondition(v.base > 0, 'base', 'Enter a triangle base greater than zero.');
      requireCondition(v.triHeight > 0, 'triHeight', 'Enter a triangle height greater than zero.');
      requireCondition(v.wedgeLength > 0, 'wedgeLength', 'Enter a prism length greater than zero.');
      const area = 0.5 * v.base * v.triHeight;
      const each = area * v.wedgeLength;
      cuFt = each * v.quantity;
      steps = [
        `Triangle cross-section: 0.5 × ${fmt(v.base)} × ${fmt(v.triHeight)} = ${fmt(area)} ft².`,
        `Cross-section × ${fmt(v.wedgeLength)} ft = ${fmt(each)} ft³ each; × ${v.quantity} = ${fmt(cuFt)} ft³.`,
      ];
    } else if (s === 6) {
      requireCondition(v.length > 0, 'length', 'Enter a wall length greater than zero.');
      requireCondition(v.height > 0, 'height', 'Enter a wall height greater than zero.');
      requireCondition(v.thickness > 0, 'thickness', 'Enter a wall thickness greater than zero.');
      const each = v.length * v.height * v.thickness;
      cuFt = each * v.quantity;
      steps = [`Wall: ${fmt(v.length)} × ${fmt(v.height)} × ${fmt(v.thickness)} = ${fmt(each)} ft³ each; × ${v.quantity} = ${fmt(cuFt)} ft³.`];
    } else if (s === 7) {
      requireCondition(v.length > 0, 'length', 'Enter a footing length greater than zero.');
      requireCondition(v.width > 0, 'width', 'Enter a footing width greater than zero.');
      requireCondition(v.depth > 0, 'depth', 'Enter a footing depth greater than zero.');
      const each = v.length * v.width * v.depth;
      cuFt = each * v.quantity;
      steps = [`Strip footing: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} = ${fmt(each)} ft³ each; × ${v.quantity} = ${fmt(cuFt)} ft³.`];
    } else if (s === 8) {
      requireCondition(v.width > 0, 'width', 'Enter a column width greater than zero.');
      requireCondition(v.height > 0, 'height', 'Enter a column height greater than zero.');
      requireCondition(v.length > 0, 'length', 'Enter a column length greater than zero.');
      const each = v.length * v.width * v.height;
      cuFt = each * v.quantity;
      steps = [`Rectangular column: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.height)} = ${fmt(each)} ft³ each; × ${v.quantity} = ${fmt(cuFt)} ft³.`];
    } else {
      requireCondition(v.length > 0, 'length', 'Enter a slab length greater than zero.');
      requireCondition(v.width > 0, 'width', 'Enter a slab width greater than zero.');
      requireCondition(v.depth > 0, 'depth', 'Enter a slab thickness greater than zero.');
      const each = v.length * v.width * v.depth;
      cuFt = each * v.quantity;
      steps = [`Rectangular slab / prism: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} = ${fmt(each)} ft³ each; × ${v.quantity} = ${fmt(cuFt)} ft³.`];
    }
    return concreteResult(cuFt, v, u, steps);
  },
};

// ==========================================================
// 3.  Concrete Weight Calculator — known volume or common geometry
// ==========================================================
const concreteWeightFields: Field[] = [
  { id: 'weightMode', label: 'Calculate weight from', value: 0, unit: '', integer: true, min: 0, max: 3,
    options: [
      { value: 0, label: 'Known concrete volume' },
      { value: 1, label: 'Length × width × thickness' },
      { value: 2, label: 'Round slab / cylinder dimensions' },
      { value: 3, label: 'Surface area × thickness' },
    ] },
  { ...volume('volume', 'Concrete volume', 1), units: ['yd3', 'ft3', 'm3', 'L'], visibleWhen: { field: 'weightMode', equals: 0 } },
  { ...length('length', 'Length', 10, 'ft'), visibleWhen: { field: 'weightMode', equals: 1 } },
  { ...length('width', 'Width', 10, 'ft'), visibleWhen: { field: 'weightMode', equals: 1 } },
  { ...length('depth', 'Thickness / depth', 4, 'in'), visibleWhen: { field: 'weightMode', equals: 1 } },
  { ...length('diameter', 'Diameter', 24, 'in'), visibleWhen: { field: 'weightMode', equals: 2 } },
  { ...length('height', 'Height / circular depth', 4, 'ft'), visibleWhen: { field: 'weightMode', equals: 2 } },
  { ...area('area', 'Surface area', 100, 0), visibleWhen: { field: 'weightMode', equals: 3 } },
  { ...length('areaThickness', 'Thickness / depth', 4, 'in'), visibleWhen: { field: 'weightMode', equals: 3 } },
  { ...count('quantity', 'Identical sections', 1), visibleWhen: { field: 'weightMode', in: [1, 2, 3] } },
  { id: 'densityBasis', label: 'Concrete density basis', value: 0, unit: '', integer: true, min: 0, max: 3,
    options: [
      { value: 0, label: 'Use entered density' },
      { value: 1, label: 'Normal-weight reference — 150 lb/ft³' },
      { value: 2, label: 'Lightweight reference — 115 lb/ft³' },
      { value: 3, label: 'High-density reference — 250 lb/ft³' },
    ],
    help: 'Presets are estimating references. Use project or supplier density when available.'
  },
  { ...densityField, value: DEFAULT_DENSITY, visibleWhen: { field: 'densityBasis', equals: 0 } },
  { id: 'outputUnit', label: 'Primary weight unit', value: 0, unit: '', integer: true, min: 0, max: 3,
    options: [
      { value: 0, label: 'Pounds (lb)' },
      { value: 1, label: 'Kilograms (kg)' },
      { value: 2, label: 'US tons' },
      { value: 3, label: 'Metric tonnes' },
    ] },
  { ...allowance, value: 0, label: 'Extra material allowance', help: 'Optional ordering allowance. Leave at 0% for the weight of the measured concrete itself.' },
];

const concreteWeight: Model = {
  fields: concreteWeightFields,
  formula: 'Weight = volume × density. Volume may be entered directly or derived from rectangular dimensions, circular dimensions, or area × thickness. 1 lb = 0.45359237 kg; 1 US ton = 2,000 lb; 1 metric tonne = 1,000 kg.',
  assumptions: [
    'The primary result is always the estimated mass of the measured concrete; extra material allowance is reported separately.',
    '150 lb/ft³ is a common normal-weight estimating reference, while lightweight and high-density concrete span broad ranges.',
    'Use the actual mix-design, supplier or test density whenever available.',
    'The lightweight 115 lb/ft³ and high-density 250 lb/ft³ presets are planning points, not universal definitions.',
    'Reinforcement weight is not added separately unless the density entered already represents the composite material.',
    'This tool estimates material mass, not structural dead load, lifting capacity, trailer capacity or axle loading.',
  ],
  sources: [
    acicr,
    'https://www.concrete.org/frequentlyaskedquestions.aspx?faqid=670',
    'https://www.concrete.org/frequentlyaskedquestions.aspx?faqid=707',
    'https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9',
  ],
  calculate(v, u) {
    const mode = Math.round(v.weightMode);
    let cuFt = 0;
    let geometryStep = '';

    if (mode === 1) {
      requireCondition(v.length > 0, 'length', 'Enter a length greater than zero.');
      requireCondition(v.width > 0, 'width', 'Enter a width greater than zero.');
      requireCondition(v.depth > 0, 'depth', 'Enter a thickness or depth greater than zero.');
      const each = v.length * v.width * v.depth;
      cuFt = each * v.quantity;
      geometryStep = `Rectangular volume: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} = ${fmt(each)} ft³ each; × ${v.quantity} = ${fmt(cuFt)} ft³.`;
    } else if (mode === 2) {
      requireCondition(v.diameter > 0, 'diameter', 'Enter a diameter greater than zero.');
      requireCondition(v.height > 0, 'height', 'Enter a height or circular depth greater than zero.');
      const each = Math.PI * (v.diameter / 2) ** 2 * v.height;
      cuFt = each * v.quantity;
      geometryStep = `Round volume: π × (${fmt(v.diameter)}/2)² × ${fmt(v.height)} = ${fmt(each)} ft³ each; × ${v.quantity} = ${fmt(cuFt)} ft³.`;
    } else if (mode === 3) {
      requireCondition(v.area > 0, 'area', 'Enter a surface area greater than zero.');
      requireCondition(v.areaThickness > 0, 'areaThickness', 'Enter a thickness greater than zero.');
      const each = v.area * v.areaThickness;
      cuFt = each * v.quantity;
      geometryStep = `Area × thickness: ${fmt(v.area)} ft² × ${fmt(v.areaThickness)} ft = ${fmt(each)} ft³ each; × ${v.quantity} = ${fmt(cuFt)} ft³.`;
    } else {
      requireCondition(v.volume > 0, 'volume', 'Enter a concrete volume greater than zero.');
      cuFt = v.volume;
      geometryStep = `Known volume: ${fmt(cuFt)} ft³ after unit conversion.`;
    }

    const basis = Math.round(v.densityBasis);
    const density = basis === 1 ? 150 : basis === 2 ? 115 : basis === 3 ? 250 : densityLb(v.density, u.density);
    const densityLabel = basis === 1 ? 'Normal-weight reference' : basis === 2 ? 'Lightweight reference' : basis === 3 ? 'High-density reference' : 'Entered density';
    requireCondition(density > 0 && density <= 500, 'density', 'Enter or select a realistic concrete density greater than zero.');

    const totalCuFt = cuFt * waste(v);
    const netLb = cuFt * density;
    const totalLb = totalCuFt * density;
    const netKg = netLb / LB_PER_KG;
    const netTons = netLb / 2000;
    const netTonnes = netKg / 1000;
    const out = Math.round(v.outputUnit);
    const primaryValue = out === 1 ? netKg : out === 2 ? netTons : out === 3 ? netTonnes : netLb;
    const primaryUnit = out === 1 ? 'kg' : out === 2 ? 'US tons' : out === 3 ? 'metric tonnes' : 'lb';
    const netM3 = cuFt / FT_PER_M ** 3;

    return result(
      [
        row('primaryWeight', 'Estimated concrete weight', primaryValue, primaryUnit),
        row('netWeight', 'Net weight (lb)', netLb, 'lb'),
        row('netKg', 'Net weight (kg)', netKg, 'kg'),
        row('netTons', 'Net weight (US tons)', netTons, 'US tons'),
        row('netTonnes', 'Net weight (metric tonnes)', netTonnes, 'metric tonnes'),
        row('netYd3', 'Measured volume (yd³)', cuFt / 27, 'yd³'),
        row('netFt3', 'Measured volume (ft³)', cuFt, 'ft³'),
        row('netM3', 'Measured volume (m³)', netM3, 'm³'),
        row('netL', 'Measured volume (L)', netM3 * 1000, 'L'),
        ...(v.waste > 0 ? [
          row('orderWeight', 'Weight with allowance (lb)', totalLb, 'lb'),
          row('orderKg', 'Weight with allowance (kg)', totalLb / LB_PER_KG, 'kg'),
          row('orderTons', 'Weight with allowance (US tons)', totalLb / 2000, 'US tons'),
          row('orderTonnes', 'Weight with allowance (metric tonnes)', totalLb / LB_PER_KG / 1000, 'metric tonnes'),
          row('orderYd3', 'Volume with allowance (yd³)', totalCuFt / 27, 'yd³'),
          row('orderFt3', 'Volume with allowance (ft³)', totalCuFt, 'ft³'),
          row('orderM3', 'Volume with allowance (m³)', totalCuFt / FT_PER_M ** 3, 'm³'),
          row('orderL', 'Volume with allowance (L)', totalCuFt / FT_PER_M ** 3 * 1000, 'L'),
        ] : []),
        row('densityUsed', `${densityLabel} applied`, density, 'lb/ft³'),
        row('densityMetric', 'Density applied (metric)', density * FT_PER_M ** 3 / LB_PER_KG, 'kg/m³'),
        row('lbPerYd3', 'Weight per cubic yard at this density', density * 27, 'lb/yd³'),
        row('kgPerM3', 'Weight per cubic meter at this density', density * FT_PER_M ** 3 / LB_PER_KG, 'kg/m³'),
      ],
      [
        geometryStep,
        `Density: ${fmt(density)} lb/ft³ (${densityLabel.toLowerCase()}).`,
        `Weight: ${fmt(cuFt)} ft³ × ${fmt(density)} lb/ft³ = ${fmt(netLb)} lb (${fmt(netKg)} kg).`,
        `Density equivalent: ${fmt(density)} lb/ft³ = ${fmt(density * FT_PER_M ** 3 / LB_PER_KG)} kg/m³.`,
        ...(v.waste > 0 ? [`With ${fmt(v.waste)}% extra material allowance: ${fmt(totalLb)} lb for ${fmt(totalCuFt)} ft³.`] : []),
      ],
      [
        'Use density for the same concrete condition being estimated; specialty mixes can differ substantially.',
        'A material allowance changes the amount ordered, not the physical density.',
        '1 yd³ = 27 ft³; 1 lb = 0.45359237 kg.',
      ]
    );
  },
};

// ==========================================================
// 4.  Concrete Cost Calculator — quote-based cost from volume or common geometry
// ==========================================================
const concreteCostFields: Field[] = [
  { id: 'costMode', label: 'Calculate cost from', value: 0, unit: '', integer: true, min: 0, max: 3,
    options: [
      { value: 0, label: 'Length × width × thickness' },
      { value: 1, label: 'Known concrete volume' },
      { value: 2, label: 'Surface area × thickness' },
      { value: 3, label: 'Round slab / cylinder dimensions' },
    ] },
  { ...length('length', 'Length', 10, 'ft'), visibleWhen: { field: 'costMode', equals: 0 } },
  { ...length('width', 'Width', 10, 'ft'), visibleWhen: { field: 'costMode', equals: 0 } },
  { ...length('depth', 'Thickness / depth', 4, 'in'), visibleWhen: { field: 'costMode', equals: 0 } },
  { ...volume('volume', 'Concrete volume', 1), units: ['yd3', 'ft3', 'm3', 'L'], visibleWhen: { field: 'costMode', equals: 1 } },
  { ...area('area', 'Surface area', 100, 0), visibleWhen: { field: 'costMode', equals: 2 } },
  { ...length('areaThickness', 'Thickness / depth', 4, 'in'), visibleWhen: { field: 'costMode', equals: 2 } },
  { ...length('diameter', 'Diameter', 24, 'in'), visibleWhen: { field: 'costMode', equals: 3 } },
  { ...length('height', 'Height / circular depth', 4, 'ft'), visibleWhen: { field: 'costMode', equals: 3 } },
  { ...count('quantity', 'Identical sections', 1), visibleWhen: { field: 'costMode', in: [0, 2, 3] } },
  { ...densityField },
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag', 'USD/ton']),
  number('delivery', 'Ready-mix delivery fee ($)', 0, 0, 'Enter the total quoted delivery charge for this order. If your supplier charges per truck, enter the combined delivery amount.'),
  number('shortLoadFee', 'Short-load fee ($)', 0, 0, 'Enter the quoted short-load surcharge only when it applies; otherwise leave 0.'),
  number('pumpFee', 'Concrete pump fee ($)', 0, 0, 'Enter the quoted boom- or line-pump charge when placement requires it.'),
  number('reinforcement', 'Reinforcement ($)', 0, 0, 'Optional rebar, mesh, chairs and ties from your project takeoff or quote.'),
  number('formwork', 'Formwork / subbase ($)', 0, 0, 'Optional forms, gravel base, vapor barrier or preparation cost.'),
  number('finishing', 'Finishing / labor ($)', 0, 0, 'Optional placing, screeding, finishing, sealing or labor cost.'),
  { ...number('tax', 'Material tax (%)', 0, 0, 'Applied to the concrete material subtotal only. Enter a local rate only when that matches your quote/tax treatment.'), max: 100 },
  allowance,
];

const concreteCost: Model = {
  fields: concreteCostFields,
  formula: 'Volume is entered directly or derived from geometry. Order volume = net volume × (1 + allowance/100). Material subtotal = priced quantity × unit price. Total = material subtotal + material tax + entered project charges.',
  assumptions: [
    'Use the actual supplier or retailer quote. The calculator does not assume a national concrete price.',
    'Price and selected price unit must describe the same basis: cubic yard, cubic meter, cubic foot, bag or US ton.',
    'Per-bag pricing uses the rounded whole-bag order quantity from the entered mixed yield.',
    'Material tax is applied to concrete material only; delivery, pumping, reinforcement, formwork and labor are not taxed by this model.',
    'Delivery, short-load and pump fees vary by supplier and project. Enter only charges that actually apply.',
    'Cost per square foot or square meter is shown only when the selected geometry provides a plan area.',
    'This is a project-cost estimate, not a structural design, bid, contract or tax determination.',
  ],
  sources: [
    quikrete,
    acicr,
    'https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors',
  ],
  calculate(v, u) {
    const mode = Math.round(v.costMode);
    let cuFt = 0;
    let planAreaSqFt = Number.NaN;
    let geometryStep = '';

    if (mode === 1) {
      requireCondition(v.volume > 0, 'volume', 'Enter a concrete volume greater than zero.');
      cuFt = v.volume;
      geometryStep = `Known volume: ${fmt(cuFt)} ft³ after unit conversion.`;
    } else if (mode === 2) {
      requireCondition(v.area > 0, 'area', 'Enter a surface area greater than zero.');
      requireCondition(v.areaThickness > 0, 'areaThickness', 'Enter a thickness greater than zero.');
      requireCondition(v.quantity > 0, 'quantity', 'Enter at least one section.');
      const each = v.area * v.areaThickness;
      cuFt = each * v.quantity;
      planAreaSqFt = v.area * v.quantity;
      geometryStep = `Area × thickness: ${fmt(v.area)} ft² × ${fmt(v.areaThickness)} ft = ${fmt(each)} ft³ each; × ${v.quantity} = ${fmt(cuFt)} ft³.`;
    } else if (mode === 3) {
      requireCondition(v.diameter > 0, 'diameter', 'Enter a diameter greater than zero.');
      requireCondition(v.height > 0, 'height', 'Enter a height or circular depth greater than zero.');
      requireCondition(v.quantity > 0, 'quantity', 'Enter at least one section.');
      const areaEach = Math.PI * (v.diameter / 2) ** 2;
      const each = areaEach * v.height;
      cuFt = each * v.quantity;
      planAreaSqFt = areaEach * v.quantity;
      geometryStep = `Round volume: π × (${fmt(v.diameter)}/2)² × ${fmt(v.height)} = ${fmt(each)} ft³ each; × ${v.quantity} = ${fmt(cuFt)} ft³.`;
    } else {
      requireCondition(v.length > 0, 'length', 'Enter a length greater than zero.');
      requireCondition(v.width > 0, 'width', 'Enter a width greater than zero.');
      requireCondition(v.depth > 0, 'depth', 'Enter a thickness or depth greater than zero.');
      requireCondition(v.quantity > 0, 'quantity', 'Enter at least one section.');
      const each = v.length * v.width * v.depth;
      cuFt = each * v.quantity;
      planAreaSqFt = v.length * v.width * v.quantity;
      geometryStep = `Rectangular volume: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} = ${fmt(each)} ft³ each; × ${v.quantity} = ${fmt(cuFt)} ft³.`;
    }

    requireCondition(v.yield > 0, 'yield', 'Enter a mixed bag yield greater than zero.');
    const density = densityLb(v.density, u.density);
    requireCondition(density > 0, 'density', 'Enter a concrete density greater than zero.');

    const totalCuFt = cuFt * waste(v);
    const totalYd3 = totalCuFt / 27;
    const totalM3 = totalCuFt / FT_PER_M ** 3;
    const bags = roundUp(totalCuFt / v.yield);
    const lb = totalCuFt * density;

    const pricedQuantities: Record<string, { value: number; unit: string; label: string }> = {
      'USD/yd3': { value: totalYd3, unit: 'yd³', label: 'cubic yards' },
      'USD/m3': { value: totalM3, unit: 'm³', label: 'cubic meters' },
      'USD/ft3': { value: totalCuFt, unit: 'ft³', label: 'cubic feet' },
      'USD/bag': { value: bags, unit: 'bags', label: 'whole bags' },
      'USD/ton': { value: lb / 2000, unit: 'US tons', label: 'US tons' },
    };
    const priced = pricedQuantities[u.price] ?? pricedQuantities['USD/yd3'];

    const hasPrice = Number.isFinite(v.price);
    const materials = hasPrice ? priced.value * v.price : Number.NaN;
    const taxAmt = hasPrice ? materials * (v.tax / 100) : Number.NaN;
    const delivery = Number.isFinite(v.delivery) ? v.delivery : 0;
    const shortLoad = Number.isFinite(v.shortLoadFee) ? v.shortLoadFee : 0;
    const pump = Number.isFinite(v.pumpFee) ? v.pumpFee : 0;
    const reinforcement = Number.isFinite(v.reinforcement) ? v.reinforcement : 0;
    const formwork = Number.isFinite(v.formwork) ? v.formwork : 0;
    const finishing = Number.isFinite(v.finishing) ? v.finishing : 0;
    const projectCharges = delivery + shortLoad + pump + reinforcement + formwork + finishing;
    const subtotalBeforeTax = hasPrice ? materials + projectCharges : Number.NaN;
    const totalCost = hasPrice ? subtotalBeforeTax + taxAmt : Number.NaN;

    const baseRows: { key: string; label: string; value: number; unit: string; discrete?: boolean }[] = [];

    if (hasPrice) {
      baseRows.push(
        row('primaryCost', 'Estimated project total', totalCost, 'USD'),
        row('materials', 'Concrete material subtotal', materials, 'USD'),
        row('tax', 'Material tax', taxAmt, 'USD'),
        row('projectCharges', 'Other entered project charges', projectCharges, 'USD'),
        row('subtotalBeforeTax', 'Subtotal before material tax', subtotalBeforeTax, 'USD'),
        row('pricedQuantity', `Quantity priced as ${priced.label}`, priced.value, priced.unit),
      );
    } else {
      baseRows.push(row('order', 'Concrete to order', totalYd3, 'yd³'));
    }

    baseRows.push(
      ...(hasPrice ? [row('order', 'Concrete to order', totalYd3, 'yd³')] : []),
      row('net', 'Geometric volume', cuFt / 27, 'yd³'),
      row('ft3', 'Order volume (ft³)', totalCuFt, 'ft³'),
      row('m3', 'Order volume (m³)', totalM3, 'm³'),
      row('L', 'Order volume (L)', totalM3 * 1000, 'L'),
      row('bags', `Bags (entered yield ${fmt(v.yield)} ft³)`, bags, 'bags', true),
      row('bags60', 'Bags (60-lb @ 0.45 ft³)', roundUp(totalCuFt / BAG_YIELD_60), 'bags', true),
      row('bags40', 'Bags (40-lb @ 0.30 ft³)', roundUp(totalCuFt / BAG_YIELD_40), 'bags', true),
      row('weight', 'Estimated order weight (lb)', lb, 'lb'),
      row('weightKg', 'Estimated order weight (kg)', lb / LB_PER_KG, 'kg'),
    );

    if (hasPrice) {
      baseRows.push(
        row('delivery', 'Delivery fee', delivery, 'USD'),
        row('shortLoad', 'Short-load fee', shortLoad, 'USD'),
        row('pump', 'Pump fee', pump, 'USD'),
        row('reinforcement', 'Reinforcement', reinforcement, 'USD'),
        row('formwork', 'Formwork / subbase', formwork, 'USD'),
        row('finishing', 'Finishing / labor', finishing, 'USD'),
        row('effectivePerYd3', 'All-in cost per yd³', totalCost / totalYd3, 'USD/yd³'),
        row('effectivePerM3', 'All-in cost per m³', totalCost / totalM3, 'USD/m³'),
      );
      if (Number.isFinite(planAreaSqFt) && planAreaSqFt > 0) {
        baseRows.push(
          row('costPerSqFt', 'All-in cost per square foot', totalCost / planAreaSqFt, 'USD/ft²'),
          row('costPerM2', 'All-in cost per square meter', totalCost / (planAreaSqFt / 10.7639104167), 'USD/m²'),
        );
      }
    }

    const stepLines = [
      geometryStep,
      `Allowance: ${fmt(cuFt)} ft³ × ${fmt(waste(v))} = ${fmt(totalCuFt)} ft³ = ${fmt(totalYd3)} yd³.`,
      `Whole bags at entered yield: round ${fmt(totalCuFt)} ÷ ${fmt(v.yield)} up to ${bags}.`,
    ];
    if (hasPrice) {
      stepLines.push(
        `Material price basis: ${fmt(priced.value)} ${priced.unit} × $${fmt(v.price)} = $${fmt(materials)}.`,
        `Other entered project charges: $${fmt(projectCharges)}.`,
        `Material tax: $${fmt(materials)} × ${fmt(v.tax)}% = $${fmt(taxAmt)}.`,
        `Estimated total: $${fmt(materials)} + $${fmt(projectCharges)} + $${fmt(taxAmt)} = $${fmt(totalCost)}.`,
      );
    }

    return result(
      baseRows,
      stepLines,
      [
        'Per-bag pricing uses a rounded whole-bag quantity; ready-mix volume pricing uses the allowance-adjusted continuous volume.',
        'Short-load, delivery and pump charges are never guessed. They are included only when you enter them.',
        'Use local supplier quotes and verify which charges are taxable in your jurisdiction.',
      ]
    );
  },
};

// ==========================================================
// 5.  Concrete Mix Calculator — dry-volume nominal mix
// ==========================================================
const concreteMixFields: Field[] = [
  volume('volume', 'Required mixed concrete volume', 1),
  number('cementParts', 'Cement parts by volume', 1, 1, 'Editable example ratio only. Enter the proportions required by the mix design or trial batch.'),
  number('sandParts', 'Sand (fine aggregate) parts by volume', 2, 1),
  number('aggregateParts', 'Coarse aggregate parts by volume', 3, 0),
  number('dryFactor', 'Dry volume / mixed volume factor', 1.54, 1.01, 'Editable dry-volume planning factor. Use trial-batch or project mix data; there is no single universal factor for every material combination.'),
  number('cementDensity', 'Loose cement bulk density (kg/m³)', 1440, 100, 'Editable example bulk density. Use the cement/product data or measured loose bulk density for the material being batched.'),
  number('bagMass', 'Cement bag mass (kg)', 50, 1, 'Common sizes: 40 kg, 50 kg. Check your product.'),
  number('waterRatio', 'Water/cement ratio', 0.5, 0.1, 'Editable example only. Enter the water/cement ratio specified for the mix; this calculator does not choose strength, durability or workability requirements.'),
  allowance,
];

const concreteMix: Model = {
  fields: concreteMixFields,
  formula: 'Dry volume = mixed × dry factor. Cement volume = dry × cement parts / total. Sand / aggregate similarly. Cement mass = cement volume × bulk density. Water = cement mass × w/c ratio.',
  assumptions: [
    'Ratios are by loose dry volume, not mass. A nominal ratio does not establish concrete strength, durability, or water/cement ratio.',
    'The dry volume factor 1.54 accounts for void space in loose aggregate. Actual factor depends on grading, moisture and compaction.',
    'This is a nominal mix estimation tool, not structural mix design. Use a specified mix design for structural concrete.',
    'Cement bulk density 1,440 kg/m³ is for loose Portland cement. Clinker density is ~3,150 kg/m³.',
    'Sand and aggregate are measured in dry-rodded volume; actual mass depends on moisture content.',
    'Water content is approximate; absorption and admixtures alter actual mix water.',
  ],
  sources: [quikrete, 'https://www.cement.org/learn', 'https://www.concrete.org/topics-in-concrete/concrete-mixes'],
  calculate(v, u) {
    const totalParts = v.cementParts + v.sandParts + v.aggregateParts;
    if (totalParts === 0) {
      requireCondition(false, 'mix', 'At least one mix ingredient must be specified.');
    }
    // readInputs converts volume input to ft³. Convert back to m³ for the metric-based mix math.
    const cuFtPerM3 = FT_PER_M ** 3; // ≈ 35.3147
    const mixedM3 = v.volume / cuFtPerM3 * waste(v);
    const dryM3 = mixedM3 * v.dryFactor;
    const cementVolM3 = dryM3 * v.cementParts / totalParts;
    const sandVolM3 = dryM3 * v.sandParts / totalParts;
    const aggVolM3 = dryM3 * v.aggregateParts / totalParts;
    const cementMassKg = cementVolM3 * v.cementDensity;
    const bags50 = roundUp(cementMassKg / v.bagMass);
    // bag breakdown for common sizes — published in QUIKRETE/Sakrete spec sheets
    const approxMass = cementMassKg;
    const totalMixed = mixedM3;
    const waterMassKg = cementMassKg * v.waterRatio;
    const waterVolL = waterMassKg; // 1 kg water ≈ 1 L

    // Assume sand at 1600 kg/m³ and aggregate at 1500 kg/m³ bulk density (typical dry-rodded)
    const sandMassKg = sandVolM3 * 1600;
    const aggMassKg = aggVolM3 * 1500;

    return result(
      [
        row('mixedVol', 'Mixed concrete volume', mixedM3, 'm³'),
        row('mixedFt3', 'Mixed concrete volume', mixedM3 * cuFtPerM3, 'ft³'),
        row('mixedYd3', 'Mixed concrete volume', mixedM3 * cuFtPerM3 / 27, 'yd³'),
        row('dryVol', 'Dry material volume', dryM3, 'm³'),
        row('cementVol', 'Cement volume', cementVolM3, 'm³'),
        row('cementMass', 'Loose cement mass', cementMassKg, 'kg'),
        row('cementBags', 'Whole cement bags', bags50, 'bags', true),
        row('sandVol', 'Dry sand volume', sandVolM3, 'm³'),
        row('sandMass', 'Sand mass (approx)', sandMassKg, 'kg'),
        row('aggregateVol', 'Dry coarse aggregate volume', aggVolM3, 'm³'),
        row('aggregateMass', 'Aggregate mass (approx)', aggMassKg, 'kg'),
        row('waterMass', 'Approx water mass', waterMassKg, 'kg'),
        row('waterVol', 'Approx water volume', waterVolL, 'L'),
        row('totalParts', 'Total parts', totalParts, 'parts'),
        row('wcRatio', 'Water/cement ratio used', v.waterRatio, ''),
      ],
      [
        `Parts: ${fmt(v.cementParts)} + ${fmt(v.sandParts)} + ${fmt(v.aggregateParts)} = ${totalParts}.`,
        `Dry material: ${fmt(mixedM3)} × ${fmt(v.dryFactor)} = ${fmt(dryM3)} m³.`,
        `Cement volume: ${fmt(dryM3)} × ${fmt(v.cementParts)} / ${totalParts} = ${fmt(cementVolM3)} m³.`,
        `Cement mass: ${fmt(cementVolM3)} × ${fmt(v.cementDensity)} kg/m³ = ${fmt(cementMassKg)} kg → ${bags50} bags of ${v.bagMass} kg.`,
        `Sand: ${fmt(sandVolM3)} m³ ≈ ${fmt(sandMassKg)} kg; Aggregate: ${fmt(aggVolM3)} m³ ≈ ${fmt(aggMassKg)} kg.`,
        `Approx water: ${fmt(cementMassKg)} × ${fmt(v.waterRatio)} = ${fmt(waterMassKg)} kg (${fmt(waterVolL)} L).`,
      ]
    );
  },
};

// ==========================================================
// 6.  Concrete Pour Calculator — truck planning
// ==========================================================
const concretePourFields: Field[] = [
  length('length', 'Pour length', 20, 'ft'),
  length('width', 'Pour width', 10, 'ft'),
  length('depth', 'Pour thickness', 4, 'in'),
  count('quantity', 'Number of separate pours', 1),
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag', 'USD/ton']),
  number('truckCapacity', 'Ready-mix truck capacity (yd³)', 10, 1, 'Typical transit mixer holds 9–11 yd³. Edit to your supplier\'s load.'),
  number('minOrder', 'Supplier minimum order (yd³)', 1, 0.1, 'Below this, suppliers may add a short-load fee or refuse delivery.'),
  number('shortLoadFee', 'Short-load fee ($)', 0, 0, 'Added when the final truck is below the supplier\'s minimum.'),
  number('pumpRate', 'Pour rate (yd³/hr)', 30, 1, 'Planning example only. Enter the placement rate expected for the actual crew, access and equipment.'),
];

const concretePour: Model = {
  fields: concretePourFields,
  formula: 'Total = L × W × D × pours × (1 + waste/100). Loads = ceil(total yd³ / truckCapacity). Last load = total − (loads − 1) × capacity. Last truck under minimum triggers short-load fee.',
  assumptions: [
    ...standardAssumptions,
    'Truck load count is a planning estimate. Actual capacity varies by supplier, distance, and mix type.',
    'A "short load" is any delivery below the supplier\'s minimum. Confirm the threshold on your quote.',
    'Pour rate depends on placement method. Chute is faster, line pump is slower, boom pump is intermediate.',
    'Weather, traffic, slump, and crew size all affect the actual pour duration.',
  ],
  sources: [quikrete, geometry, 'https://www.nrmca.org/'],
  calculate(v, u) {
    const netCuFt = v.length * v.width * v.depth * v.quantity;
    const totalCuFt = netCuFt * waste(v);
    const totalCuYd = totalCuFt / 27;
    const bags = roundUp(totalCuFt / v.yield);
    const lb = totalCuFt * densityLb(v.density, u.density);

    // Load planning
    const trucks = Math.max(1, roundUp(totalCuYd / v.truckCapacity));
    const lastTruckYd = Math.max(0, totalCuYd - (trucks - 1) * v.truckCapacity);
    const isShortLoad = lastTruckYd > 0 && lastTruckYd < v.minOrder;
    const shortFee = isShortLoad && Number.isFinite(v.shortLoadFee) ? v.shortLoadFee : 0;
    const priceQuantities: Record<string, number> = {
      'USD/yd3': totalCuYd,
      'USD/m3': totalCuFt / FT_PER_M ** 3,
      'USD/ft3': totalCuFt,
      'USD/bag': bags,
      'USD/ton': lb / 2000,
    };
    const pricedQuantity = priceQuantities[u.price];
    const totalCost = Number.isFinite(v.price) && pricedQuantity !== undefined
      ? pricedQuantity * v.price + shortFee
      : NaN;

    // Pour duration
    const durationHr = v.pumpRate > 0 ? totalCuYd / v.pumpRate : 0;

    return result(
      [
        row('order', 'Total concrete', totalCuYd, 'yd³'),
        row('net', 'Geometric volume', netCuFt / 27, 'yd³'),
        row('ft3', 'Total volume (ft³)', totalCuFt, 'ft³'),
        row('m3', 'Total volume (m³)', totalCuFt / FT_PER_M ** 3, 'm³'),
        row('bags', `Bags (entered yield ${fmt(v.yield)} ft³)`, bags, 'bags', true),
        row('weight', 'Estimated order weight (lb)', lb, 'lb'),
        row('tons', 'Estimated order weight (US tons)', lb / 2000, 'US tons'),
        row('trucks', 'Ready-mix truck loads', trucks, 'loads', true),
        row('lastTruck', 'Final truck size', lastTruckYd, 'yd³'),
        row('shortLoad', 'Short-load fee', shortFee, 'USD'),
        row('durationHr', 'Estimated pour duration', durationHr, 'hours'),
        row('durationMin', 'Estimated pour duration', durationHr * 60, 'minutes'),
        ...(Number.isFinite(totalCost) ? [row('totalCost', 'Material + short-load', totalCost, 'USD')] : []),
      ],
      [
        `${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} × ${v.quantity} = ${fmt(netCuFt)} ft³.`,
        `With ${fmt(v.waste)}% allowance: ${fmt(totalCuFt)} ft³ = ${fmt(totalCuYd)} yd³.`,
        `${fmt(totalCuYd)} yd³ ÷ ${fmt(v.truckCapacity)} yd³/truck = ${trucks} truck loads (last = ${fmt(lastTruckYd)} yd³).`,
        isShortLoad ? `Final truck is below ${fmt(v.minOrder)} yd³ minimum — short-load fee applied.` : `Final truck meets or exceeds ${fmt(v.minOrder)} yd³ minimum.`,
        `Pour time: ${fmt(totalCuYd)} yd³ ÷ ${fmt(v.pumpRate)} yd³/hr ≈ ${fmt(durationHr * 60)} min.`,
      ]
    );
  },
};

// ==========================================================
// 7.  Concrete Slab Calculator — best-in-class
// ==========================================================
const concreteSlabFields: Field[] = [
  { id: 'slabShape', label: 'Slab shape', value: 0, unit: '', integer: true, min: 0, max: 1,
    options: [
      { value: 0, label: 'Rectangle' },
      { value: 1, label: 'Circle' },
    ] },
  // Rectangle
  { ...length('length', 'Slab length', 10, 'ft'), visibleWhen: { field: 'slabShape', equals: 0 } },
  { ...length('width', 'Slab width', 10, 'ft'), visibleWhen: { field: 'slabShape', equals: 0 } },
  // Circle
  { ...positiveOrZero(length('diameter', 'Slab diameter (circle)', 0, 'ft')), visibleWhen: { field: 'slabShape', equals: 1 } },
  // Common
  length('thickness', 'Slab thickness', 4, 'in'),
  count('quantity', 'Identical slabs', 1),
  // Advanced
  positiveOrZero(length('thickenedEdgeDepth', 'Thickened-edge depth at perimeter (optional)', 0, 'in'),
    { help: 'Leave 0 for a uniform slab. A typical thickened edge adds width × extra depth around the perimeter.' }),
  positiveOrZero(length('thickenedEdgeWidth', 'Thickened-edge width around perimeter (optional)', 0, 'in')),
  // Material
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']),
];

const concreteSlab: Model = {
  fields: concreteSlabFields,
  formula: 'Rectangle: V = L × W × T × Q. Circle: V = π × (D/2)² × T × Q. Thickened edge: V_edge = perimeter × edge_width × (edge_depth − T), added when edge_depth > T.',
  assumptions: [
    ...standardAssumptions,
    'Slab thickness is a design input. Enter the thickness specified for the project; this volume calculator does not determine structural adequacy.',
    'The thickened edge is treated as an additional perimeter band of (edge_depth − slab_thickness) × edge_width.',
  ],
  sources: [geometry, quikrete, 'https://www.concrete.org/tools/frequently-asked-questions'],
  calculate(v, u) {
    const isCircle = Math.round(v.slabShape) === 1;
    let slabCuFt: number;
    let steps: string[];
    if (isCircle) {
      const r = v.diameter / 2;
      slabCuFt = Math.PI * r * r * v.thickness * v.quantity;
      steps = [
        `Circle: π × (${fmt(v.diameter)}/2)² × ${fmt(v.thickness)} × ${v.quantity} = ${fmt(slabCuFt)} ft³.`,
      ];
    } else {
      slabCuFt = v.length * v.width * v.thickness * v.quantity;
      steps = [
        `Rectangle: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.thickness)} × ${v.quantity} = ${fmt(slabCuFt)} ft³.`,
      ];
    }
    const edgeAdded = v.thickenedEdgeDepth > v.thickness && v.thickenedEdgeWidth > 0
      ? (isCircle
          ? Math.PI * v.diameter * v.thickenedEdgeWidth * (v.thickenedEdgeDepth - v.thickness) * v.quantity
          : 2 * (v.length + v.width) * v.thickenedEdgeWidth * (v.thickenedEdgeDepth - v.thickness) * v.quantity)
      : 0;
    const cuFt = slabCuFt + edgeAdded;

    const extraRows: { key: string; label: string; value: number; unit: string; discrete?: boolean }[] = [];
    if (edgeAdded > 0) {
      steps.push(`Thickened edge: ≈ ${fmt(edgeAdded)} ft³ added.`);
      extraRows.push(row('thickenedEdge', 'Thickened-edge contribution', edgeAdded, 'ft³'));
    }
    return concreteResult(cuFt, v, u, steps, extraRows);
  },
};

// ==========================================================
// 8.  Concrete Footing Calculator
// ==========================================================
const concreteFootingFields: Field[] = [
  { id: 'footingShape', label: 'Footing type', value: 0, unit: '', integer: true, min: 0, max: 3,
    options: [
      { value: 0, label: 'Strip / continuous' },
      { value: 1, label: 'Square isolated pad' },
      { value: 2, label: 'Rectangular isolated pad' },
      { value: 3, label: 'Round / circular' },
    ] },
  // Strip
  length('length', 'Footing length (centerline)', 20, 'ft'),
  length('width', 'Footing width', 12, 'in'),
  length('depth', 'Footing depth', 12, 'in'),
  // Square
  positiveOrZero(length('sideWidth', 'Side width (square pad)', 24, 'in')),
  // Rectangular
  positiveOrZero(length('padLength', 'Pad length (rectangular)', 30, 'in')),
  positiveOrZero(length('padWidth', 'Pad width (rectangular)', 24, 'in')),
  // Round
  positiveOrZero(length('diameter', 'Diameter (round)', 24, 'in')),
  count('quantity', 'Number of footings', 1),
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']),
];

const concreteFooting: Model = {
  fields: concreteFootingFields,
  formula: 'Strip: V = length × width × depth. Square: V = s² × depth × Q. Rectangular: V = pl × pw × depth × Q. Round: V = π × (D/2)² × depth × Q.',
  assumptions: [
    ...standardAssumptions,
    'Strip footing length should use the centerline method so corners are not double-counted.',
    'This estimates concrete volume only. Reinforcement, dowels, and keyways require separate measurement.',
    'Footing size must come from the structural design; this tool does not size footings.',
    'Stepped or belled footings require splitting into stacked prisms — calculate each section separately.',
  ],
  sources: [geometry, 'https://www.iccsafe.org/', 'https://www.crsi.org/'],
  calculate(v, u) {
    const shape = Math.round(v.footingShape);
    let cuFt: number;
    let steps: string[];
    let extra: { key: string; label: string; value: number; unit: string; discrete?: boolean }[] = [];

    switch (shape) {
      case 0: {
        cuFt = v.length * v.width * v.depth * v.quantity;
        steps = [`Strip: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} × ${v.quantity} = ${fmt(cuFt)} ft³.`];
        break;
      }
      case 1: {
        const s = v.sideWidth;
        cuFt = s * s * v.depth * v.quantity;
        steps = [`Square pad: ${fmt(s)} × ${fmt(s)} × ${fmt(v.depth)} × ${v.quantity} = ${fmt(cuFt)} ft³.`];
        break;
      }
      case 2: {
        cuFt = v.padLength * v.padWidth * v.depth * v.quantity;
        steps = [`Rectangular pad: ${fmt(v.padLength)} × ${fmt(v.padWidth)} × ${fmt(v.depth)} × ${v.quantity} = ${fmt(cuFt)} ft³.`];
        break;
      }
      case 3: {
        const r = v.diameter / 2;
        cuFt = Math.PI * r * r * v.depth * v.quantity;
        steps = [`Round: π × (${fmt(v.diameter)}/2)² × ${fmt(v.depth)} × ${v.quantity} = ${fmt(cuFt)} ft³.`];
        break;
      }
      default: {
        cuFt = 0;
        steps = ['Select a footing type.'];
      }
    }
    return concreteResult(cuFt, v, u, steps, extra);
  },
};

// ==========================================================
// 9.  Concrete Foundation Calculator — multi-component
// ==========================================================
const concreteFoundationFields: Field[] = [
  // Wall — zero disables this component.
  positiveOrZero(length('wallLength', 'Foundation wall length', 40, 'ft')),
  positiveOrZero(length('wallHeight', 'Wall height', 8, 'ft')),
  positiveOrZero(length('wallThickness', 'Wall thickness', 8, 'in')),
  positiveOrZero(area('wallOpenings', 'Openings (windows/doors)', 0, 0),
    { help: 'Subtract the total opening area once, in ft².' }),
  // Footing — zero disables this component.
  positiveOrZero(length('footingLength', 'Footing length', 40, 'ft')),
  positiveOrZero(length('footingWidth', 'Footing width', 12, 'in')),
  positiveOrZero(length('footingDepth', 'Footing depth', 12, 'in')),
  // Slab on grade
  positiveOrZero(length('slabLength', 'Slab on grade length', 0, 'ft')),
  positiveOrZero(length('slabWidth', 'Slab on grade width', 0, 'ft')),
  positiveOrZero(length('slabThickness', 'Slab thickness', 0, 'in')),
  // Pier
  positiveOrZero(count('pierCount', 'Pier count', 0, 0)),
  positiveOrZero(length('pierDiameter', 'Pier diameter', 0, 'in')),
  positiveOrZero(length('pierDepth', 'Pier depth', 0, 'in')),
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']),
];

const concreteFoundation: Model = {
  fields: concreteFoundationFields,
  formula: 'Wall: V_w = L × H × T − openings_area × T. Footing: V_f = L × W × D. Slab: V_s = L × W × T. Pier: V_p = π × (D/2)² × H × Q. Total = V_w + V_f + V_s + V_p.',
  assumptions: [
    ...standardAssumptions,
    'Foundation walls: enter centerline length so corners are not double-counted.',
    'Only include components that apply to your project. Leave unused components at zero.',
    'Openings are entered in ft² and multiplied by wall thickness to convert to volume.',
    'Enter the actual footing length from the project geometry. Stepped or discontinuous footings must be measured as separate sections.',
    'This is a material quantity estimator, not a structural design tool.',
  ],
  sources: [geometry, 'https://www.concrete.org/tools/frequently-asked-questions'],
  calculate(v, u) {
    let cuFt = 0;
    const parts: string[] = [];
    const extras: { key: string; label: string; value: number; unit: string; discrete?: boolean }[] = [];

    if (v.wallLength > 0 && v.wallHeight > 0 && v.wallThickness > 0) {
      const wallGrossFt3 = v.wallLength * v.wallHeight * v.wallThickness;
      const openingsFt3 = v.wallOpenings * v.wallThickness;
      const wallVol = Math.max(0, wallGrossFt3 - openingsFt3);
      cuFt += wallVol;
      parts.push(`Wall: ${fmt(v.wallLength)} × ${fmt(v.wallHeight)} × ${fmt(v.wallThickness)} − openings ${fmt(v.wallOpenings)} ft² × ${fmt(v.wallThickness)} = ${fmt(wallVol)} ft³`);
      extras.push(row('wall', 'Foundation wall', wallVol, 'ft³'));
    }

    if (v.footingLength > 0 && v.footingWidth > 0 && v.footingDepth > 0) {
      const footVol = v.footingLength * v.footingWidth * v.footingDepth;
      cuFt += footVol;
      parts.push(`Footing: ${fmt(v.footingLength)} × ${fmt(v.footingWidth)} × ${fmt(v.footingDepth)} = ${fmt(footVol)} ft³`);
      extras.push(row('foot', 'Footing', footVol, 'ft³'));
    }

    if (v.slabLength > 0 && v.slabWidth > 0 && v.slabThickness > 0) {
      const slabVol = v.slabLength * v.slabWidth * v.slabThickness;
      cuFt += slabVol;
      parts.push(`Slab on grade: ${fmt(v.slabLength)} × ${fmt(v.slabWidth)} × ${fmt(v.slabThickness)} = ${fmt(slabVol)} ft³`);
      extras.push(row('slab', 'Slab on grade', slabVol, 'ft³'));
    }

    if (v.pierCount > 0 && v.pierDiameter > 0 && v.pierDepth > 0) {
      const r = v.pierDiameter / 2;
      const pierVol = Math.PI * r * r * v.pierDepth * v.pierCount;
      cuFt += pierVol;
      parts.push(`Piers: π × ${fmt(r)}² × ${fmt(v.pierDepth)} × ${v.pierCount} = ${fmt(pierVol)} ft³`);
      extras.push(row('piers', 'Piers', pierVol, 'ft³'));
    }

    if (cuFt === 0) {
      requireCondition(false, 'dimensions', 'Enter at least one foundation component (wall, footing, slab, or pier).');
    }

    return concreteResult(cuFt, v, u, parts, extras);
  },
};

// ==========================================================
// 10.  Concrete Wall Calculator
// ==========================================================
const concreteWallFields: Field[] = [
  length('length', 'Total wall length (centerline)', 40, 'ft'),
  length('height', 'Wall height', 8, 'ft'),
  length('thickness', 'Wall thickness', 8, 'in'),
  { ...openings, value: 0, help: 'Enter the combined door, window and utility opening area once; it is multiplied by wall thickness to deduct opening volume.' },
  allowance,
  densityField,
  yieldField60,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']),
];

const concreteWall: Model = {
  fields: concreteWallFields,
  formula: 'Gross = L × H × T. Net = gross − opening volume. Total = Σ all segments.',
  assumptions: [
    'Use the combined centerline length of wall runs so corners are counted once, not twice.',
    'Subtract door, window, and utility openings. Enter each opening as length × height × thickness.',
    'This calculates cast-in-place concrete walls. Retaining walls with different backfill pressures need engineering review.',
    'Wall thickness must come from the structural design. This calculator estimates quantity from the thickness you enter.',
  ],
  sources: [geometry, cmha],
  calculate(v, u) {
    const gross = v.length * v.height * v.thickness;
    const openingVolume = v.openings * v.thickness;
    requireCondition(openingVolume <= gross, 'openings', 'Opening area cannot exceed the measured wall face. Check dimensions.');
    const net = gross - openingVolume;
    const oneSideFormArea = v.length * v.height;
    return concreteResult(net, v, u, [
      `Gross: ${fmt(v.length)} × ${fmt(v.height)} × ${fmt(v.thickness)} = ${fmt(gross)} ft³.`,
      `Openings: ${fmt(v.openings)} ft² × ${fmt(v.thickness)} ft = ${fmt(openingVolume)} ft³; net = ${fmt(net)} ft³.`,
    ], [
      row('gross', 'Gross volume', gross, 'ft³'),
      row('openingsVolume', 'Opening deductions', openingVolume, 'ft³'),
      row('formArea', 'Form contact area (one side)', oneSideFormArea, 'ft²'),
      row('formTotal', 'Form contact area (both sides)', oneSideFormArea * 2, 'ft²'),
    ]);
  },
};

// ==========================================================
// 11.  Concrete Column Calculator
// ==========================================================
const columnShapeField: Field = {
  id: 'columnShape', label: 'Column shape', value: 0, unit: '', integer: true, min: 0, max: 2,
  options: [
    { value: 0, label: 'Circular (Sonotube)' },
    { value: 1, label: 'Square' },
    { value: 2, label: 'Rectangular' },
  ],
};

const concreteColumnFields: Field[] = [
  columnShapeField,
  positiveOrZero(length('diameter', 'Diameter (circular / Sonotube)', 12, 'in')),
  positiveOrZero(length('side', 'Side dimension (square)', 12, 'in')),
  positiveOrZero(length('rectWidth', 'Width (rectangular)', 12, 'in')),
  positiveOrZero(length('rectDepth', 'Depth (rectangular)', 12, 'in')),
  length('height', 'Column height', 8, 'ft'),
  count('quantity', 'Number of columns', 1),
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']),
];

const concreteColumn: Model = {
  fields: concreteColumnFields,
  formula: 'Circular: V = π × (D/24)² × H × Q. Square: V = (S/12)² × H × Q. Rectangular: V = (W/12) × (D/12) × H × Q.',
  assumptions: [
    ...standardAssumptions,
    'Column dimensions are the form dimensions, not the overall footprint including kick-outs.',
    'Common Sonotube sizes: 6, 8, 10, 12, 14, 16, 18, 24 in. Form thickness is ignored.',
    'This estimates the concrete volume; rebar, anchor bolts, and embed plates require separate measurement.',
  ],
  sources: [geometry, acicr, 'https://www.sonoco.com/products/sonotube'],
  calculate(v, u) {
    const s = Math.round(v.columnShape);
    let cuFt: number;
    let steps: string[];

    if (s === 1) {
      cuFt = v.side ** 2 * v.height * v.quantity;
      steps = [`Square: (${fmt(v.side)} × ${fmt(v.side)}) × ${fmt(v.height)} × ${v.quantity} = ${fmt(cuFt)} ft³.`];
    } else if (s === 2) {
      cuFt = v.rectWidth * v.rectDepth * v.height * v.quantity;
      steps = [`Rectangular: ${fmt(v.rectWidth)} × ${fmt(v.rectDepth)} × ${fmt(v.height)} × ${v.quantity} = ${fmt(cuFt)} ft³.`];
    } else {
      const r = v.diameter / 2;
      cuFt = Math.PI * r * r * v.height * v.quantity;
      steps = [`Circular: π × (${fmt(v.diameter)}/2)² × ${fmt(v.height)} × ${v.quantity} = ${fmt(cuFt)} ft³.`];
    }
    return concreteResult(cuFt, v, u, steps);
  },
};

// ==========================================================
// 12.  Concrete Curb Calculator — with reverse mode
// ==========================================================
const concreteCurbFields: Field[] = [
  { id: 'curbMode', label: 'Mode', value: 0, unit: '', integer: true, min: 0, max: 1,
    options: [
      { value: 0, label: 'Forward — given length' },
      { value: 1, label: 'Reverse — given concrete volume' },
    ] },
  { id: 'curbStyle', label: 'Curb style', value: 0, unit: '', integer: true, min: 0, max: 1,
    options: [
      { value: 0, label: 'Curb + gutter' },
      { value: 1, label: 'Curb only' },
    ] },
  length('length', 'Curb run length (forward)', 20, 'ft'),
  positiveOrZero(volume('volume', 'Available concrete (reverse)', 0),
    { help: 'Required for reverse mode. With X concrete, how many feet of curb can be poured?' }),
  length('curbWidth', 'Curb face width', 6, 'in'),
  length('curbHeight', 'Curb height', 12, 'in'),
  positiveOrZero(length('gutterWidth', 'Gutter width beyond curb', 18, 'in')),
  length('gutterThickness', 'Gutter thickness', 6, 'in'),
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']),
];

const concreteCurb: Model = {
  fields: concreteCurbFields,
  formula: 'Forward: V = L × (curbArea + gutterArea). Reverse: linear_ft = volume_ft³ / (curbArea + gutterArea).',
  assumptions: [
    ...standardAssumptions,
    'The curb and gutter cross-sections are treated as non-overlapping rectangles.',
    'Gutter width is measured beyond the curb face, not including the curb width.',
    'For shaped curbs (barrier, mountable), use the cross-section area from the engineering drawing.',
    'In reverse mode, "available concrete" already includes the waste allowance of the original estimate.',
  ],
  sources: [geometry, 'https://www.aci.org/'],
  calculate(v, u) {
    const isReverse = Math.round(v.curbMode) === 1;
    const gutterW = Math.round(v.curbStyle) === 1 ? 0 : v.gutterWidth;
    const curbArea = v.curbWidth * v.curbHeight;
    const gutterArea = gutterW * v.gutterThickness;
    const totalArea = curbArea + gutterArea;
    const style = Math.round(v.curbStyle) === 1 ? 'curb only' : 'curb + gutter';

    const extras: { key: string; label: string; value: number; unit: string; discrete?: boolean }[] = [];

    if (isReverse) {
      const availableFt3 = v.volume;
      const linearFt = totalArea > 0 ? availableFt3 / totalArea : 0;
      const reverseRows = [
        row('linearFt', 'Linear feet of curb', linearFt, 'ft'),
        row('linearM', 'Linear meters of curb', linearFt / FT_PER_M, 'm'),
        row('crossArea', 'Cross-section area', totalArea, 'ft²'),
        row('crossSqIn', 'Cross-section area', totalArea * 144, 'in²'),
        row('volume', 'Available concrete', availableFt3 / 27, 'yd³'),
        row('volumeFt3', 'Available concrete', availableFt3, 'ft³'),
      ];
      withCost(reverseRows, v.price, u.price, {
        'USD/yd3': availableFt3 / 27,
        'USD/m3': availableFt3 / FT_PER_M ** 3,
        'USD/ft3': availableFt3,
        'USD/bag': roundUp(availableFt3 / v.yield),
      });
      return result(
        reverseRows,
        [
          `${style} cross-section:`,
          `  Curb: ${fmt(v.curbWidth)} × ${fmt(v.curbHeight)} = ${fmt(curbArea)} ft².`,
          gutterW > 0 ? `  Gutter: ${fmt(gutterW)} × ${fmt(v.gutterThickness)} = ${fmt(gutterArea)} ft².` : '  No gutter (curb only).',
          `Total cross-section = ${fmt(totalArea)} ft².`,
          `With ${fmt(availableFt3 / 27)} yd³ = ${fmt(availableFt3)} ft³ of concrete:`,
          `  Linear feet = ${fmt(availableFt3)} ÷ ${fmt(totalArea)} = ${fmt(linearFt)} ft.`,
        ],
      );
    }

    let cuFt = v.length * totalArea;
    const steps = [
      `${style}: curb = ${fmt(v.curbWidth)} × ${fmt(v.curbHeight)} = ${fmt(curbArea)} ft².`,
      gutterW > 0 ? `Gutter = ${fmt(gutterW)} × ${fmt(v.gutterThickness)} = ${fmt(gutterArea)} ft².` : 'No gutter (curb only).',
      `Total cross-section = ${fmt(totalArea)} ft².`,
      `${fmt(v.length)} ft × ${fmt(totalArea)} ft² = ${fmt(cuFt)} ft³.`,
    ];
    return concreteResult(cuFt, v, u, steps, [
      row('crossArea', 'Cross-section area', totalArea, 'ft²'),
      row('curbSection', 'Curb section', curbArea, 'ft²'),
      row('gutterSection', 'Gutter section', gutterArea, 'ft²'),
    ]);
  },
};

// ==========================================================
// 13.  Concrete Stair Calculator — solid + waist-slab
// ==========================================================
const concreteStairFields: Field[] = [
  { id: 'stairModel', label: 'Stair model', value: 0, unit: '', integer: true, min: 0, max: 1,
    options: [
      { value: 0, label: 'Solid / mass concrete' },
      { value: 1, label: 'Waist-slab RCC (inclined slab + steps)' },
    ],
    help: 'Solid stairs use full concrete fill from base to top tread. Waist-slab stairs have a thin inclined structural slab with triangular step wedges cast on top.' },
  length('width', 'Stair width', 4, 'ft'),
  length('rise', 'Riser height', 7, 'in'),
  length('run', 'Tread depth', 11, 'in'),
  count('steps', 'Number of steps', 4),
  positiveOrZero(length('waistThickness', 'Waist slab thickness', 6, 'in'),
    { help: 'Required when stair model = Waist-slab RCC. Ignored for solid stairs.' }),
  positiveOrZero(length('landingLength', 'Landing length (beyond top tread)', 0, 'ft')),
  positiveOrZero(length('landingWidth', 'Landing width', 4, 'ft')),
  positiveOrZero(length('landingThickness', 'Landing thickness (override)', 0, 'in'),
    { help: 'Leave 0 to use waist slab thickness. Otherwise enter the design thickness.' }),
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']),
];

const concreteStair: Model = {
  fields: concreteStairFields,
  formula: 'Solid: V = W × rise × run × n(n+1)/2 + landing. Waist-slab: slab V = √(totalRun² + totalRise²) × W × T_w; step wedges V = 0.5 × n × run × rise × W; landing V = L × W × T.',
  assumptions: [
    ...standardAssumptions,
    'Solid stairs use full concrete fill; each tread section is one riser taller than the one below it.',
    'Waist-slab stairs have an inclined structural slab (waist slab) with triangular step wedges cast on top.',
    'The waist slab thickness and step geometry must come from structural drawings. This tool estimates volume only; it does not establish structural adequacy.',
    'The landing is at the top elevation and does NOT include the top tread (which is part of the steps).',
    'For open-riser, spiral, or soil-filled stairs, use the actual section from the design drawing.',
  ],
  sources: [geometry, 'https://www.iccsafe.org/'],
  calculate(v, u) {
    const model = Math.round(v.stairModel); // 0 = solid, 1 = waist-slab
    const Wf = v.width;
    const Rise = v.rise;
    const Run = v.run;
    const n = v.steps;
    const totalRiseFt = n * Rise;
    const totalRunFt = n * Run;

    if (model === 1) {
      const slopedLength = Math.sqrt(totalRunFt ** 2 + totalRiseFt ** 2);
      const waistT = v.waistThickness;
      const landingT = v.landingThickness > 0 ? v.landingThickness : waistT;
      const landingW = v.landingWidth > 0 ? v.landingWidth : Wf;

      const waistSlabVol = slopedLength * Wf * waistT;
      const wedgeArea = 0.5 * n * Run * Rise;
      const wedgeVol = wedgeArea * Wf;
      const landingVol = v.landingLength > 0 && landingW > 0
        ? v.landingLength * landingW * landingT
        : 0;

      const cuFt = waistSlabVol + wedgeVol + landingVol;
      const slopedLengthRatio = totalRunFt === 0 ? 0 : totalRunFt / slopedLength;

      return concreteResult(cuFt, v, u, [
        `Waist-slab RCC mode:`,
        `  Total run × rise: ${fmt(totalRunFt)} × ${fmt(totalRiseFt)} ft.`,
        `  Sloped length = √(${fmt(totalRunFt)}² + ${fmt(totalRiseFt)}²) = ${fmt(slopedLength)} ft.`,
        `  Waist slab: ${fmt(slopedLength)} × ${fmt(Wf)} × ${fmt(waistT)} = ${fmt(waistSlabVol)} ft³.`,
        `  Step wedges (above slab): 0.5 × ${fmt(totalRunFt)} × ${fmt(totalRiseFt)} × ${fmt(Wf)} = ${fmt(wedgeVol)} ft³.`,
        landingVol > 0
          ? `  Landing: ${fmt(v.landingLength)} × ${fmt(landingW)} × ${fmt(landingT)} = ${fmt(landingVol)} ft³.`
          : '  No landing.',
        `  Total: ${fmt(cuFt)} ft³.`,
      ], [
        row('waistSlab', 'Waist slab (inclined)', waistSlabVol, 'ft³'),
        row('wedge', 'Step wedges (above slab)', wedgeVol, 'ft³'),
        row('landing', 'Landing', landingVol, 'ft³'),
        row('slopedLength', 'Sloped length', slopedLength, 'ft'),
        row('totalRun', 'Total run', totalRunFt, 'ft'),
        row('totalRise', 'Total rise', totalRiseFt, 'ft'),
        row('slopeRatio', 'Slope (rise/run)', totalRunFt === 0 ? NaN : totalRiseFt / totalRunFt, ''),
      ]);
    }

    // Solid / mass concrete
    const stepVol = Wf * Rise * Run * n * (n + 1) / 2;
    const landingT = v.landingThickness > 0 ? v.landingThickness : v.waistThickness;
    const landingW = v.landingWidth > 0 ? v.landingWidth : Wf;
    const landingVol = v.landingLength > 0 && landingW > 0
      ? v.landingLength * landingW * landingT
      : 0;
    const cuFt = stepVol + landingVol;
    const totalRise = totalRiseFt;
    const totalRun = totalRunFt;

    return concreteResult(cuFt, v, u, [
      `Solid stairs (mass concrete): ${n} steps.`,
      `  W ${fmt(Wf)} × rise ${fmt(Rise)} × run ${fmt(Run)} × ${n}(${n}+1)/2 = ${fmt(stepVol)} ft³.`,
      `  Total rise = ${fmt(totalRise)} ft, total run = ${fmt(totalRun)} ft.`,
      landingVol > 0
        ? `  Landing: ${fmt(v.landingLength)} × ${fmt(landingW)} × ${fmt(landingT)} = ${fmt(landingVol)} ft³.`
        : '  No landing.',
      `  Total: ${fmt(cuFt)} ft³.`,
    ], [
      row('step', 'Step volume', stepVol, 'ft³'),
      row('landing', 'Landing volume', landingVol, 'ft³'),
      row('totalRise', 'Total rise', totalRise, 'ft'),
      row('totalRun', 'Total run', totalRun, 'ft'),
      row('slopeAngle', 'Slope angle', totalRun === 0 ? 90 : Math.atan(totalRise / totalRun) * 180 / Math.PI, '°'),
    ]);
  },
};

// ==========================================================
// 14.  Concrete Ramp Calculator — with ADA slope hint
// ==========================================================
const concreteRampFields: Field[] = [
  length('length', 'Horizontal run length', 10, 'ft'),
  length('width', 'Ramp width', 4, 'ft'),
  length('rise', 'High-end thickness', 18, 'in'),
  positiveOrZero(length('lowThickness', 'Thickness at low end', 0, 'in'),
    { help: 'Often 0 for a ramp on a slab. Add if there is a curb or thickened edge at the low end.' }),
  positiveOrZero(length('landingLength', 'Landing length (top) (optional)', 0, 'ft')),
  positiveOrZero(length('landingWidth', 'Landing width (optional)', 0, 'ft')),
  positiveOrZero(length('landingThickness', 'Landing thickness (optional)', 6, 'in')),
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']),
];

const concreteRamp: Model = {
  fields: concreteRampFields,
  formula: 'Ramp volume = L × W × (high-end thickness + low-end thickness) / 2. Landing = L_land × W_land × T_land. Slope ratio = |high-end thickness − low-end thickness| / horizontal run.',
  assumptions: [
    ...standardAssumptions,
    'The ramp has a linearly varying thickness between the low and high ends.',
    'Enter horizontal plan length, not the sloping surface length.',
    'This models a straight ramp. Curved or switchback ramps require section-based estimation.',
    'Accessibility slope requirements depend on the applicable standard and project condition. Enter the design slope and verify compliance separately.',
    'Landing dimensions and slopes are code/design inputs. This calculator estimates concrete quantity only and does not verify accessibility compliance.',
  ],
  sources: [geometry, 'https://www.ada.gov/'],
  calculate(v, u) {
    const lowTFt = v.lowThickness;
    const highTFt = v.rise;
    const avgThickness = (lowTFt + highTFt) / 2;
    const wedgeFt3 = v.length * v.width * avgThickness;
    const slabFt3 = v.length * v.width * lowTFt;
    const wedgeNet = Math.max(0, wedgeFt3 - slabFt3);

    const landingLen = v.landingLength > 0 ? v.landingLength : 0;
    const landingW = v.landingWidth > 0 ? v.landingWidth : v.width;
    const landingT = v.landingThickness > 0 ? v.landingThickness : 0;
    const landingFt3 = landingLen > 0 && landingT > 0 ? landingLen * landingW * landingT : 0;
    const cuFt = wedgeFt3 + landingFt3;

    const riseDelta = Math.abs(highTFt - lowTFt);
    const slopeRatio = v.length > 0 ? riseDelta / v.length : NaN;
    const slopePct = slopeRatio * 100;
    const slopeAngle = slopeRatio > 0 ? Math.atan(slopeRatio) * 180 / Math.PI : 0;
    const slopedLength = v.length > 0 ? Math.sqrt(riseDelta ** 2 + v.length ** 2) : 0;
    const adaOK = slopeRatio <= 1 / 12;

    return concreteResult(cuFt, v, u, [
      `Average thickness = (${fmt(lowTFt * 12)} + ${fmt(highTFt * 12)}) / 2 = ${fmt(avgThickness * 12)} in.`,
      `Wedge (including ${fmt(lowTFt * 12)}-in base): ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(avgThickness)} = ${fmt(wedgeFt3)} ft³.`,
      landingFt3 > 0 ? `Landing: ${fmt(landingLen)} × ${fmt(landingW)} × ${fmt(v.landingThickness * 12)} = ${fmt(landingFt3)} ft³.` : 'No landing.',
      `Total: ${fmt(cuFt)} ft³.`,
    ], [
      row('wedge', 'Ramp wedge (incl. base)', wedgeFt3, 'ft³'),
      row('wedgeAboveBase', 'Wedge above base thickness', wedgeNet, 'ft³'),
      row('slopedLength', 'Sloped surface length', slopedLength, 'ft'),
      row('slopeRatio', 'Slope ratio (rise/run)', isFinite(slopeRatio) ? slopeRatio : NaN, ''),
      row('slopePct', 'Slope percentage', isFinite(slopePct) ? slopePct : NaN, '%'),
      row('slopeAngle', 'Slope angle', slopeAngle, '°'),
      row('adaCheck', `ADA 1:12 max — ${adaOK ? 'PASS' : 'NOT ADA-COMPLIANT'}`, 0, ''),
    ]);
  },
};

// ==========================================================
// 15.  Concrete Tube Calculator — solid or hollow
// ==========================================================
const concreteTubeFields: Field[] = [
  length('outerDiameter', 'Outside diameter', 12, 'in'),
  positiveOrZero(length('innerDiameter', 'Inside diameter (0 = solid post)', 0, 'in')),
  positiveOrZero(length('wallThickness', 'OR enter wall thickness (0 to use ID)', 0, 'in'),
    { help: 'Use this to set ID via wall thickness. Common Sonotube wall ≈ 0.18 in (ignored in net volume).' }),
  length('height', 'Tube / post height', 8, 'ft'),
  count('quantity', 'Identical tubes', 1),
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']),
];

const concreteTube: Model = {
  fields: concreteTubeFields,
  formula: 'V = π/4 × (Dₒ² − Dᵢ²) × H × Q. If wall thickness > 0, then Dᵢ = Dₒ − 2 × T (in same units).',
  assumptions: [
    ...standardAssumptions,
    'For a solid post, set the inside diameter to 0 and the wall thickness to 0.',
    'Common Sonotube sizes: 6, 8, 10, 12, 14, 16, 18, 24 in. Form cardboard thickness is ignored.',
    'If both inside diameter and wall thickness are entered, inside diameter takes precedence.',
  ],
  sources: [geometry, quikrete, 'https://www.sonoco.com/products/sonotube'],
  calculate(v, u) {
    let innerId = v.innerDiameter;
    if (innerId === 0 && v.wallThickness > 0) {
      requireCondition(2 * v.wallThickness < v.outerDiameter, 'wallThickness', 'Wall thickness must be less than half the outside diameter.');
      innerId = v.outerDiameter - 2 * v.wallThickness;
    }
    requireCondition(innerId < v.outerDiameter, 'innerDiameter', 'Inside diameter must be smaller than outside diameter.');
    const ro = v.outerDiameter / 2;
    const ri = innerId / 2;
    const outerArea = Math.PI * ro * ro;
    const innerArea = Math.PI * ri * ri;
    const netArea = Math.max(0, outerArea - innerArea);
    const cuFt = netArea * v.height * v.quantity;

    return concreteResult(cuFt, v, u, [
      `Outer radius: ${fmt(v.outerDiameter)}/2 = ${fmt(ro)} ft.`,
      innerId > 0 ? `Inner radius: ${fmt(innerId)}/2 = ${fmt(ri)} ft.` : 'Solid (ID = 0).',
      `Net annular area: ${fmt(netArea)} ft² × ${fmt(v.height)} ft × ${v.quantity} = ${fmt(cuFt)} ft³.`,
    ], [
      row('outerArea', 'Outer circle area', outerArea, 'ft²'),
      row('innerArea', 'Inner circle area', innerArea, 'ft²'),
      row('netArea', 'Net annular area', netArea, 'ft²'),
    ]);
  },
};

// ==========================================================
// 16.  Concrete Waste Calculator — discrete increment model
// ==========================================================
const concreteWasteFields: Field[] = [
  ...rectangle,
  length('depth', 'Slab thickness', 4, 'in'),
  count('quantity', 'Identical sections', 1),
  number('wastePercent', 'Waste allowance (%)', 10, 0,
    'Optional ordering allowance for measured project conditions. Enter a project-specific percentage rather than assuming a universal waste value.'),
  positiveOrZero(number('orderIncrement', 'Supplier ordering increment (yd³)', 0.25, 0),
    { help: 'Round up to this increment (e.g. 0.25 yd³). 0 leaves the order at exact yards.' }),
];

const concreteWaste: Model = {
  fields: concreteWasteFields,
  formula: 'Base = L × W × T × Q. Waste volume = base × waste%. Ordered = roundUp(base × (1 + waste%) to orderIncrement).',
  assumptions: [
    'Waste allowance is a percentage added to the calculated volume, not a separate calculation.',
    'Choose an allowance from the actual formwork, subgrade, geometry and ordering conditions; no single percentage fits every pour.',
    'Do not add waste allowance on top of another tool\'s waste-inclusive result.',
    'If you have a supplier who delivers in fixed increments (e.g. 0.25 yd³), enter that increment to round up the final order.',
  ],
  sources: [geometry, 'https://www.acifoundation.com/'],
  calculate(v, u) {
    const netCuFt = v.length * v.width * v.depth * v.quantity;
    const netCuYd = netCuFt / 27;
    const wastePct = v.wastePercent ?? 10;
    const wasteF = 1 + wastePct / 100;
    const totalCuFt = netCuFt * wasteF;
    const totalCuYd = totalCuFt / 27;
    const wasteAmount = totalCuFt - netCuFt;
    const incrementYd = Math.max(0, v.orderIncrement ?? 0);
    let orderedYd = totalCuYd;
    if (incrementYd > 0) {
      orderedYd = Math.ceil(totalCuYd / incrementYd) * incrementYd;
    }
    const unusedCuYd = Math.max(0, orderedYd - totalCuYd);
    const actuallyPlacedCuYd = orderedYd - unusedCuYd;
    const effectiveWastePct = totalCuYd > 0 ? (orderedYd - netCuYd) / netCuYd * 100 : 0;

    return result(
      [
        row('net', 'Net (geometric) volume', netCuYd, 'yd³'),
        row('netFt3', 'Net (geometric) volume', netCuFt, 'ft³'),
        row('netM3', 'Net (geometric) volume', netCuFt / FT_PER_M ** 3, 'm³'),
        row('wastePercent', 'Waste allowance entered', wastePct, '%'),
        row('wasteVolume', 'Waste volume', wasteAmount / 27, 'yd³'),
        row('wasteVolumeFt3', 'Waste volume', wasteAmount, 'ft³'),
        row('order', 'Required order volume', totalCuYd, 'yd³'),
        row('orderFt3', 'Required order volume', totalCuFt, 'ft³'),
        row('orderM3', 'Required order volume', totalCuFt / FT_PER_M ** 3, 'm³'),
        row('ordered', `Ordered volume (rounded${incrementYd > 0 ? ` to ${fmt(incrementYd)} yd³` : ''})`, orderedYd, 'yd³'),
        row('unused', 'Unused / returned volume', unusedCuYd, 'yd³'),
        row('effectiveWaste', 'Effective waste (rounded order)', effectiveWastePct, '%'),
        row('bags80', '80-lb bags (each 0.60 ft³)', roundUp(totalCuFt / BAG_YIELD_80), 'bags', true),
        row('bags60', '60-lb bags (each 0.45 ft³)', roundUp(totalCuFt / BAG_YIELD_60), 'bags', true),
        row('bags40', '40-lb bags (each 0.30 ft³)', roundUp(totalCuFt / BAG_YIELD_40), 'bags', true),
      ],
      [
        `Base: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} × ${v.quantity} = ${fmt(netCuFt)} ft³ = ${fmt(netCuYd)} yd³.`,
        `Waste: ${fmt(netCuFt)} ft³ × ${fmt(wastePct)}% = ${fmt(wasteAmount)} ft³.`,
        `Required order: ${fmt(netCuFt)} + ${fmt(wasteAmount)} = ${fmt(totalCuFt)} ft³ = ${fmt(totalCuYd)} yd³.`,
        incrementYd > 0
          ? `Rounded up to nearest ${fmt(incrementYd)} yd³ = ${fmt(orderedYd)} yd³; unused ${fmt(unusedCuYd)} yd³.`
          : `No rounding increment — order ${fmt(orderedYd)} yd³ exactly.`,
      ]
    );
  },
};

// =============================
// Non-concrete models (unchanged)
// =============================
const layerFields = [
  ...rectangle,
  length('depth', 'Placed thickness', 4, 'in'),
  count('quantity', 'Identical sections', 1),
];

const bulk: Model = {
  fields: [...layerFields, { ...densityField, value: 1.4, unit: 'ton/yd3' }, allowance, price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ton'])],
  formula: 'Volume = length × width × depth × sections; order volume = volume × (1 + allowance / 100); weight = order volume × density.',
  assumptions: [
    'Depth and density must describe the same state: loose delivered material or the finished compacted layer.',
    'Density varies with grading, moisture and compaction. A supplier quote is more reliable than a generic default. Short tons are 2,000 lb.',
  ],
  sources: ['https://www.engineeringtoolbox.com/density-materials-d_1652.html'],
  calculate(v, u) {
    const net = v.length * v.width * v.depth * v.quantity;
    const order = net * waste(v);
    const lb = order * densityLb(v.density, u.density);
    return result(
      withCost(
        [row('order', 'Material volume with allowance', order / 27, 'yd³'), row('tons', 'Estimated order weight', lb / 2000, 'US tons'), row('net', 'Net placed volume', net / 27, 'yd³'), row('m3', 'Order volume', order / FT_PER_M ** 3, 'm³'), row('weight', 'Order weight', lb / LB_PER_KG, 'kg')],
        v.price, u.price, { 'USD/yd3': order / 27, 'USD/m3': order / FT_PER_M ** 3, 'USD/ton': lb / 2000 }
      ),
      [
        `Net: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} × ${v.quantity} = ${fmt(net)} ft³.`,
        `With ${v.waste}% allowance: ${fmt(order)} ft³ ÷ 27 = ${fmt(order / 27)} yd³.`,
        `Weight: ${fmt(order)} ft³ × ${fmt(densityLb(v.density, u.density))} lb/ft³ = ${fmt(lb)} lb.`,
      ]
    );
  },
};


const gravelWeight: Model = {
  fields: [
    { ...number('mode','Calculate from',0,0), max:2, integer:true, options:[
      {value:0,label:'Length × width × depth'},
      {value:1,label:'Known area × depth'},
      {value:2,label:'Known volume'}
    ]},
    { ...length('length','Area length',20), visibleWhen:{field:'mode',equals:0} },
    { ...length('width','Area width',10), visibleWhen:{field:'mode',equals:0} },
    { ...area('area','Known surface area',200), visibleWhen:{field:'mode',equals:1} },
    { ...length('depth','Gravel depth',4,'in'), visibleWhen:{field:'mode',in:[0,1]} },
    { ...volume('volume','Known gravel volume',1), visibleWhen:{field:'mode',equals:2} },
    { ...number('density','Bulk density',1.4,0.01,'Enter the supplier or product bulk density for the same material state you are measuring.'), unit:'ton/yd3', group:'Material & assumptions' }
  ],
  formula:'Volume comes from length × width × depth, area × depth, or entered volume. US tons = cubic yards × entered bulk density; pounds = tons × 2,000.',
  assumptions:[
    'Bulk density varies with material type, grading, moisture and compaction, so it is an editable input rather than a universal gravel constant.',
    'The dimensions and density must refer to the same loose or compacted state.',
    'This calculator converts measured volume to estimated weight; it does not add a purchasing allowance.'
  ],
  sources:[],
  calculate(v){
    const mode=Math.round(v.mode);
    const ft3=mode===0 ? v.length*v.width*v.depth : mode===1 ? v.area*v.depth : v.volume;
    requireCondition(ft3>=0,'volume','Gravel volume cannot be negative.');
    const yd3=ft3/27;
    const tons=yd3*v.density;
    const lb=tons*2000;
    const kg=lb/LB_PER_KG;
    return result([
      row('tons','Estimated gravel weight',tons,'US tons'),
      row('weight','Estimated gravel weight',lb,'lb'),
      row('tonnes','Estimated gravel weight',kg/1000,'tonnes'),
      row('kg','Estimated gravel weight',kg,'kg'),
      row('volume','Gravel volume',yd3,'yd³')
    ],[
      mode===0 ? fmt(v.length)+' × '+fmt(v.width)+' × '+fmt(v.depth)+' = '+fmt(ft3)+' ft³.' :
      mode===1 ? fmt(v.area)+' ft² × '+fmt(v.depth)+' ft = '+fmt(ft3)+' ft³.' :
      'Entered volume = '+fmt(ft3)+' ft³.',
      fmt(ft3)+' ÷ 27 = '+fmt(yd3)+' yd³.',
      fmt(yd3)+' yd³ × '+fmt(v.density)+' ton/yd³ = '+fmt(tons)+' US tons.'
    ]);
  }
};


const parkingLotCost: Model = {
  fields: [
    ...rectangle,
    length('depth','Compacted asphalt thickness',3,'in'),
    { ...number('density','Compacted asphalt density',145,1,'Use the supplier or mix-design density when available.'), unit:'lb/ft3', group:'Material & assumptions' },
    allowance,
    { ...price('USD/ton',['USD/ton','USD/yd3']), optional:false },
    number('delivery','Delivery / trucking (USD)',0,0),
    number('labor','Fixed paving labor / equipment (USD)',0,0),
    number('tax','Material sales tax (%)',0,0)
  ],
  formula:'Net volume = length × width × thickness; order volume = net volume × allowance factor; tons = order volume × density / 2,000; material subtotal uses the selected quoted price basis; total = material subtotal + tax + delivery + labor.',
  assumptions:[
    'Rectangular paved area with one uniform compacted asphalt thickness. Separate areas with different lifts or thicknesses should be calculated separately.',
    'Use compacted mix density and a quoted material price that matches the selected per-ton or per-cubic-yard basis.',
    'This is a configurable cost estimate. Base preparation, milling, striping, drainage, permits and other scope items are excluded unless you include them in the fixed labor/equipment amount.'
  ],
  sources:[],
  calculate(v,u){
    const netFt3=v.length*v.width*v.depth;
    const orderFt3=netFt3*waste(v);
    const orderYd3=orderFt3/27;
    const tons=orderFt3*v.density/2000;
    const materialBasis=u.price==='USD/yd3' ? orderYd3 : tons;
    const materials=materialBasis*v.price;
    const taxAmount=materials*v.tax/100;
    const total=materials+taxAmount+v.delivery+v.labor;
    return result([
      row('total','Estimated parking-lot material + entered fixed costs',total,'USD'),
      row('tons','Asphalt to order',tons,'US tons'),
      row('order','Asphalt volume with allowance',orderYd3,'yd³'),
      row('materials','Asphalt material subtotal',materials,'USD'),
      row('tax','Material tax',taxAmount,'USD'),
      row('fixed','Delivery + labor / equipment',v.delivery+v.labor,'USD')
    ],[
      fmt(v.length)+' × '+fmt(v.width)+' × '+fmt(v.depth)+' = '+fmt(netFt3)+' ft³ compacted volume.',
      fmt(orderFt3)+' ft³ × '+fmt(v.density)+' lb/ft³ ÷ 2,000 = '+fmt(tons)+' US tons with allowance.',
      'Material subtotal '+fmt(materials)+' + tax '+fmt(taxAmount)+' + fixed costs '+fmt(v.delivery+v.labor)+' = '+fmt(total)+' USD.'
    ]);
  }
};

const weight: Model = {
  ...bulk,
  fields: [volume(), densityField, allowance, price('USD/ton', ['USD/ton', 'USD/yd3'])],
  formula: 'Mass = volume × density; US tons = pounds / 2,000; kilograms = pounds × 0.45359237.',
  calculate(v, u) {
    const cuFt = v.volume;
    const order = cuFt * waste(v);
    const lb = order * densityLb(v.density, u.density);
    return result(
      withCost(
        [row('weight', 'Estimated weight', lb, 'lb'), row('tons', 'US short tons', lb / 2000, 'US tons'), row('tonnes', 'Metric tonnes', lb / LB_PER_KG / 1000, 'tonnes'), row('order', 'Volume including allowance', order / 27, 'yd³')],
        v.price, u.price, { 'USD/ton': lb / 2000, 'USD/yd3': order / 27 }
      ),
      [
        `${fmt(cuFt)} ft³ × ${fmt(waste(v))} = ${fmt(order)} ft³.`,
        `${fmt(order)} × ${fmt(densityLb(v.density, u.density))} lb/ft³ = ${fmt(lb)} lb.`,
      ]
    );
  },
};

const depth: Model = {
  fields: [...rectangle, volume()],
  formula: 'Average depth = volume / (length × width).',
  assumptions: [
    'This calculates coverage depth from an available volume. It does not choose a structurally adequate slab or pavement thickness.',
    'Volume and area must refer to the same placed or compacted condition.',
  ],
  sources: [geometry],
  calculate(v) {
    const area = v.length * v.width;
    const depth = v.volume / area;
    return result(
      [row('depth', 'Average depth (in)', depth * 12, 'in'), row('mm', 'Average depth (mm)', depth / FT_PER_M * 1000, 'mm'), row('area', 'Covered area', area, 'ft²')],
      [`${fmt(v.volume)} ft³ ÷ ${fmt(area)} ft² = ${fmt(depth)} ft.`, `Convert feet to inches: ${fmt(depth)} × 12 = ${fmt(depth * 12)} in.`]
    );
  },
};

const masonry: Model = {
  fields: [length('length', 'Wall length', 20), length('width', 'Wall height', 8), openings, length('unitLength', 'Actual unit length', 7.625, 'in'), length('unitHeight', 'Actual unit height', 2.25, 'in'), positiveOrZero(length('joint', 'Mortar joint', 0.375, 'in')), allowance, number('unitWeight', 'Unit weight (lb)', 4.3), price('USD/unit')],
  formula: 'Net wall area = length × height − openings; units = ceil(net area × allowance factor / ((unit length + joint) × (unit height + joint))).',
  assumptions: [
    'Use the exposed face dimensions, not the unit depth. Defaults describe one wythe of modular brick.',
    'A nominal 16 × 8 in CMU face includes its joints: enter actual dimensions 15⅝ × 7⅝ in with a ⅜ in joint.',
    'This is an area estimate. Corners, returns, lintels, bond patterns, caps and special units require a separate takeoff.',
  ],
  sources: [cmha],
  calculate(v, u) {
    const area = netArea(v);
    const face = (v.unitLength + v.joint) * (v.unitHeight + v.joint);
    const raw = area / face;
    const n = roundUp(raw * waste(v));
    return result(
      withCost(
        [row('units', 'Units to order', n, 'units', true), row('area', 'Net wall area', area, 'ft²'), row('base', 'Units without allowance', roundUp(raw), 'units', true), row('perArea', 'Units per square foot', 1 / face, 'units/ft²'), row('weight', 'Unmortared unit weight', n * v.unitWeight, 'lb')],
        v.price, u.price, { 'USD/unit': n }
      ),
      [
        `Net area: ${fmt(v.length * v.width)} − ${fmt(v.openings)} = ${fmt(area)} ft².`,
        `Installed module: ${fmt((v.unitLength + v.joint) * 12)} × ${fmt((v.unitHeight + v.joint) * 12)} in.`,
        `Round ${fmt(raw)} × ${fmt(waste(v))} up once = ${n} units.`,
      ]
    );
  },
};

const masonryCost: Model = {
  fields: [
    ...masonry.fields.filter((field) => field.id !== 'price'),
    { ...price('USD/unit'), optional: false },
    number('delivery', 'Delivery charge (USD)', 0, 0),
    number('labor', 'Labor / equipment allowance (USD)', 0, 0),
    number('tax', 'Material tax (%)', 0, 0),
  ],
  formula: 'Net wall area = length × height − openings; units = ceil(net area × allowance factor / installed module face); total = units × unit price + material tax + delivery + labor/equipment.',
  assumptions: [
    ...masonry.assumptions,
    'This estimates unit-material cost plus the tax, delivery and labor/equipment amounts you enter. Mortar, grout, reinforcement, foundations, finishes and permits are separate unless you price them separately.'
  ],
  sources: masonry.sources,
  calculate(v, u) {
    const wallArea = netArea(v);
    const face = (v.unitLength + v.joint) * (v.unitHeight + v.joint);
    const raw = wallArea / face;
    const units = roundUp(raw * waste(v));
    const materials = units * v.price;
    const taxAmount = materials * v.tax / 100;
    const total = materials + taxAmount + v.delivery + v.labor;
    return result([
      row('total','Estimated entered-scope total',total,'USD',true),
      row('units','Units to order',units,'units',true),
      row('area','Net wall area',wallArea,'ft²'),
      row('materials','Unit material subtotal',materials,'USD'),
      row('tax','Material tax',taxAmount,'USD'),
      row('delivery','Delivery charge',v.delivery,'USD'),
      row('labor','Labor / equipment allowance',v.labor,'USD'),
      row('weight','Unmortared unit weight',units*v.unitWeight,'lb'),
    ],[
      `Net wall area: ${fmt(v.length*v.width)} − ${fmt(v.openings)} = ${fmt(wallArea)} ft².`,
      `Installed module face = ${fmt((v.unitLength+v.joint)*12)} × ${fmt((v.unitHeight+v.joint)*12)} in; round ${fmt(raw)} × ${fmt(waste(v))} up = ${units} units.`,
      `${units} units × ${fmt(v.price)} = ${fmt(materials)}; add tax, delivery and labor/equipment.`
    ]);
  }
};

const bags: Model = {
  fields: [volume(), yieldField, allowance, price('USD/bag')],
  formula: 'Bags = ceil(required mixed volume × allowance factor / mixed yield per bag).',
  assumptions: [
    'Use mixed yield from the product data sheet; bags of equal mass can have different yields.',
    'This estimates a known volume. It does not select a mortar type or grout specification.',
  ],
  sources: [quikrete],
  calculate(v, u) {
    const order = v.volume * waste(v);
    const n = roundUp(order / v.yield);
    return result(
      withCost(
        [row('bags', 'Whole bags to order', n, 'bags', true), row('order', 'Mixed volume including allowance', order, 'ft³'), row('m3', 'Mixed volume', order / FT_PER_M ** 3, 'm³')],
        v.price, u.price, { 'USD/bag': n }
      ),
      [
        `${fmt(v.volume)} × ${fmt(waste(v))} = ${fmt(order)} ft³.`,
        `Round ${fmt(order)} ÷ ${fmt(v.yield)} up = ${n} bags.`,
      ]
    );
  },
};

const foundationCost: Model = {
  fields: [
    { id: 'foundationType', label: 'Foundation concrete shape', value: 0, unit: '', integer: true, min: 0, max: 2,
      options: [
        { value: 0, label: 'Slab / pad' },
        { value: 1, label: 'Concrete piers' },
        { value: 2, label: 'Continuous strip footing' },
      ] },
    { ...length('length', 'Slab length / footing run', 20, 'ft'), visibleWhen: { field: 'foundationType', in: [0, 2] } },
    { ...length('width', 'Slab width', 20, 'ft'), visibleWhen: { field: 'foundationType', equals: 0 } },
    { ...length('thickness', 'Slab thickness', 4, 'in'), visibleWhen: { field: 'foundationType', equals: 0 } },
    { ...count('pierCount', 'Number of piers', 6, 1), visibleWhen: { field: 'foundationType', equals: 1 } },
    { ...length('pierDiameter', 'Pier diameter', 12, 'in'), visibleWhen: { field: 'foundationType', equals: 1 } },
    { ...length('pierDepth', 'Pier depth', 36, 'in'), visibleWhen: { field: 'foundationType', equals: 1 } },
    { ...length('footingWidth', 'Footing width', 16, 'in'), visibleWhen: { field: 'foundationType', equals: 2 } },
    { ...length('footingDepth', 'Footing depth', 8, 'in'), visibleWhen: { field: 'foundationType', equals: 2 } },
    count('quantity', 'Identical sections', 1),
    allowance,
    number('priceYd3', 'Concrete quote (USD / yd³)', 0, 0),
    number('delivery', 'Delivery / short-load fees (USD)', 0, 0),
    number('labor', 'Labor / equipment allowance (USD)', 0, 0),
    number('tax', 'Material tax (%)', 0, 0),
  ],
  formula: 'Concrete volume depends on the selected slab, pier or strip-footing geometry. Order yards = net volume × allowance factor / 27. Total = order yards × quoted $/yd³ + material tax + delivery + labor/equipment.',
  assumptions: [
    'This is a concrete-material and entered-cost estimator, not a complete foundation bid. Excavation, forms, reinforcement, waterproofing, drainage, engineering, permits and other scope are excluded unless you include them in the entered labor/equipment allowance.',
    'Foundation type and dimensions must come from the project requirements. This calculator does not design footing width, slab thickness, pier size, frost depth or bearing capacity.',
    'Concrete quote is entered per cubic yard; delivery and short-load charges vary by supplier and order size.'
  ],
  sources: [geometry],
  calculate(v) {
    const type = Math.round(v.foundationType);
    let netFt3: number;
    let geometryStep: string;
    if (type === 1) {
      const radiusFt = v.pierDiameter / 2;
      netFt3 = Math.PI * radiusFt * radiusFt * v.pierDepth * v.pierCount * v.quantity;
      geometryStep = `Piers: π × ${fmt(radiusFt)}² × ${fmt(v.pierDepth)} × ${v.pierCount} × ${v.quantity} = ${fmt(netFt3)} ft³.`;
    } else if (type === 2) {
      netFt3 = v.length * v.footingWidth * v.footingDepth * v.quantity;
      geometryStep = `Strip footing: ${fmt(v.length)} × ${fmt(v.footingWidth)} × ${fmt(v.footingDepth)} × ${v.quantity} = ${fmt(netFt3)} ft³.`;
    } else {
      netFt3 = v.length * v.width * v.thickness * v.quantity;
      geometryStep = `Slab: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.thickness)} × ${v.quantity} = ${fmt(netFt3)} ft³.`;
    }
    const orderFt3 = netFt3 * waste(v);
    const yards = orderFt3 / 27;
    const materials = yards * v.priceYd3;
    const taxAmount = materials * v.tax / 100;
    const total = materials + taxAmount + v.delivery + v.labor;
    return result([
      row('total','Estimated entered-scope total',total,'USD',true),
      row('yards','Concrete to order',yards,'yd³'),
      row('net','Net concrete volume',netFt3/27,'yd³'),
      row('materials','Concrete material subtotal',materials,'USD'),
      row('tax','Material tax',taxAmount,'USD'),
      row('delivery','Delivery / short-load fees',v.delivery,'USD'),
      row('labor','Labor / equipment allowance',v.labor,'USD'),
    ],[
      geometryStep,
      `${fmt(netFt3/27)} yd³ × ${fmt(waste(v))} allowance factor = ${fmt(yards)} yd³ to order.`,
      `${fmt(yards)} yd³ × ${fmt(v.priceYd3)}/yd³ = ${fmt(materials)} material subtotal; add tax, delivery and labor/equipment.`
    ]);
  }
};

// 6. Shed Foundation
const shedFoundationFields: Field[] = [
  { id: 'foundationType', label: 'Foundation type / pier takeoff mode', value: 0, unit: '', integer: true, min: 0, max: 3,
    options: [
      { value: 0, label: 'Concrete slab' },
      { value: 1, label: 'Concrete pier & beam — enter pier count' },
      { value: 2, label: 'Concrete footing (strip)' },
      { value: 3, label: 'Concrete pier & beam — calculate count from spacing' },
    ] },
  { ...length('length', 'Slab length / footing run', 10, 'ft'), visibleWhen: { field: 'foundationType', in: [0, 2] } },
  { ...length('width', 'Slab width', 10, 'ft'), visibleWhen: { field: 'foundationType', equals: 0 } },
  { ...length('thickness', 'Slab thickness', 4, 'in'), visibleWhen: { field: 'foundationType', equals: 0 } },
  { ...count('pierCount', 'Number of piers', 4, 1), visibleWhen: { field: 'foundationType', equals: 1 } },
  { ...length('pierPlanLength', 'Pier layout length', 10, 'ft'), visibleWhen: { field: 'foundationType', equals: 3 },
    help: 'Overall center-to-center layout length covered by the pier grid.' },
  { ...length('pierPlanWidth', 'Pier layout width', 10, 'ft'), visibleWhen: { field: 'foundationType', equals: 3 },
    help: 'Overall center-to-center layout width covered by the pier grid.' },
  { ...length('pierSpacing', 'Maximum pier spacing from plan', 6, 'ft'), visibleWhen: { field: 'foundationType', equals: 3 },
    help: 'Enter the maximum on-center spacing specified by your project plan or designer. The calculator does not choose a structural spacing.' },
  { ...length('pierDiameter', 'Pier diameter', 12, 'in'), visibleWhen: { field: 'foundationType', in: [1, 3] } },
  { ...length('pierDepth', 'Pier embedment depth', 24, 'in'), visibleWhen: { field: 'foundationType', in: [1, 3] } },
  { ...length('footingWidth', 'Footing width', 12, 'in'), visibleWhen: { field: 'foundationType', equals: 2 } },
  { ...length('footingDepth', 'Footing depth', 12, 'in'), visibleWhen: { field: 'foundationType', equals: 2 } },
  count('quantity', 'Identical foundation sections', 1),
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag', 'USD/ton']),
  number('delivery', 'Delivery fee ($)', 0, 0),
  number('labor', 'Labor charge ($)', 0, 0),
  number('tax', 'Sales tax on material (%)', 0, 0),
];

const shedFoundation: Model = {
  fields: shedFoundationFields,
  formula: 'Slab: V = L × W × T × qty. Pier: V = π × (D/2)² × depth × pier count × qty. Spacing takeoff: piers per axis = ceil(layout dimension / entered maximum spacing) + 1. Footing: V = run × width × depth × qty. Units are normalized before the formulas run.',
  assumptions: [
    'This is a material quantity and layout takeoff for simple foundation shapes. It does not design structural members, frost depth, bearing capacity or load capacity.',
    'Slab: rectangular flat pad. Include isolation board thickness if required.',
    'Pier: cylindrical concrete piers. In spacing mode, the entered maximum spacing must come from the project plan or qualified designer; the calculator only converts it into an equalized grid count.',
    'Spacing mode includes a pier at both ends of each layout axis, rounds interval count up, and equalizes spacing so the actual spacing does not exceed the entered maximum.',
    'Footing: continuous strip. Verify width and depth from project plans.',
    'Slab thickness, pier diameter, embedment and spacing are design inputs. Enter dimensions from the project requirements rather than treating initial form values as recommendations.',
    'Confirm all dimensions with your local building requirements and a qualified designer.',
  ],
  sources: [quikrete, geometry],
  calculate(v, u) {
    const fType = Math.round(v.foundationType);
    let cuFt: number;
    let steps: string[];

    let layoutRows: { key: string; label: string; value: number; unit: string; discrete?: boolean }[] = [];

    if (fType === 0) {
      cuFt = v.length * v.width * v.thickness * v.quantity;
      steps = [
        `Slab: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.thickness)} × ${v.quantity} = ${fmt(cuFt)} ft³.`,
      ];
    } else if (fType === 2) {
      cuFt = v.length * v.footingWidth * v.footingDepth * v.quantity;
      steps = [
        `Footing: ${fmt(v.length)} ft × ${fmt(v.footingWidth)} ft × ${fmt(v.footingDepth)} ft × ${v.quantity} = ${fmt(cuFt)} ft³.`,
      ];
    } else {
      const radiusFt = v.pierDiameter / 2;
      let piersPerSection = v.pierCount;
      if (fType === 3) {
        requireCondition(v.pierSpacing > 0, 'pierSpacing', 'Maximum pier spacing must be greater than zero.');
        const countAlongLength = roundUp(v.pierPlanLength / v.pierSpacing) + 1;
        const countAlongWidth = roundUp(v.pierPlanWidth / v.pierSpacing) + 1;
        piersPerSection = countAlongLength * countAlongWidth;
        const actualLengthSpacing = v.pierPlanLength / (countAlongLength - 1);
        const actualWidthSpacing = v.pierPlanWidth / (countAlongWidth - 1);
        layoutRows = [
          row('pierCount', 'Piers per foundation section', piersPerSection, 'piers', true),
          row('pierCountLength', 'Pier lines along layout length', countAlongLength, 'lines', true),
          row('pierCountWidth', 'Pier lines along layout width', countAlongWidth, 'lines', true),
          row('pierSpacingLength', 'Equalized spacing along length', actualLengthSpacing * 12, 'in'),
          row('pierSpacingWidth', 'Equalized spacing along width', actualWidthSpacing * 12, 'in'),
        ];
        steps = [
          `Pier grid: ceil(${fmt(v.pierPlanLength)} ÷ ${fmt(v.pierSpacing)}) + 1 = ${countAlongLength} lines along length; ceil(${fmt(v.pierPlanWidth)} ÷ ${fmt(v.pierSpacing)}) + 1 = ${countAlongWidth} lines along width.`,
          `Piers per foundation section: ${countAlongLength} × ${countAlongWidth} = ${piersPerSection}; equalized spacing ≈ ${fmt(actualLengthSpacing)} ft × ${fmt(actualWidthSpacing)} ft.`,
        ];
      } else {
        steps = [];
      }
      const pierCuFt = Math.PI * radiusFt ** 2 * v.pierDepth * piersPerSection * v.quantity;
      cuFt = pierCuFt;
      steps.push(
        `Pier radius: ${fmt(v.pierDiameter)} ft ÷ 2 = ${fmt(radiusFt)} ft.`,
        `Pier volume: π × ${fmt(radiusFt)}² × ${fmt(v.pierDepth)} ft × ${piersPerSection} piers/section × ${v.quantity} section(s) = ${fmt(cuFt)} ft³.`,
      );
    }

    const total = cuFt * waste(v);
    const bags = roundUp(total / v.yield);
    const lb = total * densityLb(v.density, u.density);
    const rows: { key: string; label: string; value: number; unit: string; discrete?: boolean }[] = [
      row('order', 'Concrete to order', total / 27, 'yd³'),
      row('ft3', 'Order volume (ft³)', total, 'ft³'),
      row('m3', 'Order volume (m³)', total / FT_PER_M ** 3, 'm³'),
      row('bags', `Bags (entered yield ${fmt(v.yield)} ft³)`, bags, 'bags', true),
      row('weight', 'Estimated order weight (lb)', lb, 'lb'),
      row('tons', 'Estimated order weight (US tons)', lb / 2000, 'US tons'),
      ...layoutRows,
    ];

    if (Number.isFinite(v.price)) {
      const priceQuantities: Record<string, number> = {
        'USD/yd3': total / 27,
        'USD/m3': total / FT_PER_M ** 3,
        'USD/ft3': total,
        'USD/bag': bags,
        'USD/ton': lb / 2000,
      };
      const priceQty = priceQuantities[u.price] ?? total / 27;
      const materials = priceQty * v.price;
      const taxAmt = materials * (v.tax / 100);
      const totalCost = materials + taxAmt + v.delivery + v.labor;
      steps.push(`Material price basis: ${fmt(priceQty)} ${u.price || 'USD/yd3'} × ${fmt(v.price)} = ${fmt(materials)}.`);
      rows.push(
        row('materials', 'Material subtotal', materials, 'USD'),
        row('tax', 'Material tax', taxAmt, 'USD'),
        row('delivery', 'Delivery fee', v.delivery, 'USD'),
        row('labor', 'Labor charge', v.labor, 'USD'),
        row('total', 'Estimated total', totalCost, 'USD'),
      );
    }

    return result(rows, steps);
  },
};


const mortarMix: Model = {
  fields: [
    volume('volume','Total dry batch volume',1),
    number('cementParts','Portland cement parts',1,0),
    number('limeParts','Hydrated lime parts',1,0),
    number('sandParts','Sand parts',6,0),
  ],
  formula:'Component volume = total dry batch volume × component parts / total parts. The calculator normalizes the user-entered cement : lime : sand ratio; it does not select a mortar type.',
  assumptions:[
    'Parts are relative dry-volume proportions supplied by the user. Use the proportions required by the project specification or mortar standard.',
    'This is a proportioning calculator, not a mixed-yield predictor. Bulking, moisture, mixing loss and final mortar yield are not inferred from dry component volumes.',
    'The calculator does not choose Type M, S, N or O and does not establish compressive strength or suitability for a masonry assembly.'
  ],
  sources:['https://www.cement.org/learn/materials-applications/masonry/masonry-mortars'],
  calculate(v){
    const parts=v.cementParts+v.limeParts+v.sandParts;
    requireCondition(parts>0,'cementParts','Enter at least one non-zero mix component.');
    const cement=v.volume*v.cementParts/parts;
    const lime=v.volume*v.limeParts/parts;
    const sand=v.volume*v.sandParts/parts;
    return result([
      row('cement','Cement volume',cement,'ft³'),
      row('lime','Hydrated lime volume',lime,'ft³'),
      row('sand','Sand volume',sand,'ft³'),
      row('total','Total dry batch volume',v.volume,'ft³'),
      row('parts','Total ratio parts',parts,'parts')
    ],[
      'Ratio parts: '+fmt(v.cementParts)+' + '+fmt(v.limeParts)+' + '+fmt(v.sandParts)+' = '+fmt(parts)+'.',
      'Cement: '+fmt(v.volume)+' × '+fmt(v.cementParts)+' / '+fmt(parts)+' = '+fmt(cement)+' ft³.',
      'Lime: '+fmt(v.volume)+' × '+fmt(v.limeParts)+' / '+fmt(parts)+' = '+fmt(lime)+' ft³.',
      'Sand: '+fmt(v.volume)+' × '+fmt(v.sandParts)+' / '+fmt(parts)+' = '+fmt(sand)+' ft³.'
    ]);
  }
};


const mortarQuantity: Model = {
  fields: [
    length('length','Wall length',20),
    length('height','Wall height',8),
    openings,
    length('unitLength','Actual masonry unit length',7.625,'in'),
    length('unitHeight','Actual masonry unit height',2.25,'in'),
    length('joint','Mortar joint width',0.375,'in'),
    length('bedDepth','Mortar bed depth / wall wythe',3.625,'in'),
    { ...volume('yield','Mixed mortar yield per bag',0.6), unit:'ft3', help:'Use the mixed yield printed on the exact mortar product being purchased.' },
    allowance,
    price('USD/bag')
  ],
  formula:'Mortar fraction = 1 − actual unit face area / installed module face area; net mortar volume ≈ net wall area × bed depth × mortar fraction; bags = ceil(volume × allowance factor / mixed yield per bag).',
  assumptions:[
    'Geometric full-bed estimate for one rectangular masonry wythe with uniform horizontal and vertical joints.',
    'The model approximates mortar volume from face-joint fraction through the entered bed depth. Hollow CMU face-shell bedding and specialty unit shapes require a different takeoff.',
    'Openings are subtracted once. Product yield and installation loss vary, so use the exact bag yield and a project-specific allowance.'
  ],
  sources:['https://www.cement.org/learn/materials-applications/masonry/masonry-mortars'],
  calculate(v,u){
    const net=v.length*v.height-v.openings;
    requireCondition(net>=0,'openings','Openings cannot exceed the measured wall area.');
    const installedFace=(v.unitLength+v.joint)*(v.unitHeight+v.joint);
    requireCondition(installedFace>0,'joint','Unit and joint dimensions must produce a positive installed module.');
    const fraction=1-(v.unitLength*v.unitHeight/installedFace);
    requireCondition(fraction>=0 && fraction<1,'joint','Check the unit and joint dimensions.');
    const mortar=net*v.bedDepth*fraction;
    const order=mortar*waste(v);
    const bags=roundUp(order/v.yield);
    return result(withCost([
      row('bags','Mortar bags to order',bags,'bags',true),
      row('mortar','Net mortar volume',mortar,'ft³'),
      row('order','Mortar volume with allowance',order,'ft³'),
      row('area','Net wall area',net,'ft²'),
      row('fraction','Estimated mortar face fraction',fraction*100,'%')
    ],v.price,u.price,{'USD/bag':bags}),[
      fmt(v.length)+' × '+fmt(v.height)+' − '+fmt(v.openings)+' = '+fmt(net)+' ft² net wall area.',
      'Mortar face fraction = 1 − unit face / installed module face = '+fmt(fraction*100)+'%.',
      fmt(net)+' × '+fmt(v.bedDepth*12)+' in ÷ 12 × '+fmt(fraction)+' = '+fmt(mortar)+' ft³ net mortar.',
      'Round '+fmt(order)+' ÷ '+fmt(v.yield)+' ft³ per bag up = '+bags+' bags.'
    ]);
  }
};


const crushedStone: Model = {
  fields: [
    { ...number('mode','Calculate from',0,0), max:2, integer:true, options:[
      {value:0,label:'Length × width × depth'},
      {value:1,label:'Known area × depth'},
      {value:2,label:'Known volume'}
    ]},
    { ...length('length','Area length',20), visibleWhen:{field:'mode',equals:0} },
    { ...length('width','Area width',10), visibleWhen:{field:'mode',equals:0} },
    { ...area('area','Known surface area',200), visibleWhen:{field:'mode',equals:1} },
    { ...length('depth','Stone depth',4,'in'), visibleWhen:{field:'mode',in:[0,1]} },
    { ...volume('volume','Known stone volume',1), visibleWhen:{field:'mode',equals:2} },
    { ...number('density','Bulk density',1.5,0.01,'Use the supplier or material data for the same loose/compacted state you are estimating.'), unit:'ton/yd3', group:'Material & assumptions' },
    allowance,
    price('USD/ton',['USD/ton','USD/yd3'])
  ],
  formula:'Net volume comes from length × width × depth, area × depth, or entered volume. Order volume = net volume × allowance factor; US tons = order cubic yards × entered bulk density.',
  assumptions:[
    'Density is user-entered because crushed stone, crusher run and crushed concrete can have different bulk densities depending on grading, moisture and compaction.',
    'Use dimensions, area and depth that describe the same placed state as the density. Do not add a separate compaction factor if your entered density and dimensions already represent the compacted layer.',
    'Material allowance increases the measured quantity once. Supplier truckload minimums and delivery fees are not included in the optional material cost.'
  ],
  sources:[],
  calculate(v,u){
    const mode=Math.round(v.mode);
    let netFt3:number;
    if(mode===0) netFt3=v.length*v.width*v.depth;
    else if(mode===1) netFt3=v.area*v.depth;
    else netFt3=v.volume;
    requireCondition(netFt3>=0,'volume','Stone volume cannot be negative.');
    const netYd3=netFt3/27;
    const orderYd3=netYd3*waste(v);
    const tons=orderYd3*v.density;
    const pounds=tons*2000;
    const m3=orderYd3*27/(FT_PER_M**3);
    return result(withCost([
      row('order','Crushed stone to order',orderYd3,'yd³'),
      row('tons','Estimated order weight',tons,'US tons'),
      row('pounds','Estimated order weight',pounds,'lb'),
      row('net','Measured volume before allowance',netYd3,'yd³'),
      row('m3','Order volume',m3,'m³')
    ],v.price,u.price,{'USD/ton':tons,'USD/yd3':orderYd3}),[
      mode===0
        ? fmt(v.length)+' × '+fmt(v.width)+' × '+fmt(v.depth)+' = '+fmt(netFt3)+' ft³.'
        : mode===1
          ? fmt(v.area)+' ft² × '+fmt(v.depth)+' ft = '+fmt(netFt3)+' ft³.'
          : 'Entered volume = '+fmt(netFt3)+' ft³.',
      fmt(netFt3)+' ÷ 27 = '+fmt(netYd3)+' yd³ before allowance.',
      fmt(orderYd3)+' yd³ × '+fmt(v.density)+' ton/yd³ = '+fmt(tons)+' US tons.'
    ]);
  }
};

export const materialModels: Record<string, Model> = {
  // --- 16 Concrete calculators ---
  'concrete': concreteGeneric,
  'concrete-volume': concreteVolume,
  'concrete-weight': concreteWeight,
  'concrete-cost': concreteCost,
  'concrete-mix': concreteMix,
  'mortar-mix': mortarMix,
  'mortar-quantity': mortarQuantity,
  'concrete-pour': concretePour,
  'concrete-slab': concreteSlab,
  'concrete-footing': concreteFooting,
  'concrete-foundation': concreteFoundation,
  'concrete-wall': concreteWall,
  'concrete-column': concreteColumn,
  'concrete-curb': concreteCurb,
  'concrete-stair': concreteStair,
  'concrete-ramp': concreteRamp,
  'concrete-tube': concreteTube,
  'concrete-waste': concreteWaste,

  // --- Slab, Patio, Driveway, Shed ---
  'foundation-cost': foundationCost,
  'shed-foundation': shedFoundation,

  // --- Non-concrete (unchanged) ---
  bulk,
  crushedStone,
  gravelWeight,
  parkingLotCost,
  weight,
  depth,
  masonry,
  'masonry-cost': masonryCost,
  bags,
  'asphalt-depth': {
    ...depth,
    fields: [
      ...rectangle,
      { id: 'mass', label: 'Asphalt mass', value: 10, unit: 'ton', units: ['ton', 'tonne', 'lb', 'kg'], dimension: 'weight' },
      densityField,
    ],
    formula: 'Compacted thickness = mass / (compacted density × area).',
    calculate(v, u) {
      return depth.calculate({ ...v, volume: v.mass / densityLb(v.density, u.density) }, u);
    },
  },
  'brick-mortar': {
    fields: [
      ...masonry.fields.filter(f => !['price', 'unitWeight'].includes(f.id)),
      length('wythe', 'Mortar bedding depth', 3.625, 'in'),
      yieldField,
      price('USD/bag'),
    ],
    formula: 'Mortar volume ≈ net wall area × bedding depth × (1 − actual brick face / installed module face).',
    assumptions: [
      'Geometric estimate for full-bed, single-wythe brickwork, including bed and head joints.',
      'Do not apply solid brick bedding geometry to hollow CMU face-shell bedding.',
    ],
    sources: [cmha, quikrete],
    calculate(v, u) {
      const a = netArea(v);
      const fraction = 1 - v.unitLength * v.unitHeight / ((v.unitLength + v.joint) * (v.unitHeight + v.joint));
      const cuFt = a * v.wythe * fraction;
      return bags.calculate({ ...v, volume: cuFt }, u);
    },
  },
  'cmu-mortar': {
    fields: [
      number('units', 'Number of installed blocks', 113, 0),
      number('coverage', 'Installed blocks per bag', 13, undefined,
        'Use the mortar manufacturer\'s yield for the block size and bedding method.'),
      allowance,
      price('USD/bag'),
    ],
    formula: 'Mortar bags = ceil(installed blocks × allowance factor / blocks per bag).',
    assumptions: [
      'Coverage must refer to a complete premixed mortar bag.',
      'Full-bed and face-shell bedding have different mortar requirements.',
    ],
    sources: [cmha, quikrete],
    calculate(v, u) {
      const n = roundUp(v.units * waste(v) / v.coverage);
      return result(
        withCost([row('bags', 'Mortar bags', n, 'bags', true)], v.price, u.price, { 'USD/bag': n }),
        [`Round ${v.units} × ${fmt(waste(v))} ÷ ${v.coverage} up = ${n} bags.`]
      );
    },
  },
  'cmu-grout': {
    fields: [
      count('units', 'Blocks receiving grout', 100, 0),
      { ...volume('cellVolume', 'Grouted void volume per block', 0.25), unit: 'ft3',
        help: 'Use the block manufacturer\'s core volume for the cells actually filled.' },
      allowance,
      price('USD/yd3'),
    ],
    formula: 'Grout volume = grouted blocks × grouted void volume per block × allowance factor.',
    assumptions: [
      'Count only cells to be filled.',
      'Grout is the core fill; mortar is the joint material.',
    ],
    sources: [cmha],
    calculate(v, u) {
      const cuFt = v.units * v.cellVolume * waste(v);
      return result(
        withCost(
          [row('order', 'Grout to order', cuFt / 27, 'yd³'), row('ft3', 'Grout volume', cuFt, 'ft³'), row('m3', 'Grout volume', cuFt / FT_PER_M ** 3, 'm³')],
          v.price, u.price, { 'USD/yd3': cuFt / 27 }
        ),
        [`${v.units} × ${fmt(v.cellVolume)} × ${fmt(waste(v))} = ${fmt(cuFt)} ft³.`]
      );
    },
  },
  'brick-joint': {
    fields: [
      length('length', 'Finished course length', 10),
      length('unitLength', 'Actual brick length', 7.625, 'in'),
      count('units', 'Bricks in the course', 15, 2),
    ],
    formula: 'Joint width = (course length − brick count × actual brick length) / (brick count − 1).',
    assumptions: [
      'One straight course with joints only between bricks.',
      'A geometric fit is not a recommendation to exceed the specified joint tolerance.',
    ],
    sources: [cmha],
    calculate(v) {
      const joint = (v.length - v.units * v.unitLength) / (v.units - 1);
      requireCondition(joint >= 0, 'units', 'The bricks are longer than this course even without joints.');
      return result(
        [
          row('joint', 'Equal joint width', joint * 12, 'in'),
          row('mm', 'Equal joint width', joint / FT_PER_M * 1000, 'mm'),
        ],
        [`(${fmt(v.length * 12)} − ${v.units} × ${fmt(v.unitLength * 12)}) ÷ ${v.units - 1} = ${fmt(joint * 12)} in.`]
      );
    },
  },
  'material-cost': {
    fields: [
      number('quantity', 'Material quantity', 100, 0),
      { ...price('USD/unit'), optional: false },
      number('delivery', 'Delivery charge ($)', 0, 0),
      number('labor', 'Labor charge ($)', 0, 0),
      number('tax', 'Tax on material (%)', 0, 0),
      allowance,
    ],
    formula: 'Total = quantity × allowance factor × unit price × (1 + material tax / 100) + delivery + labor.',
    assumptions: [
      'Quantity and quoted unit price must use the same unit.',
      'Use a separate calculation for each material line and add the totals.',
    ],
    sources: [],
    calculate(v, u) {
      const q = v.quantity * waste(v);
      const materials = q * v.price;
      const total = materials * (1 + v.tax / 100) + v.delivery + v.labor;
      return result(
        [
          row('cost', 'Estimated total', total, 'USD'),
          row('materials', 'Material subtotal', materials, 'USD'),
          row('quantity', 'Quantity including allowance', q, 'units'),
          row('tax', 'Material tax', materials * v.tax / 100, 'USD'),
        ],
        [
          `${fmt(q)} units × $${fmt(v.price)} = $${fmt(materials)}.`,
          `Add material tax, $${fmt(v.delivery)} delivery and $${fmt(v.labor)} labor.`,
        ]
      );
    },
  },
  waste: {
    fields: [number('quantity', 'Net quantity', 100, 0), allowance],
    formula: 'Extra quantity = net quantity × allowance / 100; total = net quantity + extra.',
    assumptions: [
      'Keep the same unit throughout.',
      'For discrete items, use the whole-item total; do not round intermediate quantities.',
    ],
    sources: [],
    calculate(v) {
      const total = v.quantity * waste(v);
      return result(
        [
          row('total', 'Total including allowance', total, 'units'),
          row('extra', 'Extra quantity', total - v.quantity, 'units'),
          row('whole', 'Whole items to order', roundUp(total), 'items', true),
        ],
        [
          `${fmt(v.quantity)} × ${fmt(v.waste / 100)} = ${fmt(total - v.quantity)} extra.`,
          `${fmt(v.quantity)} + ${fmt(total - v.quantity)} = ${fmt(total)} total.`,
        ]
      );
    },
  },
  // --- 4 New material models ---
  'cone-gravity-dam': {
    fields: [
      length('height', 'Dam height above foundation', 30, 'ft'),
      length('base', 'Base width', 70, 'ft'),
      length('crest', 'Crest width', 10, 'ft'),
      length('length', 'Dam crest length', 200, 'ft'),
      volume('head', 'Upslope head', 15),
      length('freeboard', 'Freeboard above water', 2, 'ft'),
      densityField,
      yieldField,
      price('USD/yd3'),
    ],
    formula: 'Cone frustum volume = πh(R² + Rr + r²)/3; steel plate for cut-off. Concrete to order includes waste.',
    assumptions: [
      'Dam is modeled as a circular-cone frustum; the crest width is the top diameter.',
      'Concrete density is 150 lb/ft³ and 80-lb bag yield is 0.60 ft³ for bag estimates.',
      'Include waste on the geometric concrete volume only; steel plate weight is net.',
    ],
    sources: [geometry],
    calculate(v, u) {
      const H = v.height + v.head + v.freeboard;
      const R = v.base / 2;
      const r = v.crest / 2;
      const cuFt = Math.PI * H * (R * R + R * r + r * r) / 3 * (v.length / (2 * R));
      const ton = v.length * (v.height - v.crest / 2) * 2;
      const sqFt = ton * 2 * 2;
      return result(
        withCost(
          [
            row('total', 'Concrete to order', cuFt * waste(v) / 27, 'yd³'),
            row('net', 'Geometric volume', cuFt / 27, 'yd³'),
            row('ft3', 'Order volume', cuFt * waste(v), 'ft³'),
            row('m3', 'Order volume', cuFt * waste(v) / FT_PER_M ** 3, 'm³'),
            row('bags', 'Bags at entered yield', roundUp(cuFt * waste(v) / v.yield), 'bags', true),
            row('weight', 'Estimated order weight', cuFt * waste(v) * densityLb(v.density, u.density), 'lb'),
            row('tons', 'Estimated order weight', cuFt * waste(v) * densityLb(v.density, u.density) / 2000, 'US tons'),
            row('steel', 'Cut-off steel plate weight', ton, 'US tons'),
            row('sqft', 'Steel plate area (both faces)', sqFt, 'ft²'),
          ],
          v.price, u.price, { 'USD/yd3': cuFt * waste(v) / 27 }
        ),
        [`Cone frustum height ${fmt(H)} ft, R=${fmt(R)} ft, r=${fmt(r)} ft → ${fmt(cuFt / 27)} yd³.`]
      );
    },
  },
  'groin-jetty-breakwater': {
    fields: [
      length('height', 'Structure crest height above seabed', 12, 'ft'),
      length('base', 'Base width', 30, 'ft'),
      length('crest', 'Crest width', 8, 'ft'),
      length('length', 'Structure length', 300, 'ft'),
      densityField,
      yieldField,
      price('USD/yd3'),
    ],
    formula: 'Cone-frustum armor-rock volume = πh(R²+Rr+r²)/3. Bedding layer ≈ 10 % of armor. Toe apron = width×depth×length.',
    assumptions: [
      'Armor rock is modeled as a cone frustum. Any placement-void or ordering allowance must be selected for the actual gradation and placement method.',
      'Bedding/quarry-run layer is 0.15× armor volume. Toe apron is 2 ft thick × 3 ft deep × structure length.',
      'All volumes include the entered waste factor; pricing is per cubic yard of armor rock.',
    ],
    sources: [geometry],
    calculate(v, u) {
      const R = v.base / 2;
      const r = v.crest / 2;
      const armor = Math.PI * v.height * (R * R + R * r + r * r) / 3;
      const bedding = armor * 0.10;
      const toe = 2 * 3 * v.length;
      const total = (armor + bedding + toe) * waste(v);
      return result(
        withCost(
          [
            row('armor', 'Armor rock', armor * waste(v) / 27, 'yd³'),
            row('bedding', 'Bedding / quarry-run', bedding * waste(v) / 27, 'yd³'),
            row('toe', 'Toe apron', toe * waste(v) / 27, 'yd³'),
            row('total', 'Total rock', total / 27, 'yd³', true),
            row('net', 'Geometric armor volume', armor / 27, 'yd³'),
            row('ft3', 'Order volume', total, 'ft³'),
            row('m3', 'Order volume', total / FT_PER_M ** 3, 'm³'),
          ],
          v.price, u.price, { 'USD/yd3': total / 27 }
        ),
        [`Armor frustum ${fmt(armor / 27)} yd³ + bedding ${fmt(bedding / 27)} yd³ + toe ${fmt(toe / 27)} yd³.`]
      );
    },
  },
  'masonry-arch': {
    fields: [
      length('wall', 'Wall length', 20, 'ft'),
      length('rise', 'Arch rise above springing', 3, 'ft'),
      length('span', 'Arch span', 10, 'ft'),
      length('height', 'Wall height above arch springing', 8, 'ft'),
      number('units', 'Units per lineal ft of wall (double-wythe)', 2.7, 0.1),
      count('wythes', 'Number of wythes', 2, 1),
      allowance,
    ],
    formula: 'Wall units = length × units per ft × wythes × (1 + waste/100). Mortar ≈ wall area × 0.012 ft.',
    assumptions: [
      'Units per lineal foot should come from the manufacturer data sheet for the specific unit size.',
      'Mortar estimate is 0.012 ft³ per unit face (full-bed, double-wythe); adjust for single-wythe or face-shell bedding.',
    ],
    sources: [cmha],
    calculate(v) {
      const units = v.wall * v.units * v.wythes * waste(v);
      const mortar = units * 0.012;
      return result(
        [
          row('units', 'Masonry units', roundUp(units), 'units', true),
          row('mortar', 'Mortar volume', mortar, 'ft³'),
          row('bags', 'Mortar bags (60-lb)', roundUp(mortar / 0.45), 'bags'),
        ],
        [`${fmt(v.wall)} ft × ${fmt(v.units)} × ${v.wythes} wythes × ${fmt(waste(v))} = ${fmt(roundUp(units))} units.`]
      );
    },
  },
  'masonry-gravity-retaining-wall': {
    fields: [
      length('stem', 'Stem height', 8, 'ft'),
      length('base', 'Base width', 6, 'ft'),
      length('length', 'Wall length', 20, 'ft'),
      number('units', 'Units per ft² of wall face', 1.8, 0.1),
      allowance,
    ],
    formula: 'Wall face area ≈ base × length. Total units = face area × units/ft² × wythes × (1 + waste/100).',
    assumptions: [
      'The wall is modeled as a plain gravity wall with a stem and base; face area = base width × wall length.',
      'Units per ft² should come from the manufacturer; adjust for unit size, bond pattern, and single/double wythe.',
    ],
    sources: [cmha],
    calculate(v) {
      const faceArea = v.base * v.length;
      const units = faceArea * v.units * waste(v);
      return result(
        [
          row('face', 'Wall face area', faceArea, 'ft²'),
          row('units', 'Masonry units', roundUp(units), 'units', true),
          row('net', 'Units before allowance', units / waste(v), 'units'),
        ],
        [`${fmt(v.base)} ft × ${fmt(v.length)} ft = ${fmt(faceArea)} ft² × ${fmt(v.units)}/ft².`]
      );
    },
  },
};
