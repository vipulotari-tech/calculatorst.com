// Registry mapping slug patterns to correct calculations and waste defaults
// Pure factory - no side effects, testable in Node.

export type WasteDefaults = Record<string, number>;

export const wasteDefaults: WasteDefaults = {
  // Concrete cluster
  "concrete-calculator": 10,
  "concrete-volume-calculator": 10,
  "concrete-cost-calculator": 10,
  "concrete-pour-calculator": 10,
  "concrete-mix-calculator": 10,
  "concrete-weight-calculator": 5,
  "concrete-slab-calculator": 10,
  "concrete-footing-calculator": 10,
  "concrete-foundation-calculator": 10,
  "concrete-wall-calculator": 10,
  "concrete-column-calculator": 5, // Sonotube over-pour 5%
  "concrete-curb-calculator": 10,
  "concrete-stair-calculator": 10,
  "concrete-ramp-calculator": 10,
  "concrete-waste-calculator": 10,
  // Slab/Patio/Driveway
  "slab-thickness-calculator": 0,
  "slab-cost-calculator": 10,
  "slab-reinforcement-calculator": 5,
  "patio-concrete-calculator": 10,
  "patio-cost-calculator": 10,
  "driveway-concrete-calculator": 10,
  "driveway-cost-calculator": 10,
  "driveway-thickness-calculator": 0,
  "garage-slab-calculator": 10,
  "shed-foundation-calculator": 10,
  // Foundation
  "foundation-cost-calculator": 10,
  "foundation-excavation-calculator": 10,
  "strip-footing-calculator": 10,
  "pad-footing-calculator": 10,
  "pier-footing-calculator": 5,
  "footing-volume-calculator": 10,
  "footing-concrete-calculator": 10,
  "foundation-wall-calculator": 10,
  "basement-wall-calculator": 10,
  "crawl-space-calculator": 10,
  // Rebar
  "rebar-calculator": 5,
  "rebar-weight-calculator": 5,
  "rebar-spacing-calculator": 0,
  "rebar-length-calculator": 5,
  "rebar-quantity-calculator": 10,
  "rebar-cost-calculator": 5,
  "rebar-grid-calculator": 10,
  "rebar-lap-length-calculator": 0,
  "reinforcement-mesh-calculator": 10,
  "rebar-chair-calculator": 10,
  // Brick & Masonry
  "brick-calculator": 7,
  "brick-wall-calculator": 7,
  "brick-quantity-calculator": 7,
  "brick-cost-calculator": 7,
  "brick-mortar-calculator": 10,
  "brick-veneer-calculator": 7,
  "brick-patio-calculator": 7,
  "brick-paver-calculator": 7,
  "masonry-calculator": 7,
  "masonry-wall-calculator": 7,
  "masonry-cost-calculator": 7,
  "masonry-block-calculator": 5,
  "brick-weight-calculator": 5,
  "brick-waste-calculator": 7,
  "brick-joint-calculator": 0,
  // CMU
  "concrete-block-calculator": 5,
  "cmu-calculator": 5,
  "cmu-wall-calculator": 5,
  "cmu-quantity-calculator": 5,
  "cmu-cost-calculator": 5,
  "concrete-block-wall-calculator": 5,
  "concrete-block-weight-calculator": 5,
  "concrete-block-mortar-calculator": 10,
  "cmu-grout-calculator": 10,
  "cmu-reinforcement-calculator": 5,
  // Mortar & Cement
  "mortar-calculator": 10,
  "mortar-mix-calculator": 10,
  "mortar-quantity-calculator": 10,
  "mortar-cost-calculator": 10,
  "grout-calculator": 10,
  "grout-quantity-calculator": 10,
  "grout-cost-calculator": 10,
  "cement-calculator": 5,
  "cement-bag-calculator": 5,
  "cement-sand-ratio-calculator": 0,
  // Gravel
  "gravel-calculator": 10,
  "gravel-cost-calculator": 10,
  "gravel-weight-calculator": 5,
  "gravel-depth-calculator": 0,
  "crushed-stone-calculator": 10,
  "crushed-stone-cost-calculator": 10,
  "aggregate-calculator": 10,
  "aggregate-weight-calculator": 5,
  "sand-calculator": 10,
  "sand-weight-calculator": 5,
  "sand-cost-calculator": 10,
  "fill-dirt-calculator": 10,
  "fill-dirt-cost-calculator": 10,
  "topsoil-calculator": 10,
  "topsoil-cost-calculator": 10,
  // Excavation
  "excavation-calculator": 10,
  "excavation-cost-calculator": 10,
  "trench-calculator": 10,
  "trench-volume-calculator": 10,
  "trench-backfill-calculator": 10,
  "earthwork-calculator": 10,
  "cut-and-fill-calculator": 0,
  "dirt-removal-calculator": 10,
  "soil-volume-calculator": 10,
  "soil-weight-calculator": 5,
  // Framing
  "framing-calculator": 10,
  "wall-framing-calculator": 10,
  "stud-calculator": 10,
  "stud-spacing-calculator": 0,
  "lumber-calculator": 10,
  "lumber-cost-calculator": 10,
  "board-foot-calculator": 10,
  "board-foot-cost-calculator": 10,
  "joist-calculator": 10,
  "joist-spacing-calculator": 0,
  "floor-joist-calculator": 10,
  "ceiling-joist-calculator": 10,
  "header-size-calculator": 0,
  "beam-calculator": 10,
  "beam-load-calculator": 0,
  // Roofing
  "roofing-calculator": 10,
  "roof-area-calculator": 10,
  "roof-pitch-calculator": 0,
  "roof-slope-calculator": 0,
  "roofing-shingle-calculator": 15,
  "shingle-quantity-calculator": 15,
  "shingle-cost-calculator": 15,
  "roofing-material-calculator": 10,
  "roofing-underlayment-calculator": 10,
  "roof-sheathing-calculator": 10,
  "roof-rafter-calculator": 10,
  "rafter-length-calculator": 0,
  "roof-truss-calculator": 10,
  "roof-flashing-calculator": 10,
  "roof-waste-calculator": 10,
  // Flooring
  "flooring-calculator": 10,
  "flooring-cost-calculator": 10,
  "hardwood-flooring-calculator": 10,
  "hardwood-flooring-cost-calculator": 10,
  "laminate-flooring-calculator": 10,
  "vinyl-flooring-calculator": 10,
  "carpet-calculator": 10,
  "carpet-cost-calculator": 10,
  "tile-calculator": 10,
  "tile-quantity-calculator": 10,
  "tile-cost-calculator": 10,
  "tile-grout-calculator": 10,
  "tile-adhesive-calculator": 10,
  "flooring-waste-calculator": 10,
  "underlayment-calculator": 10,
  // Drywall & Paint
  "drywall-calculator": 10,
  "drywall-sheet-calculator": 10,
  "drywall-cost-calculator": 10,
  "drywall-joint-compound-calculator": 10,
  "drywall-screw-calculator": 10,
  "drywall-tape-calculator": 10,
  "paint-calculator": 10,
  "paint-coverage-calculator": 0,
  "paint-cost-calculator": 10,
  "primer-calculator": 10,
  "ceiling-paint-calculator": 10,
  "wall-paint-calculator": 10,
  "insulation-calculator": 10,
  "insulation-cost-calculator": 10,
  "spray-foam-calculator": 5,
  // Deck & Fence
  "deck-calculator": 10,
  "deck-cost-calculator": 10,
  "deck-board-calculator": 10,
  "deck-joist-calculator": 10,
  "deck-footing-calculator": 10,
  "deck-stair-calculator": 10,
  "deck-railing-calculator": 10,
  "fence-calculator": 10,
  "fence-cost-calculator": 10,
  "fence-post-calculator": 10,
  "fence-panel-calculator": 10,
  "fence-picket-calculator": 10,
  "fence-concrete-calculator": 10,
  "gate-calculator": 10,
  "gate-cost-calculator": 10,
  // Landscaping
  "paver-calculator": 10,
  "paver-cost-calculator": 10,
  "paver-sand-calculator": 10,
  "paver-base-calculator": 10,
  "paver-joint-sand-calculator": 10,
  "landscaping-calculator": 10,
  "landscaping-cost-calculator": 10,
  "mulch-calculator": 10,
  "mulch-cost-calculator": 10,
  "retaining-wall-calculator": 10,
  // Asphalt
  "asphalt-calculator": 5,
  "asphalt-cost-calculator": 5,
  "asphalt-driveway-calculator": 5,
  "asphalt-weight-calculator": 5,
  "asphalt-thickness-calculator": 0,
  "parking-lot-calculator": 5,
  "parking-lot-cost-calculator": 5,
  "road-base-calculator": 10,
  "surface-area-calculator": 0,
  "construction-material-cost-calculator": 5,
};

