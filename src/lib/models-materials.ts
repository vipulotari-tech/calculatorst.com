import type { Field, Model } from './calculator-types.ts';
import { FT_PER_M, LB_PER_KG, allowance, count, fmt, length, netArea, number, openings, positiveOrZero, price, rectangle, requireCondition, result, roundUp, row, volume, waste, withCost } from './calculator-math.ts';

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

// Helper: build a concrete result with all standard outputs
function concreteResult(
  cuFt: number,
  v: Record<string, number>,
  u: Record<string, string>,
  steps: string[],
  extraRows?: { key: string; label: string; value: number; unit: string; discrete?: boolean }[]
) {
  const total = cuFt * waste(v);
  const bags = roundUp(total / v.yield);
  const lb = total * densityLb(v.density, u.density);
  const rows = [
    row('order', 'Concrete to order', total / 27, 'yd³'),
    row('net', 'Geometric volume', cuFt / 27, 'yd³'),
    row('ft3', 'Order volume', total, 'ft³'),
    row('m3', 'Order volume', total / FT_PER_M ** 3, 'm³'),
    row('bags', 'Bags at entered yield', bags, 'bags', true),
    row('weight', 'Estimated order weight', lb, 'lb'),
    row('tons', 'Estimated order weight', lb / 2000, 'US tons'),
    ...(extraRows ?? []),
  ];
  withCost(rows, v.price, u.price, {
    'USD/yd3': total / 27,
    'USD/m3': total / FT_PER_M ** 3,
    'USD/ft3': total,
    'USD/bag': bags,
  });
  return result(
    rows,
    [
      ...steps,
      `Apply ${fmt(v.waste)}% allowance: ${fmt(cuFt)} × ${fmt(waste(v))} = ${fmt(total)} ft³.`,
      `Bags: round ${fmt(total)} ÷ ${fmt(v.yield)} up to ${bags}.`,
    ],
    [
      'Bag yield is mixed concrete volume; bag mass is not the weight of cured concrete.',
      'Density 150 lb/ft³ = 4,050 lb/yd³ is normal-weight concrete per ACI 318R. Supplier values for your mix and moisture condition are more reliable.'
    ]
  );
}

const densityField: Field = {
  ...number('density', 'Material density', 150, undefined, 'Example bulk density. Replace with a supplier value for the same moisture and compaction condition.'),
  unit: 'lb/ft3',
  units: ['lb/ft3', 'kg/m3', 'ton/yd3'],
  group: 'Material & assumptions'
};
function densityLb(v: number, unit: string): number {
  return unit === 'kg/m3' ? v * LB_PER_KG / FT_PER_M ** 3 : unit === 'ton/yd3' ? v * 2000 / 27 : v;
}
const yieldField: Field = {
  ...volume('yield', 'Mixed yield per bag', 0.6),
  unit: 'ft3',
  group: 'Material & assumptions',
  help: 'Read the yield printed on the bag. 0.60 ft³ is an example for an 80 lb standard concrete mix, not every product.'
};

// Helper: boilerplate fields every concrete calculator shares
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

// =============================
// 1.  Concrete Calculator (generic rectangular — multi-shape selector)
// =============================
type ShapeType = 'slab' | 'footing' | 'wall';

interface ShapeSelectModel extends Model {
  shapeType: ShapeType;
}

const concreteGenericFields: Field[] = [
  { id: 'shape', label: 'Project type', value: 0, unit: '', integer: true, min: 0, max: 2,
    options: [{value:0, label:'Slab'}, {value:1, label:'Footing'}, {value:2, label:'Wall'}] },
  ...rectangle,
  length('depth', 'Thickness / Depth', 4, 'in'),
  length('thickness', 'Wall or footing thickness', 8, 'in'),
  count('quantity', 'Identical sections', 1),
];

const concreteGeneric: Model = {
  fields: [...concreteGenericFields, ...concreteSharedFields],
  formula: 'Slab/footing: V = length × width × thickness × quantity. Wall: V = length × height × thickness − openings.',
  assumptions: [
    ...standardAssumptions,
    'Slab and footing use the same rectangular formula with different naming conventions.',
    'Wall thickness must be entered separately in the thickness field.',
  ],
  sources: [geometry, quikrete, acicr],
  calculate(v, u) {
    const shapeIdx = Math.round(v.shape) as ShapeType;
    let cuFt: number;
    let steps: string[];

    if (shapeIdx === 2) {
      // Wall
      cuFt = v.length * v.height * v.thickness * v.quantity;
      steps = [
        `Wall: ${fmt(v.length)} × ${fmt(v.height)} × ${fmt(v.thickness)} × ${v.quantity} = ${fmt(cuFt)} ft³.`,
      ];
    } else if (shapeIdx === 1) {
      // Footing
      cuFt = v.length * v.width * v.depth * v.quantity;
      steps = [
        `Footing: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} × ${v.quantity} = ${fmt(cuFt)} ft³.`,
      ];
    } else {
      // Slab
      cuFt = v.length * v.width * v.depth * v.quantity;
      steps = [
        `Slab: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} × ${v.quantity} = ${fmt(cuFt)} ft³.`,
      ];
    }
    return concreteResult(cuFt, v, u, steps);
  },
};

// =============================
// 2.  Concrete Volume Calculator
// =============================
const concreteVolumeFields: Field[] = [
  { id: 'shape', label: 'Shape', value: 0, unit: '', integer: true, min: 0, max: 4,
    options: [{value:0, label:'Rectangular'}, {value:1, label:'Cylinder/Column'}, {value:2, label:'Tube'}, {value:3, label:'Curb+Gutter'}, {value:4, label:'Stairs'}] },
  // Rectangular / slab
  ...rectangle,
  length('depth', 'Depth / Thickness', 4, 'in'),
  count('quantity', 'Identical sections', 1),
  // Cylinder / column
  positiveOrZero(length('diameter', 'Diameter', 12, 'in')),
  positiveOrZero(length('height', 'Height / Depth', 8, 'ft')),
  // Tube
  positiveOrZero(length('innerDiameter', 'Inner diameter (0 = solid)', 0, 'in')),
  // Curb
  positiveOrZero(length('curbWidth', 'Curb width', 6, 'in')),
  positiveOrZero(length('curbHeight', 'Curb height', 12, 'in')),
  positiveOrZero(length('gutterWidth', 'Gutter width beyond curb', 18, 'in')),
  positiveOrZero(length('gutterDepth', 'Gutter thickness', 6, 'in')),
  // Stairs
  positiveOrZero(length('stairWidth', 'Stair width', 4, 'ft')),
  positiveOrZero(length('rise', 'Rise per step', 7, 'in')),
  positiveOrZero(length('run', 'Tread depth', 11, 'in')),
  positiveOrZero(count('steps', 'Number of steps', 4)),
  positiveOrZero(length('landing', 'Additional landing length', 0)),
];

