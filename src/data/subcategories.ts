// Subcategories derived from actual 200 calculator inventory — single source of truth
// Each cluster's calculators grouped into meaningful project groups

export const clusterGroups: Record<string, { name: string; slugs: string[] }[]> = {
  concrete: [
    { name: "General & Volume", slugs: ["concrete-calculator","concrete-volume-calculator","concrete-weight-calculator"] },
    { name: "Cost & Mix", slugs: ["concrete-cost-calculator","concrete-mix-calculator","concrete-pour-calculator"] },
    { name: "Footings & Foundations", slugs: ["concrete-footing-calculator","concrete-foundation-calculator","concrete-slab-calculator"] },
    { name: "Walls & Structures", slugs: ["concrete-wall-calculator","concrete-column-calculator","concrete-curb-calculator","concrete-stair-calculator","concrete-ramp-calculator"] },
    { name: "Waste", slugs: ["concrete-waste-calculator"] },
  ],
  slab: [
    { name: "Slab Core", slugs: ["slab-thickness-calculator","slab-cost-calculator","slab-reinforcement-calculator"] },
    { name: "Patio", slugs: ["patio-concrete-calculator","patio-cost-calculator"] },
    { name: "Driveway & Garage", slugs: ["driveway-concrete-calculator","driveway-cost-calculator","driveway-thickness-calculator","garage-slab-calculator"] },
    { name: "Foundations", slugs: ["shed-foundation-calculator"] },
  ],
  foundation: [
    { name: "Costs & Excavation", slugs: ["foundation-cost-calculator","foundation-excavation-calculator"] },
    { name: "Footings", slugs: ["strip-footing-calculator","pad-footing-calculator","pier-footing-calculator","footing-volume-calculator","footing-concrete-calculator"] },
    { name: "Walls & Spaces", slugs: ["foundation-wall-calculator","basement-wall-calculator","crawl-space-calculator"] },
  ],
  rebar: [
    { name: "Core", slugs: ["rebar-calculator","rebar-weight-calculator","rebar-quantity-calculator","rebar-cost-calculator"] },
    { name: "Spacing & Length", slugs: ["rebar-spacing-calculator","rebar-length-calculator","rebar-grid-calculator","rebar-lap-length-calculator"] },
    { name: "Accessories", slugs: ["reinforcement-mesh-calculator","rebar-chair-calculator"] },
  ],
  brick: [
    { name: "Brick Core", slugs: ["brick-calculator","brick-quantity-calculator","brick-cost-calculator","brick-weight-calculator","brick-waste-calculator"] },
    { name: "Walls", slugs: ["brick-wall-calculator","masonry-calculator","masonry-wall-calculator","masonry-cost-calculator","masonry-block-calculator"] },
    { name: "Specialty", slugs: ["brick-mortar-calculator","brick-veneer-calculator","brick-patio-calculator","brick-paver-calculator","brick-joint-calculator"] },
  ],
  cmu: [
    { name: "Block Core", slugs: ["concrete-block-calculator","concrete-block-wall-calculator","concrete-block-weight-calculator","concrete-block-mortar-calculator"] },
    { name: "CMU", slugs: ["cmu-calculator","cmu-wall-calculator","cmu-quantity-calculator","cmu-cost-calculator"] },
    { name: "Reinforcement", slugs: ["cmu-grout-calculator","cmu-reinforcement-calculator"] },
  ],
  mortar: [
    { name: "Mortar", slugs: ["mortar-calculator","mortar-mix-calculator","mortar-quantity-calculator","mortar-cost-calculator"] },
    { name: "Grout", slugs: ["grout-calculator","grout-quantity-calculator","grout-cost-calculator"] },
    { name: "Cement", slugs: ["cement-calculator","cement-bag-calculator","cement-sand-ratio-calculator"] },
  ],
  gravel: [
    { name: "Gravel", slugs: ["gravel-calculator","gravel-cost-calculator","gravel-weight-calculator","gravel-depth-calculator"] },
    { name: "Stone & Aggregate", slugs: ["crushed-stone-calculator","crushed-stone-cost-calculator","aggregate-calculator","aggregate-weight-calculator"] },
    { name: "Sand, Dirt & Topsoil", slugs: ["sand-calculator","sand-weight-calculator","sand-cost-calculator","fill-dirt-calculator","fill-dirt-cost-calculator","topsoil-calculator","topsoil-cost-calculator"] },
  ],
  excavation: [
    { name: "Excavation", slugs: ["excavation-calculator","excavation-cost-calculator"] },
    { name: "Trench", slugs: ["trench-calculator","trench-volume-calculator","trench-backfill-calculator"] },
    { name: "Earthwork", slugs: ["earthwork-calculator","cut-and-fill-calculator","dirt-removal-calculator","soil-volume-calculator","soil-weight-calculator"] },
  ],
  framing: [
    { name: "Framing & Studs", slugs: ["framing-calculator","wall-framing-calculator","stud-calculator","stud-spacing-calculator"] },
    { name: "Lumber", slugs: ["lumber-calculator","lumber-cost-calculator","board-foot-calculator","board-foot-cost-calculator"] },
    { name: "Joists & Beams", slugs: ["joist-calculator","joist-spacing-calculator","floor-joist-calculator","ceiling-joist-calculator","header-size-calculator","beam-calculator","beam-load-calculator"] },
  ],
  roofing: [
    { name: "Roof Core", slugs: ["roofing-calculator","roof-area-calculator","roof-pitch-calculator","roof-slope-calculator"] },
    { name: "Shingles & Materials", slugs: ["roofing-shingle-calculator","shingle-quantity-calculator","shingle-cost-calculator","roofing-material-calculator","roofing-underlayment-calculator","roof-sheathing-calculator","roof-waste-calculator"] },
    { name: "Structure", slugs: ["roof-rafter-calculator","rafter-length-calculator","roof-truss-calculator","roof-flashing-calculator"] },
  ],
  flooring: [
    { name: "General", slugs: ["flooring-calculator","flooring-cost-calculator","flooring-waste-calculator","underlayment-calculator"] },
    { name: "Hardwood & Laminate", slugs: ["hardwood-flooring-calculator","hardwood-flooring-cost-calculator","laminate-flooring-calculator","vinyl-flooring-calculator"] },
    { name: "Carpet", slugs: ["carpet-calculator","carpet-cost-calculator"] },
    { name: "Tile", slugs: ["tile-calculator","tile-quantity-calculator","tile-cost-calculator","tile-grout-calculator","tile-adhesive-calculator"] },
  ],
  drywall: [
    { name: "Drywall", slugs: ["drywall-calculator","drywall-sheet-calculator","drywall-cost-calculator","drywall-joint-compound-calculator","drywall-screw-calculator","drywall-tape-calculator"] },
    { name: "Paint", slugs: ["paint-calculator","paint-coverage-calculator","paint-cost-calculator","primer-calculator","ceiling-paint-calculator","wall-paint-calculator"] },
    { name: "Insulation", slugs: ["insulation-calculator","insulation-cost-calculator","spray-foam-calculator"] },
  ],
  "deck-fence": [
    { name: "Deck", slugs: ["deck-calculator","deck-cost-calculator","deck-board-calculator","deck-joist-calculator","deck-footing-calculator","deck-stair-calculator","deck-railing-calculator"] },
    { name: "Fence", slugs: ["fence-calculator","fence-cost-calculator","fence-post-calculator","fence-panel-calculator","fence-picket-calculator","fence-concrete-calculator"] },
    { name: "Gates", slugs: ["gate-calculator","gate-cost-calculator"] },
  ],
  landscaping: [
    { name: "Pavers", slugs: ["paver-calculator","paver-cost-calculator","paver-sand-calculator","paver-base-calculator","paver-joint-sand-calculator"] },
    { name: "Landscaping", slugs: ["landscaping-calculator","landscaping-cost-calculator","retaining-wall-calculator"] },
    { name: "Mulch", slugs: ["mulch-calculator","mulch-cost-calculator"] },
  ],
  asphalt: [
    { name: "Asphalt", slugs: ["asphalt-calculator","asphalt-cost-calculator","asphalt-driveway-calculator","asphalt-weight-calculator","asphalt-thickness-calculator"] },
    { name: "Parking & Roads", slugs: ["parking-lot-calculator","parking-lot-cost-calculator","road-base-calculator","surface-area-calculator","construction-material-cost-calculator"] },
  ],
};

