import type { Field, Model } from './calculator-types.ts';
import { allModels } from './calculator-models.ts';

export const slugToModelKey: Record<string, string> = {
  // 1. Concrete (17) — each has its own model for distinct inputs/outputs
  "concrete-calculator": "concrete",
  "concrete-volume-calculator": "concrete-volume",
  "concrete-cost-calculator": "concrete-cost",
  "concrete-pour-calculator": "concrete-pour",
  "concrete-mix-calculator": "concrete-mix",
  "concrete-weight-calculator": "concrete-weight",
  "concrete-slab-calculator": "concrete-slab",
  "concrete-footing-calculator": "concrete-footing",
  "concrete-foundation-calculator": "concrete-foundation",
  "concrete-wall-calculator": "concrete-wall",
  "concrete-column-calculator": "concrete-column",
  "concrete-curb-calculator": "concrete-curb",
  "concrete-stair-calculator": "concrete-stair",
  "concrete-ramp-calculator": "concrete-ramp",
  "concrete-tube-calculator": "concrete-tube",
  "concrete-waste-calculator": "concrete-waste",
  "concrete-crack-repair-calculator": "concreteCrackRepair",

  // 2. Slab & Patio (10)
    "slab-thickness-calculator": "thickness",
    "slab-cost-calculator": "slab-cost",
    "slab-reinforcement-calculator": "grid",
    "patio-concrete-calculator": "patio-concrete",
    "patio-cost-calculator": "patio-cost",
    "driveway-concrete-calculator": "driveway-concrete",
    "driveway-cost-calculator": "driveway-cost",
    "driveway-thickness-calculator": "thickness",
    "garage-slab-calculator": "garage-slab",
    "shed-foundation-calculator": "shed-foundation",

  // 3. Foundation (10)
  "foundation-cost-calculator": "foundation-cost-dedicated",
  "foundation-excavation-calculator": "foundation-excavation-dedicated",
  "strip-footing-calculator": "strip-footing-dedicated",
  "pad-footing-calculator": "pad-footing-dedicated",
  "pier-footing-calculator": "pier-footing-dedicated",
  "footing-volume-calculator": "footing-volume-dedicated",
  "footing-concrete-calculator": "footing-concrete-dedicated",
  "foundation-wall-calculator": "foundation-wall-dedicated",
  "basement-wall-calculator": "basement-wall-dedicated",
  "crawl-space-calculator": "crawl-space-dedicated",

  // 4. Rebar (10)
  "rebar-calculator": "rebar-general-dedicated",
  "rebar-weight-calculator": "rebar-weight-dedicated",
  "rebar-spacing-calculator": "rebar-spacing-dedicated",
  "rebar-length-calculator": "rebar-length-dedicated",
  "rebar-quantity-calculator": "rebar-quantity-dedicated",
  "rebar-cost-calculator": "rebar-cost-dedicated",
  "rebar-grid-calculator": "rebar-grid-dedicated",
  "rebar-lap-length-calculator": "rebar-lap-dedicated",
  "reinforcement-mesh-calculator": "reinforcement-mesh-dedicated",
  "rebar-chair-calculator": "rebar-chair-dedicated",

  // 5. Brick & Masonry (15)
  "brick-calculator": "brick-general-dedicated",
  "brick-wall-calculator": "brick-wall-dedicated",
  "brick-quantity-calculator": "brick-quantity-dedicated",
  "brick-cost-calculator": "brick-cost-dedicated",
  "brick-mortar-calculator": "brick-mortar-dedicated",
  "brick-veneer-calculator": "brick-veneer-dedicated",
  "brick-patio-calculator": "brick-patio-dedicated",
  "brick-paver-calculator": "brick-paver-dedicated",
  "masonry-calculator": "masonry-general-dedicated",
  "masonry-wall-calculator": "masonry-wall-dedicated",
  "masonry-cost-calculator": "masonry-cost-dedicated",
  "masonry-block-calculator": "masonry-block-dedicated",
  "brick-weight-calculator": "brick-weight-dedicated",
  "brick-waste-calculator": "brick-waste-dedicated",
  "brick-joint-calculator": "brick-joint-dedicated",

  // 6. CMU / Concrete Block (10)
  "concrete-block-calculator": "concrete-block-dedicated",
  "cmu-calculator": "cmu-general-dedicated",
  "cmu-wall-calculator": "cmu-wall-dedicated",
  "cmu-quantity-calculator": "cmu-quantity-dedicated",
  "cmu-cost-calculator": "cmu-cost-dedicated",
  "concrete-block-wall-calculator": "concrete-block-wall-dedicated",
  "concrete-block-weight-calculator": "concrete-block-weight-dedicated",
  "concrete-block-mortar-calculator": "concrete-block-mortar-dedicated",
  "cmu-grout-calculator": "cmu-grout-dedicated",
  "cmu-reinforcement-calculator": "cmu-reinforcement-dedicated",

  // 7. Mortar & Cement (12)
  "mortar-calculator": "mortar-general-dedicated",
  "mortar-mix-calculator": "mortar-mix-dedicated",
  "mortar-quantity-calculator": "mortar-quantity-dedicated",
  "mortar-cost-calculator": "mortar-cost-dedicated",
  "grout-calculator": "grout-general-dedicated",
  "grout-quantity-calculator": "grout-quantity-dedicated",
  "grout-cost-calculator": "grout-cost-dedicated",
  "cement-calculator": "cement-general-dedicated",
  "cement-bag-calculator": "cement-bag-dedicated",
  "cement-sand-ratio-calculator": "cement-sand-dedicated",
  "deck-mud-calculator": "deck-mud-dedicated",
  "stucco-calculator": "stucco-dedicated",

  // 8. Gravel & Aggregate (15)
  "gravel-calculator": "gravel-general-dedicated",
  "gravel-cost-calculator": "gravel-cost-dedicated",
  "gravel-weight-calculator": "gravel-weight-dedicated",
  "gravel-depth-calculator": "gravel-depth-dedicated",
  "crushed-stone-calculator": "crushed-stone-dedicated",
  "crushed-stone-cost-calculator": "crushed-stone-cost-dedicated",
  "aggregate-calculator": "aggregate-dedicated",
  "aggregate-weight-calculator": "aggregate-weight-dedicated",
  "sand-calculator": "sand-dedicated",
  "sand-weight-calculator": "sand-weight-dedicated",
  "sand-cost-calculator": "sand-cost-dedicated",
  "fill-dirt-calculator": "fill-dirt-dedicated",
  "fill-dirt-cost-calculator": "fill-dirt-cost-dedicated",
  "topsoil-calculator": "topsoil-dedicated",
  "topsoil-cost-calculator": "topsoil-cost-dedicated",

  // 9. Excavation (10)
  "excavation-calculator": "excavation-general-dedicated",
  "excavation-cost-calculator": "excavation-cost-dedicated",
  "trench-calculator": "trench-general-dedicated",
  "trench-volume-calculator": "trench-volume-dedicated",
  "trench-backfill-calculator": "trench-backfill-dedicated",
  "earthwork-calculator": "earthwork-dedicated",
  "cut-and-fill-calculator": "cut-fill-dedicated",
  "dirt-removal-calculator": "dirt-removal-dedicated",
  "soil-volume-calculator": "soil-volume-dedicated",
  "soil-weight-calculator": "soil-weight-dedicated",

  // 10. Framing & Lumber (15)
  "framing-calculator": "framing-general-dedicated",
  "wall-framing-calculator": "wall-framing-dedicated",
  "stud-calculator": "stud-count-dedicated",
  "stud-spacing-calculator": "stud-spacing-dedicated",
  "lumber-calculator": "lumber-count-dedicated",
  "lumber-cost-calculator": "lumber-cost-dedicated",
  "board-foot-calculator": "board-foot-dedicated",
  "board-foot-cost-calculator": "board-foot-cost-dedicated",
  "joist-calculator": "joist-count-dedicated",
  "joist-spacing-calculator": "joist-spacing-dedicated",
  "floor-joist-calculator": "floor-joist-dedicated",
  "ceiling-joist-calculator": "ceiling-joist-dedicated",
  "header-size-calculator": "header-analysis-dedicated",
  "beam-calculator": "beam-analysis-dedicated",
  "beam-load-calculator": "beam-load-dedicated",

  // 11. Roofing (15)
  "roofing-calculator": "roofing-general-dedicated",
  "roof-area-calculator": "roof-area-dedicated",
  "roof-pitch-calculator": "roof-pitch-dedicated",
  "roof-slope-calculator": "roof-slope-dedicated",
  "roofing-shingle-calculator": "roofing-shingle-dedicated",
  "shingle-quantity-calculator": "shingle-quantity-dedicated",
  "shingle-cost-calculator": "shingle-cost-dedicated",
  "roofing-material-calculator": "roofing-material-dedicated",
  "roofing-underlayment-calculator": "roofing-underlayment-dedicated",
  "roof-sheathing-calculator": "roof-sheathing-dedicated",
  "roof-rafter-calculator": "roof-rafter-dedicated",
  "rafter-length-calculator": "rafter-length-dedicated",
  "roof-truss-calculator": "roof-truss-dedicated",
  "roof-flashing-calculator": "roof-flashing-dedicated",
  "roof-waste-calculator": "roof-waste-dedicated",

  // 12. Flooring & Tile (15)
  "flooring-calculator": "flooring-general-dedicated",
  "flooring-cost-calculator": "flooring-cost-dedicated",
  "hardwood-flooring-calculator": "hardwood-flooring-dedicated",
  "hardwood-flooring-cost-calculator": "hardwood-flooring-cost-dedicated",
  "laminate-flooring-calculator": "laminate-flooring-dedicated",
  "vinyl-flooring-calculator": "vinyl-flooring-dedicated",
  "carpet-calculator": "carpet-dedicated",
  "carpet-cost-calculator": "carpet-cost-dedicated",
  "tile-calculator": "tile-dedicated",
  "tile-quantity-calculator": "tile-quantity-dedicated",
  "tile-cost-calculator": "tile-cost-dedicated",
  "tile-grout-calculator": "tile-grout-dedicated",
  "tile-adhesive-calculator": "tile-adhesive-dedicated",
  "flooring-waste-calculator": "flooring-waste-dedicated",
  "underlayment-calculator": "underlayment-dedicated",

  // 13. Drywall & Paint (15)
  "drywall-calculator": "drywall",
  "drywall-sheet-calculator": "drywallSheet",
  "drywall-cost-calculator": "material-cost",
  "drywall-joint-compound-calculator": "coverage",
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
  "parking-lot-cost-calculator": "parkingLotCost",
  "road-base-calculator": "bulk",
  "surface-area-calculator": "area",
  "construction-material-cost-calculator": "material-cost",

  // 17. Dams & Coastal (4)
  "cone-gravity-dam-calculator": "cone-gravity-dam",
  "groin-jetty-breakwater-calculator": "groin-jetty-breakwater",
  "masonry-arch-calculator": "masonry-arch",
  "masonry-gravity-retaining-wall-calculator": "masonry-gravity-retaining-wall",

  // Additional Dedicated Slugs
  "circular-slab-tube-calculator": "concrete-tube",
};