const concreteVolume: Model = {
  fields: [...concreteVolumeFields, ...concreteSharedFields],
  formula: 'Rectangular: V = L × W × D; Cylinder: V = π × (D/2)² × H; Tube: V = π/4 × (Dₒ² − Dᵢ²) × H; Curb: V = L × (Wc×Hc + Wg×Dg); Stairs: V = W × rise × run × n(n+1)/2',
  assumptions: [
    ...standardAssumptions,
    'For tubes, the inner diameter must be smaller than the outer diameter.',
    'Curb and gutter cross-sections are treated as non-overlapping rectangles.',
    'Stairs are filled solid from a level base; each succeeding tread is one riser taller.',
  ],
  sources: [geometry, quikrete],
  calculate(v, u) {
    const s = Math.round(v.shape);
    let cuFt = 0;
    let steps: string[] = [];

    if (s === 1) {
      // Cylinder
      const r = v.diameter / 2;
      cuFt = Math.PI * r * r * v.height * v.quantity;
      steps = [`Cylinder: π × (${fmt(v.diameter)}/2)² × ${fmt(v.height)} × ${v.quantity} = ${fmt(cuFt)} ft³.`];
    } else if (s === 2) {
      // Tube
      requireCondition(v.innerDiameter < v.diameter, 'innerDiameter', 'Inner diameter must be smaller than outer diameter.');
      const outer = Math.PI * (v.diameter / 2) ** 2;
      const inner = Math.PI * (v.innerDiameter / 2) ** 2;
      cuFt = (outer - inner) * v.height * v.quantity;
      steps = [`Tube: π/4 × (${fmt(v.diameter)}² − ${fmt(v.innerDiameter)}²) × ${fmt(v.height)} × ${v.quantity} = ${fmt(cuFt)} ft³.`];
    } else if (s === 3) {
      // Curb and gutter
      cuFt = v.length * (v.curbWidth * v.curbHeight + v.gutterWidth * v.gutterDepth);
      steps = [`Curb: ${fmt(v.length)} × (${fmt(v.curbWidth)}×${fmt(v.curbHeight)} + ${fmt(v.gutterWidth)}×${fmt(v.gutterDepth)}) = ${fmt(cuFt)} ft³.`];
    } else if (s === 4) {
      // Stairs
      cuFt = v.stairWidth * v.rise * v.run * v.steps * (v.steps + 1) / 2
        + v.stairWidth * v.landing * v.steps * v.rise;
      steps = [`Stairs: ${fmt(v.steps)} steps = ${fmt(cuFt)} ft³.`];
    } else {
      // Rectangular (default)
      cuFt = v.length * v.width * v.depth * v.quantity;
      steps = [`Rectangular: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} × ${v.quantity} = ${fmt(cuFt)} ft³.`];
    }
    return concreteResult(cuFt, v, u, steps);
  },
};

// =============================
// 3.  Concrete Weight Calculator
// =============================
const concreteWeightFields: Field[] = [
  volume('volume', 'Concrete volume', 1, 'yd³'),
  { ...densityField, value: DEFAULT_DENSITY },
  allowance,
];

const concreteWeight: Model = {
  fields: concreteWeightFields,
  formula: 'Mass = volume × density; US tons = mass / 2,000; kg = mass / 0.45359237',
  assumptions: [
    `Default density ${DEFAULT_DENSITY} lb/ft³ = ${(DEFAULT_DENSITY * 27 / 2000).toFixed(2)} US tons/yd³ for normal-weight concrete per ACI 318R.`,
    'Lightweight structural concrete may be 110–130 lb/ft³. Heavier mixes (steel/iron aggregate) can exceed 300 lb/ft³.',
    'Enter density from your mix design or supplier data sheet. Volume and density must describe the same condition.',
  ],
  sources: [acicr, 'https://www.engineeringtoolbox.com/concrete-properties-d_1225.html'],
  calculate(v, u) {
    const cuFt = v.volume * 27; // from input yd³
    const totalCuFt = cuFt * waste(v);
    const totalLb = totalCuFt * densityLb(v.density, u.density);
    const netLb = cuFt * densityLb(v.density, u.density);
    return result(
      [
        row('netWeight', 'Net weight', netLb, 'lb'),
        row('netTons', 'Net weight', netLb / 2000, 'US tons'),
        row('netTonnes', 'Net weight', netLb / LB_PER_KG / 1000, 'metric tonnes'),
        row('orderWeight', 'Weight with allowance', totalLb, 'lb'),
        row('orderTons', 'Weight with allowance', totalLb / 2000, 'US tons'),
        row('orderTonnes', 'Weight with allowance', totalLb / LB_PER_KG / 1000, 'metric tonnes'),
        row('densityUsed', 'Density applied', densityLb(v.density, u.density), 'lb/ft³'),
      ],
      [
        `${fmt(v.volume)} yd³ × 27 = ${fmt(cuFt)} ft³.`,
        `${fmt(cuFt)} ft³ × ${fmt(densityLb(v.density, u.density))} lb/ft³ = ${fmt(netLb)} lb = ${fmt(netLb / 2000)} US tons.`,
        `With ${fmt(v.waste)}%: ${fmt(totalLb)} lb.`,
      ],
      [`Volume and density must refer to the same placed or compacted condition.`]
    );
  },
};

// =============================
// 4.  Concrete Cost Calculator
// =============================
const concreteCostFields: Field[] = [
  ...rectangle,
  length('depth', 'Thickness / Depth', 4, 'in'),
  count('quantity', 'Identical sections', 1),
  { ...densityField },
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag', 'USD/ton']),
  number('delivery', 'Ready-mix delivery fee ($)', 0, 0, 'Flat delivery charge per truck, not per yard.'),
  number('tax', 'Material tax (%)', 0, 0, 'Sales tax on material only, not delivery.'),
  allowance,
];

