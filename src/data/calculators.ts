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
    slug: "pea-gravel-calculator",
    title: "Pea Gravel Calculator — Yards, Tons & Cost",
    h1: "Pea Gravel Calculator",
    description: "Dedicated pea gravel calculator for patios, paths and landscaping. Get cubic yards, tons and estimated cost with waste.",
    category: "Gravel",
    cluster: "gravel",
    iconPath: "M8 3.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM8 9.5v3M6.5 12.5h3",
    featured: true,
    keywords: ["pea gravel calculator"],
  },
  {
    slug: "driveway-gravel-calculator",
    title: "Driveway Gravel Calculator — Volume & Cost",
    h1: "Driveway Gravel Calculator",
    description: "Estimate gravel for driveways by length, width, depth and layers. Results in cubic yards, tons and cost.",
    category: "Gravel",
    cluster: "gravel",
    iconPath: "M3.5 12.5h9M5 9l1.5-3h3L11 9M5 9h6M8 6v3",
    featured: true,
    keywords: ["driveway gravel calculator"],
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
    slug: "roof-square-footage-calculator",
    title: "Roof Square Footage Calculator — Area & Squares",
    h1: "Roof Square Footage Calculator",
    description: "Calculate roof square footage and roofing squares from building size, pitch and overhang with waste.",
    category: "Roofing",
    cluster: "roofing",
    iconPath: "M4 9l4-5 4 5M4 9h8v3H4z",
    featured: true,
    keywords: ["roof square footage calculator"],
  },
  {
    slug: "deck-material-calculator",
    title: "Deck Material Calculator — Boards, Joists & Cost",
    h1: "Deck Material Calculator",
    description: "Estimate deck boards, joists, fasteners and cost from deck size, board size and spacing with waste.",
    category: "Deck",
    cluster: "deck",
    iconPath: "M3 8c2-2 4-2 5 0s3 2 5 0M3 11c2-2 4-2 5 0s3 2 5 0",
    featured: true,
    keywords: ["deck material calculator", "deck board calculator"],
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
  { name: "Gravel Calculators", slug: "gravel", desc: "Crushed stone, pea gravel and driveway estimates", icon: "gravel" },
  { name: "Concrete Calculators", slug: "concrete", desc: "Slabs, driveways, footings and bags", icon: "concrete" },
  { name: "Fence Calculators", slug: "fencing", desc: "Posts, panels, gates and cost", icon: "fence" },
  { name: "Roofing Calculators", slug: "roofing", desc: "Pitch, area and shingles", icon: "roof" },
  { name: "Deck Calculators", slug: "decking", desc: "Boards, joists and cost", icon: "deck" },
  { name: "Landscaping Calculators", slug: "landscaping", desc: "Pavers, mulch, topsoil and sod", icon: "landscape" },
];
