#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const calculators200 = [
  // 1. Concrete 15
  "Concrete Calculator","Concrete Volume Calculator","Concrete Cost Calculator","Concrete Pour Calculator","Concrete Mix Calculator","Concrete Weight Calculator","Concrete Slab Calculator","Concrete Footing Calculator","Concrete Foundation Calculator","Concrete Wall Calculator","Concrete Column Calculator","Concrete Curb Calculator","Concrete Stair Calculator","Concrete Ramp Calculator","Concrete Waste Calculator",
  // 2. Slab/Patio/Driveway 10
  "Slab Thickness Calculator","Slab Cost Calculator","Slab Reinforcement Calculator","Patio Concrete Calculator","Patio Cost Calculator","Driveway Concrete Calculator","Driveway Cost Calculator","Driveway Thickness Calculator","Garage Slab Calculator","Shed Foundation Calculator",
  // 3. Foundation 10
  "Foundation Cost Calculator","Foundation Excavation Calculator","Strip Footing Calculator","Pad Footing Calculator","Pier Footing Calculator","Footing Volume Calculator","Footing Concrete Calculator","Foundation Wall Calculator","Basement Wall Calculator","Crawl Space Calculator",
  // 4. Rebar 10
  "Rebar Calculator","Rebar Weight Calculator","Rebar Spacing Calculator","Rebar Length Calculator","Rebar Quantity Calculator","Rebar Cost Calculator","Rebar Grid Calculator","Rebar Lap Length Calculator","Reinforcement Mesh Calculator","Rebar Chair Calculator",
  // 5. Brick 15
  "Brick Calculator","Brick Wall Calculator","Brick Quantity Calculator","Brick Cost Calculator","Brick Mortar Calculator","Brick Veneer Calculator","Brick Patio Calculator","Brick Paver Calculator","Masonry Calculator","Masonry Wall Calculator","Masonry Cost Calculator","Masonry Block Calculator","Brick Weight Calculator","Brick Waste Calculator","Brick Joint Calculator",
  // 6. CMU 10
  "Concrete Block Calculator","CMU Calculator","CMU Wall Calculator","CMU Quantity Calculator","CMU Cost Calculator","Concrete Block Wall Calculator","Concrete Block Weight Calculator","Concrete Block Mortar Calculator","CMU Grout Calculator","CMU Reinforcement Calculator",
  // 7. Mortar 10
  "Mortar Calculator","Mortar Mix Calculator","Mortar Quantity Calculator","Mortar Cost Calculator","Grout Calculator","Grout Quantity Calculator","Grout Cost Calculator","Cement Calculator","Cement Bag Calculator","Cement Sand Ratio Calculator",
  // 8. Gravel 15
  "Gravel Calculator","Gravel Cost Calculator","Gravel Weight Calculator","Gravel Depth Calculator","Crushed Stone Calculator","Crushed Stone Cost Calculator","Aggregate Calculator","Aggregate Weight Calculator","Sand Calculator","Sand Weight Calculator","Sand Cost Calculator","Fill Dirt Calculator","Fill Dirt Cost Calculator","Topsoil Calculator","Topsoil Cost Calculator",
  // 9. Excavation 10
  "Excavation Calculator","Excavation Cost Calculator","Trench Calculator","Trench Volume Calculator","Trench Backfill Calculator","Earthwork Calculator","Cut and Fill Calculator","Dirt Removal Calculator","Soil Volume Calculator","Soil Weight Calculator",
  // 10. Framing 15
  "Framing Calculator","Wall Framing Calculator","Stud Calculator","Stud Spacing Calculator","Lumber Calculator","Lumber Cost Calculator","Board Foot Calculator","Board Foot Cost Calculator","Joist Calculator","Joist Spacing Calculator","Floor Joist Calculator","Ceiling Joist Calculator","Header Size Calculator","Beam Calculator","Beam Load Calculator",
  // 11. Roofing 15
  "Roofing Calculator","Roof Area Calculator","Roof Pitch Calculator","Roof Slope Calculator","Roofing Shingle Calculator","Shingle Quantity Calculator","Shingle Cost Calculator","Roofing Material Calculator","Roofing Underlayment Calculator","Roof Sheathing Calculator","Roof Rafter Calculator","Rafter Length Calculator","Roof Truss Calculator","Roof Flashing Calculator","Roof Waste Calculator",
  // 12. Flooring 15
  "Flooring Calculator","Flooring Cost Calculator","Hardwood Flooring Calculator","Hardwood Flooring Cost Calculator","Laminate Flooring Calculator","Vinyl Flooring Calculator","Carpet Calculator","Carpet Cost Calculator","Tile Calculator","Tile Quantity Calculator","Tile Cost Calculator","Tile Grout Calculator","Tile Adhesive Calculator","Flooring Waste Calculator","Underlayment Calculator",
  // 13. Drywall 15
  "Drywall Calculator","Drywall Sheet Calculator","Drywall Cost Calculator","Drywall Joint Compound Calculator","Drywall Screw Calculator","Drywall Tape Calculator","Paint Calculator","Paint Coverage Calculator","Paint Cost Calculator","Primer Calculator","Ceiling Paint Calculator","Wall Paint Calculator","Insulation Calculator","Insulation Cost Calculator","Spray Foam Calculator",
  // 14. Deck/Fence 15
  "Deck Calculator","Deck Cost Calculator","Deck Board Calculator","Deck Joist Calculator","Deck Footing Calculator","Deck Stair Calculator","Deck Railing Calculator","Fence Calculator","Fence Cost Calculator","Fence Post Calculator","Fence Panel Calculator","Fence Picket Calculator","Fence Concrete Calculator","Gate Calculator","Gate Cost Calculator",
  // 15. Paver 10
  "Paver Calculator","Paver Cost Calculator","Paver Sand Calculator","Paver Base Calculator","Paver Joint Sand Calculator","Landscaping Calculator","Landscaping Cost Calculator","Mulch Calculator","Mulch Cost Calculator","Retaining Wall Calculator",
  // 16. Asphalt 10
  "Asphalt Calculator","Asphalt Cost Calculator","Asphalt Driveway Calculator","Asphalt Weight Calculator","Asphalt Thickness Calculator","Parking Lot Calculator","Parking Lot Cost Calculator","Road Base Calculator","Surface Area Calculator","Construction Material Cost Calculator",
];

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