const concreteCost: Model = {
  fields: concreteCostFields,
  formula: 'Volume = L × W × D × quantity; cost = volume × price per unit × (1 + tax/100) + delivery',
  assumptions: [
    ...standardAssumptions,
    'Price and the selected price unit must describe the same basis (e.g. per cubic yard of ready-mix).',
    'Bag pricing estimates the material only; bag cost per yard varies by brand and location.',
    'Delivery fee is a flat amount, not per yard. Confirm with your supplier.',
  ],
  sources: [quikrete, geometry],
  calculate(v, u) {
    const cuFt = v.length * v.width * v.depth * v.quantity;
    const total = cuFt * waste(v);
    const bags = roundUp(total / v.yield);
    const lb = total * densityLb(v.density, u.density);
    const volumes = {
      'USD/yd3': total / 27,
      'USD/m3': total / FT_PER_M ** 3,
      'USD/ft3': total,
      'USD/bag': bags,
      'USD/ton': lb / 2000,
    };
    const qty = volumes[u.price] ?? total / 27;
    const rows = [
      row('order', 'Concrete to order', total / 27, 'yd³'),
      row('net', 'Geometric volume', cuFt / 27, 'yd³'),
      row('bags', 'Bags at entered yield', bags, 'bags', true),
      row('weight', 'Estimated order weight', lb, 'lb'),
    ];
    if (Number.isFinite(v.price)) {
      const materials = qty * v.price;
      const taxAmt = materials * (v.tax / 100);
      const totalCost = materials + taxAmt + v.delivery;
      rows.push(
        row('materials', 'Material subtotal', materials, 'USD'),
        row('tax', 'Material tax', taxAmt, 'USD'),
        row('delivery', 'Delivery fee', v.delivery, 'USD'),
        row('total', 'Estimated total', totalCost, 'USD'),
      );
      return result(
        rows,
        [
          `Volume: ${fmt(cuFt)} ft³ → ${fmt(total / 27)} yd³.`,
          `${fmt(bags)} bags or ${fmt(total / 27)} yd³ of ready-mix.`,
          `Material: ${fmt(qty)} × $${fmt(v.price)} = $${fmt(materials)}.`,
          `Total with tax + delivery: $${fmt(totalCost)}.`,
        ]
      );
    }
    return result(
      rows,
      [
        `Volume: ${fmt(cuFt)} ft³ → ${fmt(total / 27)} yd³.`,
        `${fmt(bags)} bags or ${fmt(total / 27)} yd³ of ready-mix.`,
        'Enter a unit price to see the material cost breakdown.',
      ]
    );
  },
};

// =============================
// 5.  Concrete Mix Calculator
// =============================
const concreteMixFields: Field[] = [
  volume('volume', 'Required mixed concrete volume', 1, 'm³'),
  number('cementParts', 'Cement parts by volume', 1, 1, 'Typical 1-2-3 ratio for general concrete.'),
  number('sandParts', 'Sand (fine aggregate) parts by volume', 2, 1),
  number('aggregateParts', 'Coarse aggregate parts by volume', 3, 0),
  number('dryFactor', 'Dry volume / mixed volume factor', 1.54, 1.01, 'Accounts for aggregate voids and compaction. Industry standard is 1.54. Use a trial batch for accuracy.'),
  number('cementDensity', 'Loose cement bulk density (kg/m³)', 1440, 100, 'Portland cement bulk density varies. 1,440 kg/m³ is typical for loose cement.'),
  number('bagMass', 'Cement bag mass (kg)', 50, 1, 'Common sizes: 40 kg, 50 kg. Check your product.'),
  allowance,
];

const concreteMix: Model = {
  fields: concreteMixFields,
  formula: 'Dry volume = mixed volume × dry factor; Cement volume = dry × cement parts / total parts; Sand = dry × sand parts / total; Aggregate = dry × aggregate parts / total; Cement mass = cement volume × bulk density',
  assumptions: [
    'Ratios are by loose dry volume, not mass. A nominal ratio does not establish concrete strength, durability, or water/cement ratio.',
    'The dry volume factor 1.54 accounts for void space in loose aggregate. Actual factor depends on grading and compaction.',
    'Water and admixtures are not estimated. Use a specified mix design for structural concrete.',
    'Cement bulk density 1,440 kg/m³ is for loose Portland cement. Clinker density is ~3,150 kg/m³.',
  ],
  sources: [quikrete, 'https://www.cement.org/learn'],
  calculate(v, u) {
    const totalParts = v.cementParts + v.sandParts + v.aggregateParts;
    if (totalParts === 0) {
      requireCondition(false, 'mix', 'At least one mix ingredient must be specified.');
    }
    const mixed = v.volume * waste(v);
    const dry = mixed * v.dryFactor;
    const cementVol = dry * v.cementParts / totalParts;
    const sandVol = dry * v.sandParts / totalParts;
    const aggVol = dry * v.aggregateParts / totalParts;
    const cementMass = cementVol * v.cementDensity;
    const bags = roundUp(cementMass / v.bagMass);

    return result(
      [
        row('mixedVol', 'Mixed concrete volume', mixed, 'm³'),
        row('dryVol', 'Dry material volume', dry, 'm³'),
        row('cementVol', 'Cement volume', cementVol, 'm³'),
        row('cementMass', 'Loose cement mass', cementMass, 'kg'),
        row('cementBags', 'Whole cement bags', bags, 'bags', true),
        row('sandVol', 'Dry sand volume', sandVol, 'm³'),
        row('aggregateVol', 'Dry coarse aggregate volume', aggVol, 'm³'),
        row('totalParts', 'Total parts', totalParts, 'parts'),
      ],
      [
        `Parts: ${fmt(v.cementParts)} + ${fmt(v.sandParts)} + ${fmt(v.aggregateParts)} = ${totalParts}.`,
        `Dry material: ${fmt(mixed)} × ${fmt(v.dryFactor)} = ${fmt(dry)} m³.`,
        `Cement: ${fmt(cementVol)} m³ × ${fmt(v.cementDensity)} kg/m³ = ${fmt(cementMass)} kg → ${bags} bags.`,
        `Sand: ${fmt(sandVol)} m³; Aggregate: ${fmt(aggVol)} m³.`,
      ]
    );
  },
};

// =============================
// 6.  Concrete Pour Calculator
// =============================
const concretePourFields: Field[] = [
  length('length', 'Pour length', 20, 'ft'),
  length('width', 'Pour width', 10, 'ft'),
  length('depth', 'Pour thickness', 4, 'in'),
  count('quantity', 'Number of separate pours', 1),
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag', 'USD/ton']),
  number('truckCapacity', 'Ready-mix truck capacity (yd³)', 10, 1, 'Typical transit mixer holds 9–11 yd³.'),
];

