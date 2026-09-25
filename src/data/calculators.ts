export interface CalculatorMeta {
  slug: string; // e.g. gravel-calculator
  title: string;
  h1: string;
  description: string;
  category: string;
  cluster: string;
  iconPath: string;
  featured?: boolean;
  keywords: string[];
}

export const calculators: CalculatorMeta[] = [
  {
    slug: "gravel-calculator",
    title: "Gravel Calculator — Yards, Tons, Metric Volume & Cost",
    h1: "Gravel Calculator",
    description: "Calculate gravel from dimensions, known area or volume with density presets or custom density, separate compaction and waste allowances, metric/US outputs and optional cost.",
    category: "Gravel & Aggregate",
    cluster: "gravel",
    iconPath: "M4 10l4-6 4 6H4ZM8 4v8",
    featured: true,
    keywords: ["gravel calculator", "gravel yards and tons calculator", "how much gravel do i need"],
  },
  {
    slug: "fence-cost-calculator",
    title: "Fence Cost Calculator — Posts, Panels & Gates",
    h1: "Fence Cost Calculator",
    description: "Calculate fence posts, panels, rails, gate openings and concrete quantities, with waste allowance and optional material pricing.",
    category: "Fence",
    cluster: "deck-fence",
    iconPath: "M4 3.5v9M6 3.5v9M8 3.5v9M10 3.5v9M12 3.5v9M4 5h8M4 8h8",
    featured: true,
    keywords: ["fence cost calculator", "fence price calculator"],
  },
  {
    slug: "concrete-slab-calculator",
    title: "Concrete Slab Calculator — Yards, 40–80 lb Bags & Cost",
    h1: "Concrete Slab Calculator",
    description: "Calculate slab concrete from length, width and thickness in cubic feet and yards, with 40/50/60/80-lb bag counts, waste allowance, weight and optional cost.",
    category: "Concrete",
    cluster: "concrete",
    iconPath: "M3 8h10M3 11h10M3 5h10",
    featured: true,
    keywords: ["concrete slab calculator", "concrete slab yards calculator", "concrete slab bag calculator", "how much concrete for a slab"],
  },
  {
    slug: "roof-pitch-calculator",
    title: "Roof Pitch Calculator — Ratio, Angle & Slope",
    h1: "Roof Pitch Calculator",
    description: "Find roof pitch ratio, angle and slope from rise and run. Link to roof area and roofing squares.",
    category: "Roofing",
    cluster: "roofing",
    iconPath: "M3 12.5l9-9M3 12.5h9v-9",
    featured: true,
    keywords: ["roof pitch calculator"],
  },
  {
    slug: "paver-calculator",
    title: "Paver Calculator — Pavers, Base & Sand",
    h1: "Paver Calculator",
    description: "Calculate pavers needed for patios and walkways plus base gravel and sand. US & metric units.",
    category: "Landscaping",
    cluster: "landscaping",
    iconPath: "M4 4h5v5H4zM9 4h3v5H9zM4 9h3v3H4zM7 9h5v3H7z",
    featured: true,
    keywords: ["paver calculator"],
  },
  {
    slug: "mulch-calculator",
    title: "Mulch Calculator — Cubic Yards & Bags",
    h1: "Mulch Calculator",
    description: "Calculate mulch in cubic yards and bags for beds and paths. Supports multiple areas and waste.",
    category: "Landscaping",
    cluster: "landscaping",
    iconPath: "M4 12.5h8M5 9h8M6 6h6",
    featured: true,
    keywords: ["mulch calculator"],
  },
];

export function getCalculator(slug: string) {
  return calculators.find((c) => c.slug === slug);
}

export const categories = [
  { name: "Gravel Calculators", slug: "gravel", desc: "Crushed stone, pea gravel and driveway estimates" },
  { name: "Concrete Calculators", slug: "concrete", desc: "Slabs, footings, walls and bags" },
  { name: "Roofing Calculators", slug: "roofing", desc: "Pitch, area and shingles" },
  { name: "Deck & Fence Calculators", slug: "deck-fence", desc: "Deck boards, joists, fence posts, panels and cost" },
  { name: "Landscaping Calculators", slug: "landscaping", desc: "Pavers, mulch and topsoil" },
];
