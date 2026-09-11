import type { Field, Model } from './calculator-types.ts';
import { allModels } from './calculator-models.ts';

export const slugToModelKey: Record<string, string> = {
  // 1. Concrete (15)
  "concrete-calculator": "concrete",
  "concrete-volume-calculator": "concrete",
  "concrete-cost-calculator": "concrete",
  "concrete-pour-calculator": "concrete",
  "concrete-mix-calculator": "mix",
  "concrete-weight-calculator": "weight",
  "concrete-slab-calculator": "concrete",
  "concrete-footing-calculator": "concrete",
  "concrete-foundation-calculator": "concrete",
  "concrete-wall-calculator": "wall",
  "concrete-column-calculator": "cylinder",
  "concrete-curb-calculator": "curb",
  "concrete-stair-calculator": "stairs",
  "concrete-ramp-calculator": "ramp",
  "concrete-tube-calculator": "tube",
  "concrete-waste-calculator": "waste",

  // 2. Slab & Patio (10)
  "slab-thickness-calculator": "depth",
  "slab-cost-calculator": "material-cost",
  "slab-reinforcement-calculator": "grid",
  "patio-concrete-calculator": "concrete",
  "patio-cost-calculator": "material-cost",
  "driveway-concrete-calculator": "concrete",
  "driveway-cost-calculator": "material-cost",
  "driveway-thickness-calculator": "depth",
  "garage-slab-calculator": "concrete",
  "shed-foundation-calculator": "concrete",

  // 3. Foundation (10)
  "foundation-cost-calculator": "material-cost",
  "foundation-excavation-calculator": "excavation",
  "strip-footing-calculator": "concrete",
  "pad-footing-calculator": "concrete",
  "pier-footing-calculator": "cylinder",
  "footing-volume-calculator": "concrete",
  "footing-concrete-calculator": "concrete",
  "foundation-wall-calculator": "wall",
  "basement-wall-calculator": "wall",
  "crawl-space-calculator": "wall",

  // 4. Rebar (10)
  "rebar-calculator": "grid",
  "rebar-weight-calculator": "bar-length",
  "rebar-spacing-calculator": "spacing",
  "rebar-length-calculator": "bar-length",
  "rebar-quantity-calculator": "bar-length",
  "rebar-cost-calculator": "bar-length",
  "rebar-grid-calculator": "grid",
  "rebar-lap-length-calculator": "lap",
  "reinforcement-mesh-calculator": "mesh",
  "rebar-chair-calculator": "chairs",

  // 5. Brick & Masonry (15)
  "brick-calculator": "masonry",
  "brick-wall-calculator": "masonry",
  "brick-quantity-calculator": "masonry",
  "brick-cost-calculator": "material-cost",
  "brick-mortar-calculator": "brick-mortar",
  "brick-veneer-calculator": "masonry",
  "brick-patio-calculator": "masonry",
  "brick-paver-calculator": "masonry",
  "masonry-calculator": "masonry",
  "masonry-wall-calculator": "masonry",
  "masonry-cost-calculator": "material-cost",
  "masonry-block-calculator": "masonry",
  "brick-weight-calculator": "weight",
  "brick-waste-calculator": "waste",
  "brick-joint-calculator": "brick-joint",

  // 6. CMU / Concrete Block (10)
  "concrete-block-calculator": "masonry",
  "cmu-calculator": "masonry",
  "cmu-wall-calculator": "masonry",
  "cmu-quantity-calculator": "masonry",
  "cmu-cost-calculator": "material-cost",
  "concrete-block-wall-calculator": "masonry",
  "concrete-block-weight-calculator": "weight",
  "concrete-block-mortar-calculator": "cmu-mortar",
  "cmu-grout-calculator": "cmu-grout",
  "cmu-reinforcement-calculator": "grid",

  // 7. Mortar & Cement (10)
  "mortar-calculator": "bags",
  "mortar-mix-calculator": "mix",
  "mortar-quantity-calculator": "bags",
  "mortar-cost-calculator": "material-cost",
  "grout-calculator": "bags",
  "grout-quantity-calculator": "bags",
  "grout-cost-calculator": "material-cost",
  "cement-calculator": "bags",
  "cement-bag-calculator": "bags",
  "cement-sand-ratio-calculator": "mix",

  // 8. Gravel & Aggregate (15)
  "gravel-calculator": "bulk",
  "gravel-cost-calculator": "bulk",
  "gravel-weight-calculator": "weight",
  "gravel-depth-calculator": "depth",
  "crushed-stone-calculator": "bulk",
  "crushed-stone-cost-calculator": "bulk",
  "aggregate-calculator": "bulk",
  "aggregate-weight-calculator": "weight",
  "sand-calculator": "bulk",
  "sand-weight-calculator": "weight",
  "sand-cost-calculator": "bulk",
  "fill-dirt-calculator": "bulk",
  "fill-dirt-cost-calculator": "bulk",
  "topsoil-calculator": "bulk",
  "topsoil-cost-calculator": "bulk",

  // 9. Excavation (10)
  "excavation-calculator": "excavation",
  "excavation-cost-calculator": "excavation",
  "trench-calculator": "excavation",
  "trench-volume-calculator": "excavation",
  "trench-backfill-calculator": "backfill",
  "earthwork-calculator": "excavation",
  "cut-and-fill-calculator": "cutFill",
  "dirt-removal-calculator": "excavation",
  "soil-volume-calculator": "excavation",
  "soil-weight-calculator": "weight",

  // 10. Framing & Lumber (15)
  "framing-calculator": "spaced",
  "wall-framing-calculator": "spaced",
  "stud-calculator": "spaced",
  "stud-spacing-calculator": "spacing",
  "lumber-calculator": "spaced",
  "lumber-cost-calculator": "material-cost",
  "board-foot-calculator": "boardFeet",
  "board-foot-cost-calculator": "boardFeet",
  "joist-calculator": "spaced",
  "joist-spacing-calculator": "spacing",
  "floor-joist-calculator": "spaced",
  "ceiling-joist-calculator": "spaced",
  "header-size-calculator": "header",
  "beam-calculator": "beam",
  "beam-load-calculator": "beam-load",

  // 11. Roofing (15)
  "roofing-calculator": "roofArea",
  "roof-area-calculator": "roofArea",
  "roof-pitch-calculator": "roof-pitch",
  "roof-slope-calculator": "roof-pitch",
  "roofing-shingle-calculator": "roofCover",
  "shingle-quantity-calculator": "roofCover",
  "shingle-cost-calculator": "roofCover",
  "roofing-material-calculator": "roofCover",
  "roofing-underlayment-calculator": "roofCover",
  "roof-sheathing-calculator": "roofCover",
  "roof-rafter-calculator": "rafter",
  "rafter-length-calculator": "rafter",
  "roof-truss-calculator": "roofCover",
  "roof-flashing-calculator": "flashing",
  "roof-waste-calculator": "waste",

  // 12. Flooring & Tile (15)
  "flooring-calculator": "coverage",
  "flooring-cost-calculator": "material-cost",
  "hardwood-flooring-calculator": "coverage",
  "hardwood-flooring-cost-calculator": "material-cost",
  "laminate-flooring-calculator": "coverage",
  "vinyl-flooring-calculator": "coverage",
  "carpet-calculator": "carpet",
  "carpet-cost-calculator": "carpet",
  "tile-calculator": "tile",
  "tile-quantity-calculator": "tile",
  "tile-cost-calculator": "material-cost",
  "tile-grout-calculator": "jointFill",
  "tile-adhesive-calculator": "coverage",
  "flooring-waste-calculator": "waste",
  "underlayment-calculator": "coverage",

  // 13. Drywall & Paint (15)
  "drywall-calculator": "drywall",
  "drywall-sheet-calculator": "drywall",
  "drywall-cost-calculator": "material-cost",
  "drywall-joint-compound-calculator": "drywallTape",
  "drywall-screw-calculator": "drywallScrews",
  "drywall-tape-calculator": "drywallTape",
  "paint-calculator": "paint",
  "paint-coverage-calculator": "paintCoverage",
  "paint-cost-calculator": "paint",
  "primer-calculator": "paint",
  "ceiling-paint-calculator": "ceilingPaint",
  "wall-paint-calculator": "paint",
  "insulation-calculator": "coverage",
  "insulation-cost-calculator": "material-cost",
  "spray-foam-calculator": "sprayFoam",

  // 14. Deck & Fence (15)
  "deck-calculator": "deck",
  "deck-cost-calculator": "material-cost",
  "deck-board-calculator": "deck",
  "deck-joist-calculator": "spaced",
  "deck-footing-calculator": "postConcrete",
  "deck-stair-calculator": "stairsLayout",
  "deck-railing-calculator": "railing",
  "fence-calculator": "fence",
  "fence-cost-calculator": "material-cost",
  "fence-post-calculator": "fence",
  "fence-panel-calculator": "fence",
  "fence-picket-calculator": "pickets",
  "fence-concrete-calculator": "postConcrete",
  "gate-calculator": "gate",
  "gate-cost-calculator": "material-cost",

  // 15. Paver & Landscaping (10)
  "paver-calculator": "tile",
  "paver-cost-calculator": "material-cost",
  "paver-sand-calculator": "bulk",
  "paver-base-calculator": "bulk",
  "paver-joint-sand-calculator": "jointFill",
  "landscaping-calculator": "mulch",
  "landscaping-cost-calculator": "material-cost",
  "mulch-calculator": "mulch",
  "mulch-cost-calculator": "material-cost",
  "retaining-wall-calculator": "masonry",

  // 16. Asphalt & Surface (10)
  "asphalt-calculator": "bulk",
  "asphalt-cost-calculator": "bulk",
  "asphalt-driveway-calculator": "bulk",
  "asphalt-weight-calculator": "weight",
  "asphalt-thickness-calculator": "asphalt-depth",
  "parking-lot-calculator": "bulk",
  "parking-lot-cost-calculator": "bulk",
  "road-base-calculator": "bulk",
  "surface-area-calculator": "area",
  "construction-material-cost-calculator": "material-cost",

  // Additional Dedicated Slugs
  "pea-gravel-calculator": "bulk",
  "driveway-gravel-calculator": "bulk",
  "roof-square-footage-calculator": "roofArea",
  "deck-material-calculator": "deck",
  "circular-slab-tube-calculator": "tube",
};

export function getModelForSlug(slug: string): Model {
  const key = slugToModelKey[slug];
  if (key && allModels[key]) {
    return allModels[key];
  }
  // Default fallback for any unlisted route
  return allModels["concrete"];
}

export function getFieldsForSlug(slug: string): Field[] {
  const model = getModelForSlug(slug);
  return model.fields;
}