const concretePour: Model = {
  fields: concretePourFields,
  formula: 'Total volume = length × width × thickness × pours × (1 + waste/100); truck loads = ceil(total yd³ / truck capacity)',
  assumptions: [
    ...standardAssumptions,
    'Truck load count is a planning estimate. Actual capacity varies by supplier, distance, and mix type.',
    'Orders under ~1 yd³ may not be available for ready-mix delivery; check minimums.',
    'The last load may be smaller; this tool counts full loads.',
  ],
  sources: [quikrete, geometry],
  calculate(v, u) {
    const netCuFt = v.length * v.width * v.depth * v.quantity;
    const totalCuFt = netCuFt * waste(v);
    const totalCuYd = totalCuFt / 27;
    const bags = roundUp(totalCuFt / v.yield);
    const lb = totalCuFt * densityLb(v.density, u.density);
    const trucks = Math.max(1, roundUp(totalCuYd / v.truckCapacity));

    return result(
      [
        row('order', 'Total concrete', totalCuYd, 'yd³'),
        row('net', 'Geometric volume', netCuFt / 27, 'yd³'),
        row('ft3', 'Total volume', totalCuFt, 'ft³'),
        row('m3', 'Total volume', totalCuFt / FT_PER_M ** 3, 'm³'),
        row('bags', 'Bags at entered yield', bags, 'bags', true),
        row('weight', 'Estimated order weight', lb, 'lb'),
        row('tons', 'Estimated order weight', lb / 2000, 'US tons'),
        row('trucks', 'Ready-mix truck loads', trucks, 'loads', true),
      ],
      [
        `${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} × ${v.quantity} = ${fmt(netCuFt)} ft³.`,
        `With ${fmt(v.waste)}%: ${fmt(totalCuFt)} ft³ = ${fmt(totalCuYd)} yd³.`,
        `${fmt(totalCuYd)} yd³ ÷ ${fmt(v.truckCapacity)} yd³/truck = ${trucks} truck loads.`,
      ]
    );
  },
};

// =============================
// 7.  Concrete Slab Calculator
// =============================
const concreteSlabFields: Field[] = [
  length('length', 'Slab length', 10, 'ft'),
  length('width', 'Slab width', 10, 'ft'),
  length('thickness', 'Slab thickness', 4, 'in'),
  count('quantity', 'Identical slabs', 1),
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']),
];

const concreteSlab: Model = {
  fields: concreteSlabFields,
  formula: 'Volume = length × width × thickness × quantity; 1 yd³ = 27 ft³',
  assumptions: [
    ...standardAssumptions,
    'Common residential slab thickness is 4 in for patios/walks and 6 in for driveways. Confirm with your engineer.',
  ],
  sources: [geometry, quikrete, 'https://www.concrete.org/tools/frequently-asked-questions'],
  calculate(v, u) {
    const cuFt = v.length * v.width * v.thickness * v.quantity;
    return concreteResult(cuFt, v, u, [
      `${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.thickness)} × ${v.quantity} = ${fmt(cuFt)} ft³.`,
    ]);
  },
};

// =============================
// 8.  Concrete Footing Calculator
// =============================
const concreteFootingFields: Field[] = [
  { id: 'footingShape', label: 'Footing type', value: 0, unit: '', integer: true, min: 0, max: 1,
    options: [{value:0, label:'Strip/continuous'}, {value:1, label:'Square isolated'}] },
  // Continuous / strip footing
  length('length', 'Footing length (centerline)', 20, 'ft'),
  length('width', 'Footing width', 12, 'in'),
  length('depth', 'Footing depth', 12, 'in'),
  // Square isolated
  positiveOrZero(length('sideWidth', 'Side width (square)', 24, 'in')),
  count('quantity', 'Number of footings', 1),
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']),
];

const concreteFooting: Model = {
  fields: concreteFootingFields,
  formula: 'Strip: V = length × width × depth; Square isolated: V = side² × depth × quantity',
  assumptions: [
    ...standardAssumptions,
    'Strip footing length should use the centerline method so corners are not double-counted.',
    'This estimates concrete volume only. Reinforcement, dowels, and keyways require separate measurement.',
    'Footing size must come from the structural design; this tool does not size footings.',
  ],
  sources: [geometry, 'https://www.iccsafe.org/'],
  calculate(v, u) {
    const isStrip = Math.round(v.footingShape) === 0;
    let cuFt: number;
    let steps: string[];

    if (isStrip) {
      cuFt = v.length * v.width * v.depth;
      steps = [`Strip: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} = ${fmt(cuFt)} ft³.`];
    } else {
      const s = v.sideWidth;
      cuFt = s * s * v.depth * v.quantity;
      steps = [`Square isolated: ${fmt(s)} × ${fmt(s)} × ${fmt(v.depth)} × ${v.quantity} = ${fmt(cuFt)} ft³.`];
    }
    return concreteResult(cuFt, v, u, steps);
  },
};

// =============================
// 9.  Concrete Foundation Calculator
// =============================
const concreteFoundationFields: Field[] = [
  // Wall
  length('wallLength', 'Foundation wall length', 40, 'ft'),
  length('wallHeight', 'Wall height', 8, 'ft'),
  length('wallThickness', 'Wall thickness', 8, 'in'),
  // Footing
  length('footingLength', 'Footing length', 40, 'ft'),
  length('footingWidth', 'Footing width', 12, 'in'),
  length('footingDepth', 'Footing depth', 12, 'in'),
  // Slab on grade
  positiveOrZero(length('slabLength', 'Slab on grade length', 0, 'ft')),
  positiveOrZero(length('slabWidth', 'Slab on grade width', 0, 'ft')),
  positiveOrZero(length('slabThickness', 'Slab thickness', 0, 'in')),
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']),
];

