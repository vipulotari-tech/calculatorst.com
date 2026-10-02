import type { CalculatorMeta } from './calculators';

// Dedicated Astro calculator pages that use their own components, rather than
// the generic model registry. Include them in discovery without generating a
// second route or requiring a generic calculation model.
export const supplementalCalculators: CalculatorMeta[] = [
  {
    slug: 'deck-material-calculator',
    title: 'Deck Material Calculator — Boards, Joists & Cost',
    h1: 'Deck Material Calculator',
    description: 'Estimate deck board rows, stock boards, linear feet, joists, fasteners and board cost from deck dimensions, board size, gap and specified joist spacing.',
    category: 'Deck & Fence',
    cluster: 'deck-fence',
    iconPath: 'M3 5h10M3 8h10M3 11h10',
    keywords: ['deck material calculator', 'deck boards and fasteners', 'deck material takeoff'],
  },
  {
    slug: 'driveway-gravel-calculator',
    title: 'Driveway Gravel Calculator — Layers, Tons, Truckloads & Cost',
    h1: 'Driveway Gravel Calculator',
    description: 'Plan driveway gravel by layer with separate depths, densities, compaction and waste. Get cubic yards, tons, truckloads and cost for base and surface materials.',
    category: 'Gravel & Aggregate',
    cluster: 'gravel',
    iconPath: 'M4 10l4-6 4 6H4ZM8 4v8',
    keywords: ['driveway gravel calculator', 'gravel driveway layers', 'driveway gravel tons', 'gravel driveway truckloads'],
  },
  {
    slug: 'pea-gravel-calculator',
    title: 'Pea Gravel Calculator — Yards, Tons & Cost',
    h1: 'Pea Gravel Calculator',
    description: 'Calculate pea gravel yards, short tons, pounds and quoted material cost from length, width and depth with waste and a fixed 1.35-ton-per-yard density.',
    category: 'Gravel & Aggregate',
    cluster: 'gravel',
    iconPath: 'M4 10l4-6 4 6H4ZM8 4v8',
    keywords: ['pea gravel calculator', 'pea gravel yards tons', 'pea gravel patio quantity'],
  },
  {
    slug: 'roof-square-footage-calculator',
    title: 'Roof Square Footage Calculator — Area & Roofing Squares',
    h1: 'Roof Square Footage Calculator',
    description: 'Calculate roof footprint, sloped square footage and roofing squares from building dimensions, pitch, overhang and identical sections, with waste allowance.',
    category: 'Roofing',
    cluster: 'roofing',
    iconPath: 'M3 12.5l9-9M3 12.5h9v-9',
    keywords: ['roof square footage calculator', 'roof square feet calculator', 'roofing squares calculator'],
  },
];
