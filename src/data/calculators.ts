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
    title: "Gravel Calculator — Cubic Yards, Tons & Cost",
    h1: "Gravel Calculator",
    description: "Calculate gravel in cubic yards, tons and cost for any rectangular area. Supports pea gravel, crushed stone and more with US & metric units.",
    category: "Gravel",
    cluster: "gravel",
    iconPath: "M4 10l4-6 4 6H4ZM8 4v8",
    featured: true,
    keywords: ["gravel calculator", "gravel calculator yards", "gravel tons"],
  },
  {
    slug: "fence-cost-calculator",
    title: "Fence Cost Calculator — Materials & Cost Estimate",
    h1: "Fence Cost Calculator",
    description: "Estimate fence posts, panels, rails and cost for wood, vinyl or chain link. Includes gates, waste and concrete.",
    category: "Fence",
    cluster: "fence",
    iconPath: "M4 3.5v9M6 3.5v9M8 3.5v9M10 3.5v9M12 3.5v9M4 5h8M4 8h8",
    featured: true,
    keywords: ["fence cost calculator", "fence calculator"],
  },
  {
    slug: "concrete-slab-calculator",
    title: "Concrete Slab Calculator — Yards, Bags & Cost",
    h1: "Concrete Slab Calculator",
    description: "Calculate concrete for slabs in cubic yards and bags (40/60/80 lb). Includes waste and cost estimate.",
    category: "Concrete",
    cluster: "concrete",
    iconPath: "M3 8h10M3 11h10M3 5h10",
    featured: true,
    keywords: ["concrete slab calculator", "concrete calculator"],
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
  { name: "Deck Calculators", slug: "decking", desc: "Boards, joists and cost" },
  { name: "Landscaping Calculators", slug: "landscaping", desc: "Pavers, mulch and topsoil" },
];