const concreteFoundation: Model = {
  fields: concreteFoundationFields,
  formula: 'Foundation = wall volume + footing volume + slab volume (each nonzero component)',
  assumptions: [
    ...standardAssumptions,
    'Foundation walls: enter centerline length so corners are not double-counted.',
    'Only include components that apply to your project. Leave unused components at zero.',
    'Footing length typically equals wall length. This tool does not adjust for stepped footings.',
    'This is a material quantity estimator, not a structural design tool.',
  ],
  sources: [geometry, 'https://www.concrete.org/tools/frequently-asked-questions'],
  calculate(v, u) {
    let cuFt = 0;
    const parts: string[] = [];

    // Wall
    if (v.wallLength > 0 && v.wallHeight > 0 && v.wallThickness > 0) {
      const wallVol = v.wallLength * v.wallHeight * v.wallThickness;
      cuFt += wallVol;
      parts.push(`Wall: ${fmt(v.wallLength)} × ${fmt(v.wallHeight)} × ${fmt(v.wallThickness)} = ${fmt(wallVol)} ft³`);
    }

    // Footing
    if (v.footingLength > 0 && v.footingWidth > 0 && v.footingDepth > 0) {
      const footVol = v.footingLength * v.footingWidth * v.footingDepth;
      cuFt += footVol;
      parts.push(`Footing: ${fmt(v.footingLength)} × ${fmt(v.footingWidth)} × ${fmt(v.footingDepth)} = ${fmt(footVol)} ft³`);
    }

    // Slab on grade
    if (v.slabLength > 0 && v.slabWidth > 0 && v.slabThickness > 0) {
      const slabVol = v.slabLength * v.slabWidth * v.slabThickness;
      cuFt += slabVol;
      parts.push(`Slab: ${fmt(v.slabLength)} × ${fmt(v.slabWidth)} × ${fmt(v.slabThickness)} = ${fmt(slabVol)} ft³`);
    }

    if (cuFt === 0) {
      requireCondition(false, 'dimensions', 'Enter at least one foundation component (wall, footing, or slab).');
    }

    return concreteResult(cuFt, v, u, parts);
  },
};

// =============================
// 10.  Concrete Wall Calculator
// =============================
const concreteWallFields: Field[] = [
  length('length', 'Total wall length (centerline)', 40, 'ft'),
  length('height', 'Wall height', 8, 'ft'),
  length('thickness', 'Wall thickness', 8, 'in'),
  { ...openings, value: 0 },
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']),
];

const concreteWall: Model = {
  fields: concreteWallFields,
  formula: 'V = wall length × height × thickness − opening volume',
  assumptions: [
    'Use the combined centerline length of wall runs so corners are counted once, not twice.',
    'Subtract door, window, and utility openings. Enter each opening as length × height × thickness.',
    'This calculates cast-in-place concrete walls. Retaining walls with different backfill pressures need engineering review.',
  ],
  sources: [geometry, cmha],
  calculate(v, u) {
    const gross = v.length * v.height * v.thickness;
    const net = gross - v.openings;
    requireCondition(net >= 0, 'openings', 'Openings cannot exceed the wall volume. Check dimensions.');
    return concreteResult(net, v, u, [
      `Gross: ${fmt(v.length)} × ${fmt(v.height)} × ${fmt(v.thickness)} = ${fmt(gross)} ft³.`,
      `Less openings: ${fmt(gross)} − ${fmt(v.openings)} = ${fmt(net)} ft³.`,
    ]);
  },
};

// =============================
// 11.  Concrete Column Calculator
// =============================
const columnShapeField: Field = {
  id: 'columnShape', label: 'Column shape', value: 0, unit: '', integer: true, min: 0, max: 2,
  options: [{value:0, label:'Circular'}, {value:1, label:'Square'}, {value:2, label:'Rectangular'}],
};

const concreteColumnFields: Field[] = [
  columnShapeField,
  positiveOrZero(length('diameter', 'Diameter (circular)', 12, 'in')),
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
  formula: 'Circular: V = π × (D/2)² × H × Q; Square: V = S² × H × Q; Rectangular: V = W × D × H × Q',
  assumptions: [
    ...standardAssumptions,
    'Column dimensions are the form dimensions, not the overall footprint including kick-outs.',
    'This estimates the concrete volume; rebar, anchor bolts, and embed plates require separate measurement.',
  ],
  sources: [geometry, acicr],
  calculate(v, u) {
    const s = Math.round(v.columnShape);
    let cuFt: number;
    let steps: string[];

    if (s === 1) {
      // Square
      cuFt = v.side ** 2 * v.height * v.quantity;
      steps = [`Square: ${fmt(v.side)}² × ${fmt(v.height)} × ${v.quantity} = ${fmt(cuFt)} ft³.`];
    } else if (s === 2) {
      // Rectangular
      cuFt = v.rectWidth * v.rectDepth * v.height * v.quantity;
      steps = [`Rectangular: ${fmt(v.rectWidth)} × ${fmt(v.rectDepth)} × ${fmt(v.height)} × ${v.quantity} = ${fmt(cuFt)} ft³.`];
    } else {
      // Circular (default)
      const r = v.diameter / 2;
      cuFt = Math.PI * r * r * v.height * v.quantity;
      steps = [`Circular: π × (${fmt(v.diameter)}/2)² × ${fmt(v.height)} × ${v.quantity} = ${fmt(cuFt)} ft³.`];
    }
    return concreteResult(cuFt, v, u, steps);
  },
};

// =============================
// 12.  Concrete Curb Calculator
// =============================
const concreteCurbFields: Field[] = [
  { id: 'curbStyle', label: 'Curb style', value: 0, unit: '', integer: true, min: 0, max: 1,
    options: [{value:0, label:'Curb + gutter'}, {value:1, label:'Curb only'}] },
  length('length', 'Curb run length', 20, 'ft'),
  length('curbWidth', 'Curb face width', 6, 'in'),
  length('curbHeight', 'Curb height', 12, 'in'),
  positiveOrZero(length('gutterWidth', 'Gutter width beyond curb', 18, 'in')),
  length('gutterThickness', 'Gutter thickness', 6, 'in'),
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', '/bag']),
];

const concreteCurb: Model = {
  fields: concreteCurbFields,
  formula: 'V = length × (curb width × curb height + gutter width × gutter thickness)',
  assumptions: [
    ...standardAssumptions,
    'The curb and gutter cross-sections are treated as non-overlapping rectangles.',
    'Gutter width is measured beyond the curb face, not including the curb width.',
    'For shaped curbs (barrier, mountable), use the cross-section area from the engineering drawing.',
  ],
  sources: [geometry],
  calculate(v, u) {
    const gutterW = Math.round(v.curbStyle) === 1 ? 0 : v.gutterWidth;
    const curbArea = v.curbWidth * v.curbHeight;
    const gutterArea = gutterW * v.gutterThickness;
    const totalArea = curbArea + gutterArea;
    const cuFt = v.length * totalArea;

    const style = Math.round(v.curbStyle) === 1 ? 'curb only' : 'curb + gutter';
    const steps = [
      `${style}: curb = ${fmt(v.curbWidth)} × ${fmt(v.curbHeight)} = ${fmt(curbArea)} ft².`,
      gutterW > 0 ? `Gutter = ${fmt(gutterW)} × ${fmt(v.gutterThickness)} = ${fmt(gutterArea)} ft².` : 'No gutter (curb only).',
      `Total cross-section = ${fmt(totalArea)} ft².`,
      `${fmt(v.length)} ft × ${fmt(totalArea)} ft² = ${fmt(cuFt)} ft³.`,
    ];

    return concreteResult(cuFt, v, u, steps);
  },
};