export function getModelForSlug(slug: string): Model {
  const key = slugToModelKey[slug];
  if (key && allModels[key]) {
    const model = allModels[key];
    const overrides: Record<string, Partial<Field>> = {};
    // Shared geometry must retain the material and application of the page.
    if ((key === 'masonry' || key === 'masonry-cost') && /cmu|concrete-block|masonry-block/.test(slug)) {
      overrides.unitLength = { value: 15.625 };
      overrides.unitHeight = { value: 7.625 };
      overrides.unitWeight = { value: 35, help: 'Example hollow 8-inch CMU weight. Use the actual manufacturer weight.' };
    }
    if (key === 'tile' && slug.startsWith('brick-')) {
      overrides.tileLength = { value: 8 };
      overrides.tileWidth = { value: 4 };
    }
    if (key === 'concrete-mix' && /mortar|cement-sand/.test(slug)) {
      overrides.aggregateParts = { value: 0, label: 'Coarse aggregate parts (zero for mortar)' };
      overrides.sandParts = { value: 3 };
    }
    if (slug === 'roof-truss-calculator') {
      overrides.length = { label: 'Building length across trusses' };
      overrides.spacing = { value: 24, label: 'Specified maximum truss spacing' };
    }
    if (slug === 'drywall-joint-compound-calculator') {
      overrides.coverage = { value: undefined, label: 'Finished drywall coverage per container', help: 'Enter manufacturer coverage for your finish level and container size. This estimates compound containers, not tape.' };
    }
    if (slug === 'roof-sheathing-calculator') overrides.coverage = { value: 32, label: 'Effective coverage per sheathing sheet' };
    if (slug === 'roofing-underlayment-calculator') overrides.coverage = { value: undefined, label: 'Net coverage per roll after overlaps' };
    return { ...model, fields: model.fields.map(field => ({ ...field, ...(overrides[field.id] ?? {}) })) };
  }
  throw new Error(`No calculator model registered for ${slug}`);
}

export function getFieldsForSlug(slug: string): Field[] {
  const model = getModelForSlug(slug);
  return model.fields;
}