function toCategory(name, index) {
  if (index < 15) return { category: "Concrete", cluster: "concrete", icon: "concrete" };
  if (index < 25) return { category: "Slab & Patio", cluster: "slab", icon: "concrete" };
  if (index < 35) return { category: "Foundation", cluster: "foundation", icon: "concrete" };
  if (index < 45) return { category: "Rebar", cluster: "rebar", icon: "rebar" };
  if (index < 60) return { category: "Brick & Masonry", cluster: "brick", icon: "brick" };
  if (index < 70) return { category: "Concrete Block", cluster: "cmu", icon: "block" };
  if (index < 80) return { category: "Mortar & Cement", cluster: "mortar", icon: "mortar" };
  if (index < 95) return { category: "Gravel & Aggregate", cluster: "gravel", icon: "gravel" };
  if (index < 105) return { category: "Excavation", cluster: "excavation", icon: "excavation" };
  if (index < 120) return { category: "Framing & Lumber", cluster: "framing", icon: "framing" };
  if (index < 135) return { category: "Roofing", cluster: "roofing", icon: "roof" };
  if (index < 150) return { category: "Flooring & Tile", cluster: "flooring", icon: "flooring" };
  if (index < 165) return { category: "Drywall & Paint", cluster: "drywall", icon: "drywall" };
  if (index < 180) return { category: "Deck & Fence", cluster: "deck-fence", icon: "deck" };
  if (index < 190) return { category: "Paver & Landscaping", cluster: "landscaping", icon: "landscape" };
  return { category: "Asphalt & Surface", cluster: "asphalt", icon: "asphalt" };
}