// =============================
// 13.  Concrete Stair Calculator
// =============================
const concreteStairFields: Field[] = [
  length('width', 'Stair width', 4, 'ft'),
  length('rise', 'Riser height', 7, 'in'),
  length('run', 'Tread depth', 11, 'in'),
  count('steps', 'Number of steps', 4),
  positiveOrZero(length('waistThickness', 'Waist slab thickness', 6, 'in'),),
  positiveOrZero(length('landingLength', 'Landing length (beyond top tread)', 0, 'ft')),
  positiveOrZero(length('landingWidth', 'Landing width', 4, 'ft')),
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']),
];

const concreteStair: Model = {
  fields: concreteStairFields,
  formula: 'Steps: V = W × rise × run × n(n+1)/2; Landing: V = L_length × L_width × waist thickness; Total = steps + landing',
  assumptions: [
    ...standardAssumptions,
    'Steps are filled solid from a level base. Each succeeding tread section is one riser taller at the underside.',
    'The waist slab (if entered) extends under the full stair width and connects to the landing.',
    'The landing is at the top elevation and does NOT include the top tread (which is part of the steps).',
    'For open-riser or soil-filled stairs, use the actual section from the design drawing.',
  ],
  sources: [geometry],
  calculate(v, u) {
    // Step volume: each step is a rectangular prism of width × rise × run
    // The n-th step (from bottom) has a vertical face of n × rise height
    // Volume = sum from k=1 to n of (width × rise × run) = width × rise × run × n
    // But the wedge/geometry model used here: width × rise × run × n(n+1)/2
    // This accounts for the triangular profile of solid-filled stairs
    const stepVol = v.width * v.rise * v.run * v.steps * (v.steps + 1) / 2;
    const landingVol = v.landingLength > 0 && v.landingWidth > 0
      ? v.landingLength * v.landingWidth * v.waistThickness
      : 0;
    const cuFt = stepVol + landingVol;

    const steps_list = [
      `${v.steps} steps: W ${fmt(v.width)} × rise ${fmt(v.rise)} × run ${fmt(v.run)} × ${v.steps}(${v.steps}+1)/2 = ${fmt(stepVol)} ft³.`,
      landingVol > 0
        ? `Landing: ${fmt(v.landingLength)} × ${fmt(v.landingWidth)} × ${fmt(v.waistThickness)} = ${fmt(landingVol)} ft³.`
        : 'No landing.',
      `Total: ${fmt(cuFt)} ft³.`,
    ];

    return concreteResult(cuFt, v, u, steps_list);
  },
};

// =============================
// 14.  Concrete Ramp Calculator
// =============================
const concreteRampFields: Field[] = [
  length('length', 'Horizontal ramp length', 10, 'ft'),
  length('width', 'Ramp width', 4, 'ft'),
  length('highThickness', 'Thickness at high end', 6, 'in'),
  positiveOrZero(length('lowThickness', 'Thickness at low end', 0, 'in'),
    { help: 'Usually zero for a ramp on a slab. Enter if there is a curb or thickened edge.' }),
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']),
];

const concreteRamp: Model = {
  fields: concreteRampFields,
  formula: 'V = length × width × (low thickness + high thickness) / 2',
  assumptions: [
    ...standardAssumptions,
    'The ramp has a linearly varying thickness between the low end and high end.',
    'Enter horizontal plan length, not the sloping surface length. The formula accounts for the slope geometry.',
    'This models a straight ramp. Curved or switchback ramps require section-based estimation.',
    'ADA slope guidelines (1:12 max for accessible routes) are not enforced by this calculator.',
  ],
  sources: [geometry, 'https://www.ada.gov/'],
  calculate(v, u) {
    const avgThickness = (v.lowThickness + v.highThickness) / 2;
    const cuFt = v.length * v.width * avgThickness;
    return concreteResult(cuFt, v, u, [
      `Average thickness: (${fmt(v.lowThickness)} + ${fmt(v.highThickness)}) / 2 = ${fmt(avgThickness)} in.`,
      `${fmt(v.length)} × ${fmt(v.width)} × ${fmt(avgThickness)} = ${fmt(cuFt)} ft³.`,
    ]);
  },
};

// =============================
// 15.  Concrete Tube Calculator
// =============================
const concreteTubeFields: Field[] = [
  length('outerDiameter', 'Outside diameter', 12, 'in'),
  positiveOrZero(length('innerDiameter', 'Inside diameter (0 = solid post)', 0, 'in')),
  length('height', 'Tube / post height', 8, 'ft'),
  count('quantity', 'Identical tubes', 1),
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag']),
];

const concreteTube: Model = {
  fields: concreteTubeFields,
  formula: 'V = π/4 × (outer diameter² − inner diameter²) × height × quantity',
  assumptions: [
    ...standardAssumptions,
    'For a solid post, set the inside diameter to 0.',
    'The inside diameter must be smaller than the outside diameter.',
    'Common Sonotube sizes: 8", 10", 12". Form cardboard thickness is ignored.',
  ],
  sources: [geometry, quikrete],
  calculate(v, u) {
    requireCondition(v.innerDiameter < v.outerDiameter, 'innerDiameter', 'Inside diameter must be smaller than outside diameter.');
    const outerArea = Math.PI * (v.outerDiameter / 2) ** 2;
    const innerArea = Math.PI * (v.innerDiameter / 2) ** 2;
    const netArea = outerArea - innerArea;
    const cuFt = netArea * v.height * v.quantity;

    return concreteResult(cuFt, v, u, [
      `Outer: π × (${fmt(v.outerDiameter)}/2)² = ${fmt(outerArea)} in².`,
      v.innerDiameter > 0
        ? `Inner: π × (${fmt(v.innerDiameter)}/2)² = ${fmt(innerArea)} in².`
        : 'Solid (inner diameter = 0).',
      `Net: ${fmt(netArea)} in² × ${fmt(v.height)} ft × ${v.quantity} = ${fmt(cuFt)} ft³.`,
    ]);
  },
};

// =============================
// 16.  Concrete Waste Calculator
// =============================
const concreteWasteFields: Field[] = [
  ...rectangle,
  length('depth', 'Slab thickness', 4, 'in'),
  count('quantity', 'Identical sections', 1),
  { ...number('wastePercent', 'Waste allowance (%)', 10, 0,
    'Extra material to account for spillage, uneven subgrade, and over-excavation. Typical: 5–10%.'), max: 50 },
];