export function getWasteDefault(slug: string): number {
  return wasteDefaults[slug] ?? 10;
}

// Categorization for correct formula dispatch
export type CalcCategory =
  | "concrete-rect"
  | "concrete-column"
  | "concrete-curb"
  | "concrete-stair"
  | "concrete-ramp"
  | "brick"
  | "cmu"
  | "mortar"
  | "gravel"
  | "gravel-weight"
  | "gravel-depth"
  | "excavation"
  | "rebar"
  | "rebar-weight"
  | "rebar-grid"
  | "rebar-lap"
  | "roof-pitch"
  | "roof-area"
  | "roof-rafter"
  | "shingle"
  | "flooring-tile"
  | "flooring-area"
  | "paint"
  | "drywall"
  | "insulation"
  | "framing"
  | "deck"
  | "fence"
  | "paver"
  | "mulch"
  | "asphalt"
  | "generic-volume"
  | "generic-area"
  | "generic-quantity";

export function getCalcCategory(slug: string): CalcCategory {
  if (slug === "concrete-column-calculator") return "concrete-column";
  if (slug === "concrete-curb-calculator") return "concrete-curb";
  if (slug === "concrete-stair-calculator") return "concrete-stair";
  if (slug === "concrete-ramp-calculator") return "concrete-ramp";
  if (slug.includes("brick") || slug.includes("masonry") || slug.includes("cmu") || slug.includes("concrete-block")) {
    if (slug.includes("weight")) return "brick"; // weight still via count, but category brick
    if (slug.includes("mortar") || slug.includes("grout")) return "mortar";
    return "brick";
  }
  if (slug.includes("rebar") || slug.includes("reinforcement-mesh") || slug.includes("rebar-chair")) {
    if (slug.includes("weight")) return "rebar-weight";
    if (slug.includes("grid")) return "rebar-grid";
    if (slug.includes("lap")) return "rebar-lap";
    return "rebar";
  }
  if (slug.includes("gravel") || slug.includes("crushed") || slug.includes("aggregate") || slug.includes("sand") || slug.includes("topsoil") || slug.includes("fill-dirt")) {
    if (slug.includes("weight")) return "gravel-weight";
    if (slug.includes("depth")) return "gravel-depth";
    return "gravel";
  }
  if (slug.includes("trench") || slug.includes("excavation") || slug.includes("earthwork") || slug.includes("soil") || slug.includes("dirt") || slug.includes("cut-and-fill")) return "excavation";
  if (slug.includes("roof") || slug.includes("rafter") || slug.includes("truss") || slug.includes("shingle") || slug.includes("pitch") || slug.includes("slope")) {
    if (slug.includes("pitch") || slug.includes("slope")) return "roof-pitch";
    if (slug.includes("rafter")) return "roof-rafter";
    if (slug.includes("shingle") || slug.includes("roof-waste")) return "shingle";
    return "roof-area";
  }
  if (slug.includes("tile") || slug.includes("flooring") || slug.includes("hardwood") || slug.includes("laminate") || slug.includes("vinyl") || slug.includes("carpet") || slug.includes("underlayment")) {
    if (slug.includes("tile")) return "flooring-tile";
    return "flooring-area";
  }
  if (slug.includes("paint") || slug.includes("primer") || slug.includes("ceiling-paint") || slug.includes("wall-paint")) return "paint";
  if (slug.includes("drywall") || slug.includes("joint-compound") || slug.includes("screw") || slug.includes("tape")) return "drywall";
  if (slug.includes("insulation") || slug.includes("spray-foam")) return "insulation";
  if (slug.includes("stud") || slug.includes("framing") || slug.includes("lumber") || slug.includes("board-foot") || slug.includes("joist") || slug.includes("beam") || slug.includes("header")) return "framing";
  if (slug.includes("deck") ) return "deck";
  if (slug.includes("fence") || slug.includes("gate") || slug.includes("picket") || slug.includes("panel") || slug.includes("post")) return "fence";
  if (slug.includes("paver") || slug.includes("retaining-wall")) return "paver";
  if (slug.includes("mulch") || slug.includes("landscaping")) return "mulch";
  if (slug.includes("asphalt") || slug.includes("road-base") || slug.includes("parking") || slug.includes("surface-area")) return "asphalt";
  // concrete rect fallback must be after more specific checks
  if (slug.includes("concrete") || slug.includes("slab") || slug.includes("patio") || slug.includes("driveway") || slug.includes("garage") || slug.includes("shed") || slug.includes("foundation") || slug.includes("footing") || slug.includes("strip") || slug.includes("pad") || slug.includes("pier") || slug.includes("foundation-wall") || slug.includes("basement") || slug.includes("crawl")) return "concrete-rect";
  // generic fallbacks
  if (slug.includes("quantity") || slug.includes("amount")) return "generic-quantity";
  if (slug.includes("area") || slug.includes("square")) return "generic-area";
  return "generic-volume";
}