// Popular project groups — cross-category, intent based
export const projectGroups = [
  { name: "Concrete & Slabs", desc: "Volume, cost, walls and footings", slugs: ["concrete-calculator","concrete-slab-calculator","concrete-wall-calculator","garage-slab-calculator","patio-concrete-calculator"], cluster: "concrete" },
  { name: "Gravel & Dirt", desc: "Driveway gravel, crushed stone, sand & topsoil", slugs: ["gravel-calculator","driveway-gravel-calculator","crushed-stone-calculator","sand-calculator","topsoil-calculator"], cluster: "gravel" },
  { name: "Roofing", desc: "Pitch, area, shingles & rafters", slugs: ["roof-pitch-calculator","roof-area-calculator","roofing-shingle-calculator","rafter-length-calculator"], cluster: "roofing" },
  { name: "Fencing & Gates", desc: "Posts, panels, pickets & gates", slugs: ["fence-calculator","fence-post-calculator","fence-panel-calculator","gate-calculator"], cluster: "deck-fence" },
  { name: "Decking", desc: "Boards, joists, footings & stairs", slugs: ["deck-calculator","deck-board-calculator","deck-joist-calculator","deck-footing-calculator"], cluster: "deck-fence" },
  { name: "Flooring & Tile", desc: "Hardwood, tile, carpet & underlayment", slugs: ["flooring-calculator","tile-calculator","hardwood-flooring-calculator","carpet-calculator"], cluster: "flooring" },
  { name: "Paint & Drywall", desc: "Coverage, sheets, screws & insulation", slugs: ["paint-calculator","drywall-calculator","drywall-sheet-calculator","insulation-calculator"], cluster: "drywall" },
  { name: "Excavation", desc: "Trenches, cut/fill & soil", slugs: ["excavation-calculator","trench-calculator","earthwork-calculator","soil-volume-calculator"], cluster: "excavation" },
];