const concreteWaste: Model = {
  fields: concreteWasteFields,
  formula: 'Order amount = geometric volume × (1 + waste% / 100)',
  assumptions: [
    'Waste allowance is a percentage added to the calculated volume, not a separate calculation.',
    'Typical waste allowances: 5% for controlled environments, 10% for typical residential, 15% for complex or sloped sites.',
    'Do not add waste allowance on top of another tool\'s waste-inclusive result.',
  ],
  sources: [geometry],
  calculate(v, u) {
    const netCuFt = v.length * v.width * v.depth * v.quantity;
    const netCuYd = netCuFt / 27;
    const wastePct = v.wastePercent ?? 10;
    const wasteFactor = 1 + wastePct / 100;
    const totalCuFt = netCuFt * wasteFactor;
    const totalCuYd = totalCuFt / 27;
    const wasteAmount = totalCuFt - netCuFt;

    return result(
      [
        row('net', 'Base concrete volume', netCuYd, 'yd³'),
        row('netFt3', 'Base concrete volume', netCuFt, 'ft³'),
        row('netM3', 'Base concrete volume', netCuFt / FT_PER_M ** 3, 'm³'),
        row('wastePercent', 'Waste allowance', wastePct, '%'),
        row('wasteAmount', 'Waste volume', wasteAmount, 'ft³'),
        row('order', 'Order amount', totalCuYd, 'yd³'),
        row('orderFt3', 'Order amount', totalCuFt, 'ft³'),
        row('orderM3', 'Order amount', totalCuFt / FT_PER_M ** 3, 'm³'),
        row('bags80', '80-lb bags', roundUp(totalCuFt / 0.60), 'bags', true),
        row('bags60', '60-lb bags', roundUp(totalCuFt / 0.45), 'bags', true),
        row('bags40', '40-lb bags', roundUp(totalCuFt / 0.30), 'bags', true),
      ],
      [
        `Base: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} × ${v.quantity} = ${fmt(netCuFt)} ft³ = ${fmt(netCuYd)} yd³.`,
        `Waste: ${fmt(netCuFt)} × ${fmt(wastePct / 100)} = ${fmt(wasteAmount)} ft³.`,
        `Order: ${fmt(netCuFt)} + ${fmt(wasteAmount)} = ${fmt(totalCuFt)} ft³ = ${fmt(totalCuYd)} yd³.`,
      ]
    );
  },
};

// =============================
// Non-concrete models
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
      [row('depth', 'Average depth', depth * 12, 'in'), row('mm', 'Average depth', depth / FT_PER_M * 1000, 'mm'), row('area', 'Covered area', area, 'ft²')],
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

// =============================
// 5a.  Slab Cost Calculator
// =============================
const slabCostFields: Field[] = [
  ...rectangle,
  length('depth', 'Slab thickness', 4, 'in'),
  count('quantity', 'Identical slabs', 1),
  allowance,
  densityField,
  yieldField,
  price('USD/yd3', ['USD/yd3', 'USD/m3', 'USD/ft3', 'USD/bag', 'USD/ton']),
  number('delivery', 'Delivery fee ($)', 0, 0),
  number('labor', 'Labor charge ($)', 0, 0),
  number('tax', 'Sales tax on material (%)', 0, 0),
];

const slabCost: Model = {
  fields: slabCostFields,
  formula: 'Volume = L × W × D × quantity; cost = volume × price per unit × (1 + tax/100) + delivery + labor.',
  assumptions: [
    'This estimates material cost for the concrete quantity calculated. It does not include formwork, base preparation, rebar, finishing, or site-specific labor.',
    'Thickness must come from your project plans or engineer. Common residential slabs are 4 in (patio/walk) or 6 in (driveway/garage).',
    'Price and the selected price unit must describe the same basis (e.g. per cubic yard of ready-mix).',
    'Delivery fee is a flat amount, not per yard. Bag cost estimates cover material only.',
  ],
  sources: [quikrete, geometry],
  calculate(v, u) {
    const cuFt = v.length * v.width * v.depth * v.quantity;
    const total = cuFt * waste(v);
    const bags = roundUp(total / v.yield);
    const lb = total * densityLb(v.density, u.density);
    const volumes = {
      'USD/yd3': total / 27,
      'USD/m3': total / FT_PER_M ** 3,
      'USD/ft3': total,
      'USD/bag': bags,
      'USD/ton': lb / 2000,
    };
    const qty = volumes[u.price] ?? total / 27;
    const rows = [
      row('order', 'Concrete to order', total / 27, 'yd³'),
      row('net', 'Geometric volume', cuFt / 27, 'yd³'),
      row('ft3', 'Order volume', total, 'ft³'),
      row('m3', 'Order volume', total / FT_PER_M ** 3, 'm³'),
      row('bags', 'Bags at entered yield', bags, 'bags', true),
      row('weight', 'Estimated order weight', lb, 'lb'),
      row('tons', 'Estimated order weight', lb / 2000, 'US tons'),
    ];
    if (Number.isFinite(v.price)) {
      const materials = qty * v.price;
      const taxAmt = materials * (v.tax / 100);
      const totalCost = materials + taxAmt + v.delivery + v.labor;
      rows.push(
        row('materials', 'Material subtotal', materials, 'USD'),
        row('tax', 'Material tax', taxAmt, 'USD'),
        row('delivery', 'Delivery fee', v.delivery, 'USD'),
        row('labor', 'Labor charge', v.labor, 'USD'),
        row('total', 'Estimated total', totalCost, 'USD'),
      );
    }
    return result(rows, [
      `Volume: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.depth)} × ${v.quantity} = ${fmt(cuFt)} ft³.`,
      `Apply ${fmt(v.waste)}% allowance: ${fmt(cuFt)} × ${fmt(waste(v))} = ${fmt(total)} ft³ = ${fmt(total / 27)} yd³.`,
      ...(Number.isFinite(v.price) ? [`${fmt(total / 27)} yd³ × $${fmt(v.price)}/yd³ = $${fmt((total / 27) * v.price)}. Add delivery and labor.`] : [`Enter a price to estimate material cost.`]),
    ]);
  },
};