function genDescription(name) {
  const map = {
    "Concrete Calculator": "Calculate concrete volume, weight and cost for any slab, footing or wall. Supports cubic yards, bags and ready-mix.",
    "Gravel Calculator": "Calculate gravel in cubic yards, tons and cost for any rectangular area. Supports pea gravel, crushed stone and more with US & metric units.",
  };
  if (map[name]) return map[name];
  const base = name.replace(' Calculator','');
  return `Free ${name.toLowerCase()} for US construction — estimate ${base.toLowerCase()} quantity, material and cost with waste, US customary and metric units.`;
}

function genTitle(name) {
  const suffixes = {
    "Concrete Calculator": "Volume, Weight & Cost",
    "Gravel Calculator": "Cubic Yards, Tons & Cost",
    "Rebar Calculator": "Quantity, Weight & Cost",
    "Brick Calculator": "Quantity, Mortar & Cost",
  };
  if (suffixes[name]) return `${name} — ${suffixes[name]}`;
  return `${name} — Material, Quantity & Cost`;
}

const out = calculators200.map((name, i) => {
  const slug = toSlug(name);
  const cat = toCategory(name, i);
  return {
    slug,
    title: genTitle(name),
    h1: name,
    description: genDescription(name),
    category: cat.category,
    cluster: cat.cluster,
    iconPath: "M4 10l4-6 4 6H4ZM8 4v8",
    keywords: [name.toLowerCase(), slug.replace(/-/g,' ')],
    featured: i < 10,
  };
});

// Write hub file
const header = `// Auto-generated 200 Construction Calculators — DO NOT EDIT MANUALLY
// Generated by scripts/generate-200.mjs
import type { CalculatorMeta } from "./calculators";

export const hubCalculators: (CalculatorMeta & { cluster: string; category: string })[] = ${JSON.stringify(out, null, 2)};

export const hubCategories = [
  { name: "Concrete Calculators", slug: "concrete", desc: "Slabs, footings, walls, columns and waste", count: 15 },
  { name: "Slab, Patio & Driveway", slug: "slab-patio-driveway", desc: "Thickness, cost, reinforcement and garage/shed pads", count: 10 },
  { name: "Foundation & Footing", slug: "foundation", desc: "Strip, pad, pier, excavation and basement walls", count: 10 },
  { name: "Rebar & Reinforcement", slug: "rebar", desc: "Weight, spacing, laps, grids and chairs", count: 10 },
  { name: "Brick & Masonry", slug: "brick-masonry", desc: "Quantity, mortar, veneer and joint", count: 15 },
  { name: "Concrete Block & CMU", slug: "concrete-block", desc: "CMU walls, grout and reinforcement", count: 10 },
  { name: "Mortar, Grout & Cement", slug: "mortar-grout-cement", desc: "Mix ratios, bags and sand ratios", count: 10 },
  { name: "Gravel, Aggregate & Dirt", slug: "gravel", desc: "Gravel, crushed stone, sand, topsoil and fill dirt", count: 15 },
  { name: "Excavation & Earthwork", slug: "excavation", desc: "Trenches, cut/fill and soil volume", count: 10 },
  { name: "Framing & Lumber", slug: "framing", desc: "Studs, joists, beams and board feet", count: 15 },
  { name: "Roofing Calculators", slug: "roofing", desc: "Area, pitch, shingles, rafters and sheathing", count: 15 },
  { name: "Flooring & Tile", slug: "flooring", desc: "Hardwood, laminate, vinyl, carpet and tile", count: 15 },
  { name: "Drywall, Paint & Insulation", slug: "drywall-paint", desc: "Sheets, screws, paint coverage and spray foam", count: 15 },
  { name: "Deck, Fence & Outdoor", slug: "deck-fence", desc: "Boards, joists, posts, panels and gates", count: 15 },
  { name: "Paver & Landscaping", slug: "landscaping", desc: "Pavers, base, sand and retaining walls", count: 10 },
  { name: "Asphalt & Surface", slug: "asphalt", desc: "Driveways, parking lots, road base and surface area", count: 10 },
];
`;

fs.writeFileSync(path.join('src/data/hubCalculators.ts'), header);
console.log(`Generated hubCalculators.ts with ${out.length} entries`);

// Also generate slugs list for verification
fs.writeFileSync('scripts/200-slugs.txt', out.map(o=>o.slug).join('\n'));
console.log('Wrote 200-slugs.txt');