// =============================
// 5b.  Patio Cost Calculator
// =============================
const patioCost: Model = {
  ...slabCost,
  fields: slabCost.fields,
  formula: 'Volume = L × W × D × quantity; cost = volume × price per unit × (1 + tax/100) + delivery + labor.',
  assumptions: [
    ...standardAssumptions,
    'Common patio thickness is 4 in. Thicker slabs (6 in) are used for heavy loads or poor soil. Confirm with your project design.',
    'This estimates material cost. It does not include excavation, base gravel, formwork, rebar, finishing, or site preparation.',
    'Price and the selected price unit must describe the same basis.',
  ],
  sources: [quikrete, geometry],
  calculate(v, u) {
    return slabCost.calculate(v, u);
  },
};

// =============================
// 5c.  Driveway Cost Calculator
// =============================
const drivewayCost: Model = {
  ...slabCost,
  fields: slabCost.fields,
  formula: 'Volume = L × W × D × quantity; cost = volume × price per unit × (1 + tax/100) + delivery + labor.',
  assumptions: [
    ...standardAssumptions,
    'Common residential driveway thickness is 4–6 in. 4 in is typical for passenger vehicles; 6 in is recommended for heavier vehicles or poor soil subgrade.',
    'This estimates concrete material cost only. It does not include excavation, base preparation, rebar, expansion joints, finishing, or sealing.',
    'Price and the selected price unit must describe the same basis.',
  ],
  sources: [quikrete, geometry],
  calculate(v, u) {
    return slabCost.calculate(v, u);
  },
};

// =============================
// 6.  Shed Foundation Calculator
// =============================
const shedFoundationFields: Field[] = [
  { id: 'foundationType', label: 'Foundation type', value: 0, unit: '', integer: true, min: 0, max: 2,
    options: [
      { value: 0, label: 'Concrete slab' },
      { value: 1, label: 'Concrete pier & beam' },
      { value: 2, label: 'Concrete footing (strip)' },
    ] },
  // Slab: length × width × thickness
  length('length', 'Slab length / footing run', 10, 'ft'),
  length('width', 'Slab width / footing width', 10, 'ft'),
  length('thickness', 'Slab thickness / footing depth', 4, 'in'),
  // Pier
  positiveOrZero(count('pierCount', 'Number of piers', 4, 1)),
  positiveOrZero(length('pierDiameter', 'Pier diameter', 12, 'in')),
  positiveOrZero(length('pierDepth', 'Pier embedment depth', 24, 'in')),
  // Footing
  positiveOrZero(length('footingWidth', 'Footing width', 12, 'in')),
  positiveOrZero(length('footingDepth', 'Footing depth', 12, 'in')),
  count('quantity', 'Identical sections', 1),
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
  formula: 'Slab: V = L × W × T × qty; Pier: V = πr² × depth × count; Footing: V = L × W × D × qty.',
  assumptions: [
    'This is a material quantity estimate for simple foundation shapes. It does not design structural members, frost depth, or load capacity.',
    'Slab: rectangular flat pad. Include isolation board thickness if required.',
    'Pier: cylindrical concrete piers. Verify bearing capacity and frost depth locally.',
    'Footing: continuous strip. Verify width and depth from project plans.',
    'Common shed floor thickness: 4 in (light) to 6 in (heavy). Typical pier: 12 in diameter × 24 in deep.',
    'Confirm all dimensions with your local building code and a qualified designer.',
  ],
  sources: [quikrete, geometry],
  calculate(v, u) {
    const fType = Math.round(v.foundationType);
    let cuFt: number;
    let steps: string[];
    let breakdown: { key: string; label: string; value: number; unit: string }[] = [];

    if (fType === 0) {
      // Slab
      cuFt = v.length * v.width * v.thickness * v.quantity;
      steps = [
        `Slab: ${fmt(v.length)} × ${fmt(v.width)} × ${fmt(v.thickness)} × ${v.quantity} = ${fmt(cuFt)} ft³.`,
      ];
    } else if (fType === 2) {
      // Strip footing
      cuFt = v.length * v.footingWidth * v.footingDepth * v.quantity;
      steps = [
        `Footing: ${fmt(v.length)} × ${fmt(v.footingWidth)} × ${fmt(v.footingDepth)} × ${v.quantity} = ${fmt(cuFt)} ft³.`,
      ];
    } else {
      // Pier
      const pierCuFt = Math.PI * (v.pierDiameter / 24) ** 2 * v.pierDepth * (v.pierCount || 1);
      cuFt = pierCuFt;
      steps = [
        `Pier radius: ${fmt(v.pierDiameter / 2)} in = ${fmt(v.pierDiameter / 24)} ft.`,
        `Pier volume: π × ${fmt(v.pierDiameter / 24)}² × ${fmt(v.pierDepth)} × ${v.pierCount || 1} = ${fmt(cuFt)} ft³.`,
      ];
    }

    const total = cuFt * waste(v);
    const bags = roundUp(total / v.yield);
    const lb = total * densityLb(v.density, u.density);
    const rows: ResultRow[] = [
      row('order', 'Concrete to order', total / 27, 'yd³'),
      row('ft3', 'Order volume', total, 'ft³'),
      row('m3', 'Order volume', total / FT_PER_M ** 3, 'm³'),
      row('bags', 'Bags at entered yield', bags, 'bags', true),
      row('weight', 'Estimated order weight', lb, 'lb'),
    ];

    if (Number.isFinite(v.price)) {
      const qty = total / 27;
      const materials = qty * v.price;
      const taxAmt = materials * (v.tax / 100);
      const totalCost = materials + taxAmt + v.delivery + v.labor;
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

// =============================
// Exports
// =============================
export const materialModels: Record<string, Model> = {
  // --- 16 Concrete calculators ---
  'concrete': concreteGeneric,
  'concrete-volume': concreteVolume,
  'concrete-weight': concreteWeight,
  'concrete-cost': concreteCost,
  'concrete-mix': concreteMix,
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
  'slab-cost': slabCost,
  'patio-cost': patioCost,
  'driveway-cost': drivewayCost,
  'shed-foundation': shedFoundation,

  // --- Non-concrete models (unchanged) ---
  bulk,
  weight,
  depth,
  masonry,
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
  // --- 4 New material models (2025-09 batch) ---
  'cone-gravity-dam': {
    fields: [
      length('height', 'Dam height above foundation', 30, 'ft'),
      length('base', 'Base width', 70, 'ft'),
      length('crest', 'Crest width', 10, 'ft'),
      length('length', 'Dam crest length', 200, 'ft'),
      volume('head', 'Upslope head', 15, 'ft'),
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
      'Armor rock is modeled as a cone frustum; 10 % extra for placement voids (standard armor layer).',
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
