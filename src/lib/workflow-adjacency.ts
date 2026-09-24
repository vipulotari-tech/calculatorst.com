/**
 * Workflow-based calculator adjacency map.
 *
 * Each entry lists calculators that a user working on a specific task
 * typically needs to consult next, based on real construction workflow
 * adjacency (not just cluster membership).
 *
 * - "primary" — the most directly related tools
 * - "workflow" — adjacent calculators for the overall project
 *
 * Edit this file (not the auto-generated hubCalculators) when a workflow
 * relationship needs updating.
 */

import type { CalculatorMeta } from "../data/calculators.ts";

type Calc = Pick<CalculatorMeta, "slug" | "h1">;

export interface AdjacencyGroup {
  primary: string[]; // 2-4 strongly workflow-related calculators
  workflow: string[]; // broader cluster/category adjacencies (fallback)
}

// Adjacency groups for the most-visited calculators.
// Other calculators fall back to same-cluster related (existing behavior).
export const workflowAdjacency: Record<string, AdjacencyGroup> = {
  // Concrete slabs — rebar, gravel base, cost, thickness
  "concrete-slab-calculator": {
    primary: ["rebar-calculator", "gravel-calculator", "concrete-cost-calculator", "slab-thickness-calculator"],
    workflow: ["concrete-calculator", "concrete-volume-calculator", "concrete-pour-calculator"],
  },
  "concrete-calculator": {
    primary: ["concrete-cost-calculator", "concrete-volume-calculator", "concrete-slab-calculator", "rebar-calculator"],
    workflow: ["concrete-pour-calculator", "concrete-mix-calculator", "gravel-calculator"],
  },
  "concrete-volume-calculator": {
    primary: ["concrete-calculator", "concrete-cost-calculator", "concrete-pour-calculator"],
    workflow: ["concrete-slab-calculator", "rebar-calculator", "gravel-calculator"],
  },
  "concrete-cost-calculator": {
    primary: ["concrete-calculator", "concrete-volume-calculator", "concrete-pour-calculator"],
    workflow: ["concrete-slab-calculator", "concrete-mix-calculator", "gravel-calculator"],
  },
  "concrete-pour-calculator": {
    primary: ["concrete-calculator", "concrete-volume-calculator", "concrete-cost-calculator"],
    workflow: ["concrete-slab-calculator", "concrete-mix-calculator", "gravel-calculator"],
  },
  "concrete-mix-calculator": {
    primary: ["cement-calculator", "cement-bag-calculator", "cement-sand-ratio-calculator"],
    workflow: ["concrete-calculator", "concrete-volume-calculator"],
  },
  "concrete-weight-calculator": {
    primary: ["concrete-calculator", "concrete-volume-calculator", "concrete-cost-calculator"],
    workflow: ["concrete-slab-calculator", "concrete-mix-calculator"],
  },
  "concrete-footing-calculator": {
    primary: ["footing-volume-calculator", "footing-concrete-calculator", "rebar-calculator", "excavation-calculator"],
    workflow: ["strip-footing-calculator", "pad-footing-calculator", "concrete-slab-calculator"],
  },
  "concrete-foundation-calculator": {
    primary: ["footing-concrete-calculator", "foundation-wall-calculator", "rebar-calculator"],
    workflow: ["concrete-calculator", "concrete-volume-calculator", "excavation-calculator"],
  },
  "concrete-wall-calculator": {
    primary: ["rebar-calculator", "concrete-volume-calculator", "concrete-cost-calculator"],
    workflow: ["concrete-crack-repair-calculator", "concrete-column-calculator", "concrete-tube-calculator"],
  },
  "concrete-crack-repair-calculator": {
    primary: ["concrete-calculator", "concrete-volume-calculator", "concrete-cost-calculator"],
    workflow: ["concrete-wall-calculator", "concrete-slab-calculator"],
  },
  "concrete-column-calculator": {
    primary: ["concrete-tube-calculator", "rebar-calculator", "concrete-cost-calculator"],
    workflow: ["concrete-column-calculator", "concrete-volume-calculator"],
  },
  "concrete-curb-calculator": {
    primary: ["concrete-volume-calculator", "concrete-cost-calculator", "rebar-calculator"],
    workflow: ["concrete-slab-calculator", "asphalt-calculator"],
  },
  "concrete-stair-calculator": {
    primary: ["deck-stair-calculator", "concrete-volume-calculator", "concrete-cost-calculator"],
    workflow: ["rebar-calculator", "concrete-slab-calculator"],
  },
  "concrete-ramp-calculator": {
    primary: ["concrete-volume-calculator", "concrete-cost-calculator"],
    workflow: ["concrete-slab-calculator", "concrete-stair-calculator"],
  },
  "concrete-tube-calculator": {
    primary: ["concrete-column-calculator", "concrete-volume-calculator", "concrete-cost-calculator"],
    workflow: ["concrete-wall-calculator", "rebar-calculator"],
  },
  "concrete-waste-calculator": {
    primary: ["concrete-calculator", "concrete-volume-calculator", "concrete-cost-calculator"],
    workflow: ["concrete-slab-calculator"],
  },

  // Slab / patio / driveway
  "slab-thickness-calculator": {
    primary: ["slab-cost-calculator", "slab-reinforcement-calculator", "concrete-slab-calculator"],
    workflow: ["gravel-calculator", "driveway-thickness-calculator"],
  },
  "slab-cost-calculator": {
    primary: ["slab-thickness-calculator", "slab-reinforcement-calculator", "concrete-slab-calculator"],
    workflow: ["gravel-calculator", "concrete-cost-calculator"],
  },
  "slab-reinforcement-calculator": {
    primary: ["slab-thickness-calculator", "slab-cost-calculator", "rebar-weight-calculator"],
    workflow: ["rebar-spacing-calculator", "rebar-grid-calculator", "concrete-slab-calculator"],
  },
  "patio-concrete-calculator": {
    primary: ["patio-cost-calculator", "slab-reinforcement-calculator", "slab-thickness-calculator"],
    workflow: ["gravel-calculator", "concrete-slab-calculator"],
  },
  "patio-cost-calculator": {
    primary: ["patio-concrete-calculator", "slab-reinforcement-calculator", "slab-thickness-calculator"],
    workflow: ["gravel-calculator", "paver-calculator"],
  },
  "driveway-concrete-calculator": {
    primary: ["driveway-cost-calculator", "driveway-thickness-calculator", "slab-reinforcement-calculator"],
    workflow: ["gravel-calculator", "asphalt-calculator", "concrete-slab-calculator"],
  },
  "driveway-cost-calculator": {
    primary: ["driveway-concrete-calculator", "driveway-thickness-calculator", "slab-reinforcement-calculator"],
    workflow: ["gravel-calculator", "asphalt-cost-calculator", "concrete-cost-calculator"],
  },
  "driveway-thickness-calculator": {
    primary: ["driveway-concrete-calculator", "driveway-cost-calculator", "slab-reinforcement-calculator"],
    workflow: ["slab-thickness-calculator", "gravel-calculator", "asphalt-calculator"],
  },
  "garage-slab-calculator": {
    primary: ["slab-thickness-calculator", "slab-reinforcement-calculator", "slab-cost-calculator"],
    workflow: ["gravel-calculator", "concrete-slab-calculator"],
  },
  "shed-foundation-calculator": {
    primary: ["slab-cost-calculator", "slab-reinforcement-calculator", "strip-footing-calculator"],
    workflow: ["gravel-calculator", "concrete-foundation-calculator", "deck-footing-calculator"],
  },

  // Foundation
  "foundation-cost-calculator": {
    primary: ["footing-concrete-calculator", "foundation-excavation-calculator", "foundation-wall-calculator"],
    workflow: ["strip-footing-calculator", "pad-footing-calculator", "pier-footing-calculator"],
  },
  "foundation-excavation-calculator": {
    primary: ["foundation-cost-calculator", "strip-footing-calculator", "foundation-wall-calculator"],
    workflow: ["excavation-calculator", "trench-backfill-calculator", "fill-dirt-calculator"],
  },
  "strip-footing-calculator": {
    primary: ["footing-concrete-calculator", "footing-volume-calculator", "foundation-wall-calculator"],
    workflow: ["foundation-cost-calculator", "slab-reinforcement-calculator", "rebar-calculator"],
  },
  "pad-footing-calculator": {
    primary: ["pier-footing-calculator", "footing-concrete-calculator", "footing-volume-calculator"],
    workflow: ["foundation-cost-calculator", "rebar-calculator", "deck-footing-calculator"],
  },
  "pier-footing-calculator": {
    primary: ["pad-footing-calculator", "footing-concrete-calculator", "footing-volume-calculator"],
    workflow: ["foundation-cost-calculator", "rebar-calculator", "deck-footing-calculator"],
  },
  "footing-volume-calculator": {
    primary: ["footing-concrete-calculator", "strip-footing-calculator", "pad-footing-calculator"],
    workflow: ["pier-footing-calculator", "concrete-volume-calculator"],
  },
  "footing-concrete-calculator": {
    primary: ["strip-footing-calculator", "pad-footing-calculator", "pier-footing-calculator"],
    workflow: ["footing-volume-calculator", "foundation-cost-calculator", "foundation-wall-calculator"],
  },
  "foundation-wall-calculator": {
    primary: ["basement-wall-calculator", "crawl-space-calculator", "strip-footing-calculator"],
    workflow: ["foundation-cost-calculator", "rebar-calculator", "concrete-foundation-calculator"],
  },
  "basement-wall-calculator": {
    primary: ["foundation-wall-calculator", "strip-footing-calculator", "foundation-cost-calculator"],
    workflow: ["foundation-excavation-calculator", "rebar-calculator", "concrete-slab-calculator"],
  },
  "crawl-space-calculator": {
    primary: ["foundation-wall-calculator", "strip-footing-calculator", "pier-footing-calculator"],
    workflow: ["foundation-excavation-calculator", "foundation-cost-calculator", "gravel-calculator"],
  },

  // Rebar
  "rebar-calculator": {
    primary: ["rebar-quantity-calculator", "rebar-weight-calculator", "rebar-cost-calculator"],
    workflow: ["rebar-grid-calculator", "rebar-spacing-calculator", "concrete-slab-calculator"],
  },
  "rebar-weight-calculator": {
    primary: ["rebar-length-calculator", "rebar-quantity-calculator", "rebar-cost-calculator"],
    workflow: ["rebar-calculator", "rebar-lap-length-calculator"],
  },
  "rebar-spacing-calculator": {
    primary: ["rebar-grid-calculator", "rebar-quantity-calculator", "rebar-calculator"],
    workflow: ["slab-reinforcement-calculator", "concrete-slab-calculator"],
  },
  "rebar-length-calculator": {
    primary: ["rebar-weight-calculator", "rebar-cost-calculator", "rebar-lap-length-calculator"],
    workflow: ["rebar-quantity-calculator", "rebar-calculator"],
  },
  "rebar-quantity-calculator": {
    primary: ["rebar-calculator", "rebar-grid-calculator", "rebar-length-calculator"],
    workflow: ["rebar-weight-calculator", "rebar-cost-calculator"],
  },
  "rebar-cost-calculator": {
    primary: ["rebar-quantity-calculator", "rebar-weight-calculator", "rebar-length-calculator"],
    workflow: ["rebar-calculator", "concrete-cost-calculator"],
  },
  "rebar-grid-calculator": {
    primary: ["rebar-spacing-calculator", "rebar-quantity-calculator", "rebar-calculator"],
    workflow: ["slab-reinforcement-calculator", "rebar-weight-calculator"],
  },
  "rebar-lap-length-calculator": {
    primary: ["rebar-length-calculator", "rebar-weight-calculator", "rebar-cost-calculator"],
    workflow: ["rebar-calculator", "foundation-wall-calculator"],
  },
  "reinforcement-mesh-calculator": {
    primary: ["rebar-chair-calculator", "rebar-grid-calculator", "slab-reinforcement-calculator"],
    workflow: ["concrete-slab-calculator", "patio-concrete-calculator"],
  },
  "rebar-chair-calculator": {
    primary: ["reinforcement-mesh-calculator", "rebar-grid-calculator", "slab-reinforcement-calculator"],
    workflow: ["concrete-slab-calculator", "garage-slab-calculator"],
  },

  // Brick & Masonry
  "brick-calculator": {
    primary: ["brick-mortar-calculator", "brick-cost-calculator", "brick-quantity-calculator"],
    workflow: ["brick-wall-calculator", "brick-veneer-calculator", "mortar-calculator"],
  },
  "brick-wall-calculator": {
    primary: ["brick-calculator", "brick-mortar-calculator", "brick-quantity-calculator"],
    workflow: ["brick-cost-calculator", "masonry-wall-calculator"],
  },
  "brick-quantity-calculator": {
    primary: ["brick-calculator", "brick-mortar-calculator", "brick-cost-calculator"],
    workflow: ["brick-wall-calculator", "brick-veneer-calculator"],
  },
  "brick-cost-calculator": {
    primary: ["brick-calculator", "brick-quantity-calculator", "brick-mortar-calculator"],
    workflow: ["brick-wall-calculator", "masonry-cost-calculator"],
  },
  "brick-mortar-calculator": {
    primary: ["mortar-calculator", "brick-calculator", "mortar-quantity-calculator"],
    workflow: ["mortar-cost-calculator", "mortar-mix-calculator"],
  },
  "brick-veneer-calculator": {
    primary: ["brick-wall-calculator", "brick-calculator", "brick-mortar-calculator"],
    workflow: ["brick-cost-calculator", "masonry-calculator"],
  },
  "brick-patio-calculator": {
    primary: ["paver-calculator", "brick-calculator", "paver-base-calculator"],
    workflow: ["paver-sand-calculator", "gravel-calculator"],
  },
  "brick-paver-calculator": {
    primary: ["paver-calculator", "paver-base-calculator", "paver-sand-calculator"],
    workflow: ["paver-cost-calculator", "brick-patio-calculator"],
  },
  "masonry-calculator": {
    primary: ["brick-calculator", "masonry-wall-calculator", "masonry-cost-calculator"],
    workflow: ["cmu-calculator", "mortar-calculator"],
  },
  "masonry-wall-calculator": {
    primary: ["masonry-calculator", "cmu-wall-calculator", "brick-wall-calculator"],
    workflow: ["masonry-cost-calculator", "mortar-calculator"],
  },
  "masonry-cost-calculator": {
    primary: ["brick-cost-calculator", "cmu-cost-calculator", "masonry-calculator"],
    workflow: ["masonry-wall-calculator", "mortar-cost-calculator"],
  },
  "masonry-block-calculator": {
    primary: ["cmu-calculator", "cmu-wall-calculator", "mortar-calculator"],
    workflow: ["concrete-block-calculator", "masonry-calculator"],
  },
  "brick-weight-calculator": {
    primary: ["brick-calculator", "brick-quantity-calculator", "brick-cost-calculator"],
    workflow: ["masonry-calculator", "concrete-weight-calculator"],
  },
  "brick-waste-calculator": {
    primary: ["brick-calculator", "brick-quantity-calculator", "brick-mortar-calculator"],
    workflow: ["brick-cost-calculator", "brick-wall-calculator"],
  },
  "brick-joint-calculator": {
    primary: ["brick-mortar-calculator", "mortar-calculator", "brick-calculator"],
    workflow: ["cmu-mortar-calculator", "mortar-quantity-calculator"],
  },

  // CMU
  "concrete-block-calculator": {
    primary: ["cmu-calculator", "concrete-block-mortar-calculator", "cmu-cost-calculator"],
    workflow: ["concrete-block-wall-calculator", "rebar-calculator"],
  },
  "cmu-calculator": {
    primary: ["concrete-block-calculator", "cmu-wall-calculator", "cmu-quantity-calculator"],
    workflow: ["cmu-cost-calculator", "concrete-block-mortar-calculator"],
  },
  "cmu-wall-calculator": {
    primary: ["cmu-calculator", "concrete-block-calculator", "concrete-block-wall-calculator"],
    workflow: ["cmu-quantity-calculator", "rebar-calculator"],
  },
  "cmu-quantity-calculator": {
    primary: ["cmu-calculator", "concrete-block-calculator", "cmu-wall-calculator"],
    workflow: ["cmu-cost-calculator", "concrete-block-mortar-calculator"],
  },
  "cmu-cost-calculator": {
    primary: ["cmu-calculator", "cmu-quantity-calculator", "concrete-cost-calculator"],
    workflow: ["cmu-wall-calculator", "masonry-cost-calculator"],
  },
  "concrete-block-wall-calculator": {
    primary: ["cmu-wall-calculator", "concrete-block-calculator", "cmu-calculator"],
    workflow: ["cmu-grout-calculator", "cmu-reinforcement-calculator"],
  },
  "concrete-block-weight-calculator": {
    primary: ["concrete-block-calculator", "cmu-calculator", "concrete-weight-calculator"],
    workflow: ["brick-weight-calculator", "cmu-cost-calculator"],
  },
  "concrete-block-mortar-calculator": {
    primary: ["cmu-grout-calculator", "mortar-calculator", "concrete-block-calculator"],
    workflow: ["cmu-calculator", "mortar-quantity-calculator"],
  },
  "cmu-grout-calculator": {
    primary: ["cmu-calculator", "concrete-block-calculator", "grout-calculator"],
    workflow: ["cmu-wall-calculator", "cmu-reinforcement-calculator"],
  },
  "cmu-reinforcement-calculator": {
    primary: ["rebar-calculator", "cmu-calculator", "rebar-grid-calculator"],
    workflow: ["cmu-grout-calculator", "cmu-wall-calculator"],
  },

  // Mortar / cement
  "mortar-calculator": {
    primary: ["mortar-mix-calculator", "mortar-quantity-calculator", "mortar-cost-calculator"],
    workflow: ["deck-mud-calculator", "stucco-calculator", "cement-sand-ratio-calculator"],
  },
  "deck-mud-calculator": {
    primary: ["mortar-calculator", "mortar-mix-calculator", "tile-calculator"],
    workflow: ["flooring-calculator", "paver-sand-calculator"],
  },
  "stucco-calculator": {
    primary: ["mortar-calculator", "mortar-mix-calculator", "masonry-calculator"],
    workflow: ["paint-calculator", "concrete-wall-calculator"],
  },
  "mortar-mix-calculator": {
    primary: ["concrete-mix-calculator", "cement-sand-ratio-calculator", "mortar-calculator"],
    workflow: ["mortar-quantity-calculator", "cement-bag-calculator"],
  },
  "mortar-quantity-calculator": {
    primary: ["mortar-calculator", "mortar-cost-calculator", "brick-mortar-calculator"],
    workflow: ["cement-calculator", "cement-bag-calculator"],
  },
  "mortar-cost-calculator": {
    primary: ["mortar-calculator", "mortar-quantity-calculator", "brick-cost-calculator"],
    workflow: ["masonry-cost-calculator", "cement-bag-calculator"],
  },
  "grout-calculator": {
    primary: ["grout-quantity-calculator", "grout-cost-calculator", "tile-grout-calculator"],
    workflow: ["tile-calculator", "cmu-grout-calculator"],
  },
  "grout-quantity-calculator": {
    primary: ["grout-calculator", "grout-cost-calculator", "tile-grout-calculator"],
    workflow: ["tile-calculator", "cmu-grout-calculator"],
  },
  "grout-cost-calculator": {
    primary: ["grout-calculator", "grout-quantity-calculator", "tile-cost-calculator"],
    workflow: ["tile-calculator", "mortar-cost-calculator"],
  },
  "cement-calculator": {
    primary: ["cement-bag-calculator", "concrete-mix-calculator", "cement-sand-ratio-calculator"],
    workflow: ["mortar-calculator", "mortar-mix-calculator"],
  },
  "cement-bag-calculator": {
    primary: ["cement-calculator", "cement-sand-ratio-calculator", "concrete-mix-calculator"],
    workflow: ["mortar-calculator", "mortar-quantity-calculator"],
  },
  "cement-sand-ratio-calculator": {
    primary: ["concrete-mix-calculator", "cement-bag-calculator", "mortar-mix-calculator"],
    workflow: ["mortar-calculator", "cement-calculator"],
  },

  // Gravel / aggregate
  "gravel-calculator": {
    primary: ["gravel-cost-calculator", "gravel-depth-calculator", "gravel-weight-calculator"],
    workflow: ["paver-base-calculator", "concrete-slab-calculator", "driveway-calculator"],
  },
  "gravel-cost-calculator": {
    primary: ["gravel-calculator", "gravel-weight-calculator", "gravel-depth-calculator"],
    workflow: ["concrete-cost-calculator", "driveway-cost-calculator"],
  },
  "gravel-weight-calculator": {
    primary: ["gravel-calculator", "aggregate-weight-calculator", "soil-weight-calculator"],
    workflow: ["gravel-cost-calculator", "asphalt-weight-calculator"],
  },
  "gravel-depth-calculator": {
    primary: ["gravel-calculator", "slab-thickness-calculator", "paver-base-calculator"],
    workflow: ["driveway-thickness-calculator", "concrete-slab-calculator"],
  },
  "crushed-stone-calculator": {
    primary: ["gravel-calculator", "aggregate-calculator", "gravel-depth-calculator"],
    workflow: ["gravel-cost-calculator", "paver-base-calculator"],
  },
  "crushed-stone-cost-calculator": {
    primary: ["gravel-cost-calculator", "crushed-stone-calculator", "gravel-calculator"],
    workflow: ["aggregate-calculator", "driveway-cost-calculator"],
  },
  "aggregate-calculator": {
    primary: ["gravel-calculator", "crushed-stone-calculator", "concrete-mix-calculator"],
    workflow: ["cement-sand-ratio-calculator", "concrete-volume-calculator"],
  },
  "aggregate-weight-calculator": {
    primary: ["gravel-weight-calculator", "gravel-calculator", "soil-weight-calculator"],
    workflow: ["asphalt-weight-calculator", "concrete-weight-calculator"],
  },
  "sand-calculator": {
    primary: ["paver-sand-calculator", "paver-base-calculator", "sand-weight-calculator"],
    workflow: ["mortar-mix-calculator", "cement-sand-ratio-calculator"],
  },
  "sand-weight-calculator": {
    primary: ["sand-calculator", "gravel-weight-calculator", "aggregate-weight-calculator"],
    workflow: ["soil-weight-calculator", "concrete-weight-calculator"],
  },
  "sand-cost-calculator": {
    primary: ["sand-calculator", "gravel-cost-calculator", "paver-sand-calculator"],
    workflow: ["mortar-cost-calculator", "concrete-cost-calculator"],
  },
  "fill-dirt-calculator": {
    primary: ["fill-dirt-cost-calculator", "topsoil-calculator", "soil-volume-calculator"],
    workflow: ["excavation-calculator", "backfill-calculator"],
  },
  "fill-dirt-cost-calculator": {
    primary: ["fill-dirt-calculator", "topsoil-cost-calculator", "gravel-cost-calculator"],
    workflow: ["soil-weight-calculator", "excavation-cost-calculator"],
  },
  "topsoil-calculator": {
    primary: ["mulch-calculator", "topsoil-cost-calculator", "landscaping-calculator"],
    workflow: ["fill-dirt-calculator", "gravel-calculator"],
  },
  "topsoil-cost-calculator": {
    primary: ["topsoil-calculator", "mulch-cost-calculator", "landscaping-cost-calculator"],
    workflow: ["fill-dirt-cost-calculator", "gravel-cost-calculator"],
  },

  // Excavation
  "excavation-calculator": {
    primary: ["excavation-cost-calculator", "foundation-excavation-calculator", "dirt-removal-calculator"],
    workflow: ["trench-calculator", "soil-volume-calculator", "fill-dirt-calculator"],
  },
  "excavation-cost-calculator": {
    primary: ["excavation-calculator", "trench-calculator", "foundation-excavation-calculator"],
    workflow: ["gravel-cost-calculator", "dirt-removal-calculator"],
  },
  "trench-calculator": {
    primary: ["trench-volume-calculator", "trench-backfill-calculator", "excavation-calculator"],
    workflow: ["footing-concrete-calculator", "strip-footing-calculator"],
  },
  "trench-volume-calculator": {
    primary: ["trench-calculator", "trench-backfill-calculator", "excavation-calculator"],
    workflow: ["footing-volume-calculator", "soil-volume-calculator"],
  },
  "trench-backfill-calculator": {
    primary: ["trench-calculator", "fill-dirt-calculator", "excavation-calculator"],
    workflow: ["gravel-calculator", "soil-weight-calculator"],
  },
  "earthwork-calculator": {
    primary: ["excavation-calculator", "cut-and-fill-calculator", "soil-volume-calculator"],
    workflow: ["dirt-removal-calculator", "fill-dirt-calculator"],
  },
  "cut-and-fill-calculator": {
    primary: ["excavation-calculator", "earthwork-calculator", "soil-volume-calculator"],
    workflow: ["fill-dirt-calculator", "gravel-calculator"],
  },
  "dirt-removal-calculator": {
    primary: ["excavation-calculator", "soil-volume-calculator", "soil-weight-calculator"],
    workflow: ["excavation-cost-calculator", "fill-dirt-calculator"],
  },
  "soil-volume-calculator": {
    primary: ["excavation-calculator", "fill-dirt-calculator", "topsoil-calculator"],
    workflow: ["mulch-calculator", "cut-and-fill-calculator"],
  },
  "soil-weight-calculator": {
    primary: ["gravel-weight-calculator", "excavation-calculator", "fill-dirt-calculator"],
    workflow: ["aggregate-weight-calculator", "asphalt-weight-calculator"],
  },

  // Framing
  "framing-calculator": {
    primary: ["stud-calculator", "joist-calculator", "board-foot-calculator"],
    workflow: ["lumber-calculator", "wall-framing-calculator", "beam-calculator"],
  },
  "wall-framing-calculator": {
    primary: ["stud-calculator", "stud-spacing-calculator", "framing-calculator"],
    workflow: ["header-size-calculator", "lumber-calculator"],
  },
  "stud-calculator": {
    primary: ["stud-spacing-calculator", "wall-framing-calculator", "framing-calculator"],
    workflow: ["lumber-calculator", "board-foot-calculator"],
  },
  "stud-spacing-calculator": {
    primary: ["stud-calculator", "joist-spacing-calculator", "framing-calculator"],
    workflow: ["wall-framing-calculator", "lumber-calculator"],
  },
  "lumber-calculator": {
    primary: ["board-foot-calculator", "framing-calculator", "lumber-cost-calculator"],
    workflow: ["stud-calculator", "joist-calculator"],
  },
  "lumber-cost-calculator": {
    primary: ["lumber-calculator", "board-foot-calculator", "board-foot-cost-calculator"],
    workflow: ["framing-calculator", "stud-calculator"],
  },
  "board-foot-calculator": {
    primary: ["lumber-calculator", "board-foot-cost-calculator", "framing-calculator"],
    workflow: ["lumber-cost-calculator", "joist-calculator"],
  },
  "board-foot-cost-calculator": {
    primary: ["board-foot-calculator", "lumber-cost-calculator", "lumber-calculator"],
    workflow: ["framing-calculator", "stud-calculator"],
  },
  "joist-calculator": {
    primary: ["joist-spacing-calculator", "floor-joist-calculator", "ceiling-joist-calculator"],
    workflow: ["framing-calculator", "lumber-calculator"],
  },
  "joist-spacing-calculator": {
    primary: ["joist-calculator", "floor-joist-calculator", "stud-spacing-calculator"],
    workflow: ["ceiling-joist-calculator", "framing-calculator"],
  },
  "floor-joist-calculator": {
    primary: ["joist-calculator", "joist-spacing-calculator", "framing-calculator"],
    workflow: ["beam-calculator", "lumber-calculator"],
  },
  "ceiling-joist-calculator": {
    primary: ["joist-calculator", "joist-spacing-calculator", "framing-calculator"],
    workflow: ["floor-joist-calculator", "roof-truss-calculator"],
  },
  "header-size-calculator": {
    primary: ["beam-calculator", "beam-load-calculator", "wall-framing-calculator"],
    workflow: ["stud-calculator", "lumber-calculator"],
  },
  "beam-calculator": {
    primary: ["beam-load-calculator", "header-size-calculator", "floor-joist-calculator"],
    workflow: ["joist-calculator", "lumber-calculator"],
  },
  "beam-load-calculator": {
    primary: ["beam-calculator", "header-size-calculator", "floor-joist-calculator"],
    workflow: ["joist-calculator", "lumber-calculator"],
  },

  // Roofing
  "roofing-calculator": {
    primary: ["roof-area-calculator", "roofing-shingle-calculator", "roof-pitch-calculator"],
    workflow: ["roofing-material-calculator", "shingle-quantity-calculator"],
  },
  "roof-area-calculator": {
    primary: ["roofing-calculator", "roofing-shingle-calculator", "roof-pitch-calculator"],
    workflow: ["roofing-material-calculator", "shingle-cost-calculator"],
  },
  "roof-pitch-calculator": {
    primary: ["roof-area-calculator", "roof-slope-calculator", "roof-rafter-calculator"],
    workflow: ["roofing-calculator", "rafter-length-calculator"],
  },
  "roof-slope-calculator": {
    primary: ["roof-pitch-calculator", "roof-area-calculator", "roof-rafter-calculator"],
    workflow: ["roofing-calculator", "rafter-length-calculator"],
  },
  "roofing-shingle-calculator": {
    primary: ["roof-area-calculator", "shingle-quantity-calculator", "shingle-cost-calculator"],
    workflow: ["roofing-material-calculator", "roofing-underlayment-calculator"],
  },
  "shingle-quantity-calculator": {
    primary: ["roofing-shingle-calculator", "shingle-cost-calculator", "roof-area-calculator"],
    workflow: ["roofing-material-calculator", "roof-sheathing-calculator"],
  },
  "shingle-cost-calculator": {
    primary: ["roofing-shingle-calculator", "shingle-quantity-calculator", "roofing-material-calculator"],
    workflow: ["roof-cost-calculator", "roof-area-calculator"],
  },
  "roofing-material-calculator": {
    primary: ["roof-area-calculator", "roofing-shingle-calculator", "roofing-underlayment-calculator"],
    workflow: ["roof-sheathing-calculator", "shingle-quantity-calculator"],
  },
  "roofing-underlayment-calculator": {
    primary: ["roof-sheathing-calculator", "roofing-material-calculator", "roof-area-calculator"],
    workflow: ["roofing-shingle-calculator", "roof-flashing-calculator"],
  },
  "roof-sheathing-calculator": {
    primary: ["roofing-underlayment-calculator", "roof-rafter-calculator", "roof-area-calculator"],
    workflow: ["roofing-shingle-calculator", "roof-truss-calculator"],
  },
  "roof-rafter-calculator": {
    primary: ["rafter-length-calculator", "roof-truss-calculator", "roof-pitch-calculator"],
    workflow: ["roof-area-calculator", "roof-sheathing-calculator"],
  },
  "rafter-length-calculator": {
    primary: ["roof-rafter-calculator", "roof-pitch-calculator", "roof-truss-calculator"],
    workflow: ["roof-area-calculator", "roof-sheathing-calculator"],
  },
  "roof-truss-calculator": {
    primary: ["roof-rafter-calculator", "rafter-length-calculator", "roof-area-calculator"],
    workflow: ["ceiling-joist-calculator", "roof-sheathing-calculator"],
  },
  "roof-flashing-calculator": {
    primary: ["roofing-underlayment-calculator", "roof-area-calculator", "roofing-shingle-calculator"],
    workflow: ["roof-sheathing-calculator", "roofing-material-calculator"],
  },
  "roof-waste-calculator": {
    primary: ["roofing-shingle-calculator", "roof-area-calculator", "roofing-material-calculator"],
    workflow: ["roofing-underlayment-calculator", "shingle-quantity-calculator"],
  },

  // Flooring
  "flooring-calculator": {
    primary: ["flooring-cost-calculator", "underlayment-calculator", "tile-calculator"],
    workflow: ["hardwood-flooring-calculator", "vinyl-flooring-calculator", "laminate-flooring-calculator"],
  },
  "flooring-cost-calculator": {
    primary: ["flooring-calculator", "tile-cost-calculator", "hardwood-flooring-cost-calculator"],
    workflow: ["underlayment-calculator", "flooring-waste-calculator"],
  },
  "hardwood-flooring-calculator": {
    primary: ["hardwood-flooring-cost-calculator", "laminate-flooring-calculator", "vinyl-flooring-calculator"],
    workflow: ["flooring-calculator", "underlayment-calculator"],
  },
  "hardwood-flooring-cost-calculator": {
    primary: ["hardwood-flooring-calculator", "laminate-flooring-calculator", "vinyl-flooring-calculator"],
    workflow: ["flooring-cost-calculator", "underlayment-calculator"],
  },
  "laminate-flooring-calculator": {
    primary: ["hardwood-flooring-calculator", "vinyl-flooring-calculator", "flooring-calculator"],
    workflow: ["underlayment-calculator", "flooring-cost-calculator"],
  },
  "vinyl-flooring-calculator": {
    primary: ["hardwood-flooring-calculator", "laminate-flooring-calculator", "flooring-calculator"],
    workflow: ["underlayment-calculator", "flooring-cost-calculator"],
  },
  "carpet-calculator": {
    primary: ["carpet-cost-calculator", "flooring-calculator", "underlayment-calculator"],
    workflow: ["flooring-cost-calculator", "hardwood-flooring-calculator"],
  },
  "carpet-cost-calculator": {
    primary: ["carpet-calculator", "flooring-cost-calculator", "flooring-calculator"],
    workflow: ["underlayment-calculator", "hardwood-flooring-cost-calculator"],
  },
  "tile-calculator": {
    primary: ["tile-quantity-calculator", "tile-cost-calculator", "tile-grout-calculator"],
    workflow: ["tile-adhesive-calculator", "underlayment-calculator"],
  },
  "tile-quantity-calculator": {
    primary: ["tile-calculator", "tile-cost-calculator", "tile-grout-calculator"],
    workflow: ["tile-adhesive-calculator", "underlayment-calculator"],
  },
  "tile-cost-calculator": {
    primary: ["tile-calculator", "tile-quantity-calculator", "tile-adhesive-calculator"],
    workflow: ["tile-grout-calculator", "flooring-cost-calculator"],
  },
  "tile-grout-calculator": {
    primary: ["tile-calculator", "tile-quantity-calculator", "grout-calculator"],
    workflow: ["tile-adhesive-calculator", "tile-cost-calculator"],
  },
  "tile-adhesive-calculator": {
    primary: ["tile-calculator", "tile-cost-calculator", "tile-quantity-calculator"],
    workflow: ["tile-grout-calculator", "underlayment-calculator"],
  },
  "flooring-waste-calculator": {
    primary: ["flooring-calculator", "tile-calculator", "tile-quantity-calculator"],
    workflow: ["hardwood-flooring-calculator", "vinyl-flooring-calculator"],
  },
  "underlayment-calculator": {
    primary: ["flooring-calculator", "tile-calculator", "roofing-underlayment-calculator"],
    workflow: ["drywall-calculator", "insulation-calculator"],
  },

  // Drywall, paint, insulation
  "drywall-calculator": {
    primary: ["drywall-sheet-calculator", "drywall-cost-calculator", "paint-calculator"],
    workflow: ["drywall-joint-compound-calculator", "drywall-tape-calculator"],
  },
  "drywall-sheet-calculator": {
    primary: ["drywall-calculator", "drywall-cost-calculator", "drywall-joint-compound-calculator"],
    workflow: ["paint-calculator", "insulation-calculator"],
  },
  "drywall-cost-calculator": {
    primary: ["drywall-calculator", "drywall-sheet-calculator", "paint-cost-calculator"],
    workflow: ["drywall-joint-compound-calculator", "insulation-cost-calculator"],
  },
  "drywall-joint-compound-calculator": {
    primary: ["drywall-calculator", "drywall-tape-calculator", "drywall-screw-calculator"],
    workflow: ["paint-calculator", "insulation-calculator"],
  },
  "drywall-screw-calculator": {
    primary: ["drywall-calculator", "drywall-sheet-calculator", "drywall-joint-compound-calculator"],
    workflow: ["drywall-tape-calculator", "framing-calculator"],
  },
  "drywall-tape-calculator": {
    primary: ["drywall-joint-compound-calculator", "drywall-calculator", "drywall-sheet-calculator"],
    workflow: ["paint-calculator", "drywall-screw-calculator"],
  },
  "paint-calculator": {
    primary: ["paint-coverage-calculator", "paint-cost-calculator", "primer-calculator"],
    workflow: ["ceiling-paint-calculator", "wall-paint-calculator"],
  },
  "paint-coverage-calculator": {
    primary: ["paint-calculator", "paint-cost-calculator", "primer-calculator"],
    workflow: ["ceiling-paint-calculator", "wall-paint-calculator"],
  },
  "paint-cost-calculator": {
    primary: ["paint-calculator", "paint-coverage-calculator", "primer-calculator"],
    workflow: ["drywall-cost-calculator", "insulation-cost-calculator"],
  },
  "primer-calculator": {
    primary: ["paint-calculator", "paint-coverage-calculator", "paint-cost-calculator"],
    workflow: ["drywall-calculator", "ceiling-paint-calculator"],
  },
  "ceiling-paint-calculator": {
    primary: ["paint-calculator", "wall-paint-calculator", "paint-coverage-calculator"],
    workflow: ["drywall-calculator", "primer-calculator"],
  },
  "wall-paint-calculator": {
    primary: ["paint-calculator", "paint-coverage-calculator", "ceiling-paint-calculator"],
    workflow: ["drywall-calculator", "primer-calculator"],
  },
  "insulation-calculator": {
    primary: ["insulation-cost-calculator", "spray-foam-calculator", "drywall-calculator"],
    workflow: ["underlayment-calculator", "wall-framing-calculator"],
  },
  "insulation-cost-calculator": {
    primary: ["insulation-calculator", "spray-foam-calculator", "drywall-cost-calculator"],
    workflow: ["paint-cost-calculator", "drywall-sheet-calculator"],
  },
  "spray-foam-calculator": {
    primary: ["insulation-calculator", "insulation-cost-calculator", "drywall-calculator"],
    workflow: ["underlayment-calculator", "wall-framing-calculator"],
  },

  // Deck, fence, gate
  "deck-calculator": {
    primary: ["deck-board-calculator", "deck-cost-calculator", "deck-joist-calculator"],
    workflow: ["deck-footing-calculator", "deck-railing-calculator", "fence-calculator"],
  },
  "deck-cost-calculator": {
    primary: ["deck-calculator", "deck-board-calculator", "lumber-cost-calculator"],
    workflow: ["deck-footing-calculator", "deck-railing-calculator"],
  },
  "deck-board-calculator": {
    primary: ["deck-calculator", "deck-joist-calculator", "deck-cost-calculator"],
    workflow: ["deck-footing-calculator", "deck-stair-calculator"],
  },
  "deck-joist-calculator": {
    primary: ["deck-calculator", "deck-board-calculator", "deck-footing-calculator"],
    workflow: ["deck-stair-calculator", "deck-railing-calculator"],
  },
  "deck-footing-calculator": {
    primary: ["deck-calculator", "concrete-footing-calculator", "deck-joist-calculator"],
    workflow: ["concrete-column-calculator", "concrete-slab-calculator"],
  },
  "deck-stair-calculator": {
    primary: ["deck-calculator", "deck-railing-calculator", "deck-board-calculator"],
    workflow: ["concrete-stair-calculator", "deck-joist-calculator"],
  },
  "deck-railing-calculator": {
    primary: ["deck-calculator", "deck-stair-calculator", "fence-calculator"],
    workflow: ["fence-cost-calculator", "deck-board-calculator"],
  },
  "fence-calculator": {
    primary: ["fence-post-calculator", "fence-picket-calculator", "fence-panel-calculator"],
    workflow: ["fence-cost-calculator", "gate-calculator"],
  },
  "fence-cost-calculator": {
    primary: ["fence-calculator", "fence-panel-calculator", "fence-post-calculator"],
    workflow: ["gate-cost-calculator", "fence-concrete-calculator"],
  },
  "fence-post-calculator": {
    primary: ["fence-calculator", "fence-concrete-calculator", "fence-cost-calculator"],
    workflow: ["gate-calculator", "fence-picket-calculator"],
  },
  "fence-panel-calculator": {
    primary: ["fence-calculator", "fence-cost-calculator", "fence-picket-calculator"],
    workflow: ["fence-post-calculator", "gate-calculator"],
  },
  "fence-picket-calculator": {
    primary: ["fence-calculator", "fence-panel-calculator", "fence-cost-calculator"],
    workflow: ["fence-post-calculator", "gate-calculator"],
  },
  "fence-concrete-calculator": {
    primary: ["fence-post-calculator", "concrete-footing-calculator", "fence-calculator"],
    workflow: ["concrete-volume-calculator", "concrete-slab-calculator"],
  },
  "gate-calculator": {
    primary: ["fence-calculator", "gate-cost-calculator", "fence-panel-calculator"],
    workflow: ["fence-post-calculator", "deck-railing-calculator"],
  },
  "gate-cost-calculator": {
    primary: ["gate-calculator", "fence-cost-calculator", "fence-calculator"],
    workflow: ["fence-panel-calculator", "fence-post-calculator"],
  },

  // Paver & landscaping
  "paver-calculator": {
    primary: ["paver-cost-calculator", "paver-base-calculator", "paver-sand-calculator"],
    workflow: ["paver-joint-sand-calculator", "gravel-calculator"],
  },
  "paver-cost-calculator": {
    primary: ["paver-calculator", "paver-base-calculator", "concrete-cost-calculator"],
    workflow: ["paver-sand-calculator", "landscaping-cost-calculator"],
  },
  "paver-sand-calculator": {
    primary: ["paver-base-calculator", "paver-calculator", "sand-calculator"],
    workflow: ["paver-joint-sand-calculator", "gravel-calculator"],
  },
  "paver-base-calculator": {
    primary: ["paver-sand-calculator", "gravel-calculator", "paver-calculator"],
    workflow: ["paver-joint-sand-calculator", "concrete-slab-calculator"],
  },
  "paver-joint-sand-calculator": {
    primary: ["paver-calculator", "paver-sand-calculator", "paver-base-calculator"],
    workflow: ["sand-calculator", "paver-cost-calculator"],
  },
  "landscaping-calculator": {
    primary: ["landscaping-cost-calculator", "mulch-calculator", "topsoil-calculator"],
    workflow: ["gravel-calculator", "paver-calculator"],
  },
  "landscaping-cost-calculator": {
    primary: ["landscaping-calculator", "mulch-cost-calculator", "topsoil-cost-calculator"],
    workflow: ["gravel-cost-calculator", "paver-cost-calculator"],
  },
  "mulch-calculator": {
    primary: ["mulch-cost-calculator", "topsoil-calculator", "landscaping-calculator"],
    workflow: ["gravel-calculator", "landscaping-cost-calculator"],
  },
  "mulch-cost-calculator": {
    primary: ["mulch-calculator", "topsoil-cost-calculator", "landscaping-cost-calculator"],
    workflow: ["gravel-cost-calculator", "landscaping-calculator"],
  },
  "retaining-wall-calculator": {
    primary: ["masonry-calculator", "paver-calculator", "concrete-wall-calculator"],
    workflow: ["brick-calculator", "cmu-wall-calculator", "gravel-calculator"],
  },

  // Asphalt & surface
  "asphalt-calculator": {
    primary: ["asphalt-cost-calculator", "asphalt-weight-calculator", "asphalt-thickness-calculator"],
    workflow: ["asphalt-driveway-calculator", "gravel-calculator", "road-base-calculator"],
  },
  "asphalt-cost-calculator": {
    primary: ["asphalt-calculator", "asphalt-driveway-calculator", "asphalt-thickness-calculator"],
    workflow: ["gravel-cost-calculator", "parking-lot-cost-calculator"],
  },
  "asphalt-driveway-calculator": {
    primary: ["asphalt-calculator", "driveway-concrete-calculator", "asphalt-cost-calculator"],
    workflow: ["gravel-calculator", "asphalt-thickness-calculator"],
  },
  "asphalt-weight-calculator": {
    primary: ["asphalt-calculator", "gravel-weight-calculator", "asphalt-thickness-calculator"],
    workflow: ["soil-weight-calculator", "concrete-weight-calculator"],
  },
  "asphalt-thickness-calculator": {
    primary: ["asphalt-calculator", "driveway-thickness-calculator", "slab-thickness-calculator"],
    workflow: ["asphalt-cost-calculator", "asphalt-weight-calculator"],
  },
  "parking-lot-calculator": {
    primary: ["asphalt-calculator", "parking-lot-cost-calculator", "asphalt-thickness-calculator"],
    workflow: ["road-base-calculator", "surface-area-calculator"],
  },
  "parking-lot-cost-calculator": {
    primary: ["parking-lot-calculator", "asphalt-cost-calculator", "asphalt-calculator"],
    workflow: ["gravel-cost-calculator", "surface-area-calculator"],
  },
  "road-base-calculator": {
    primary: ["gravel-calculator", "asphalt-calculator", "gravel-depth-calculator"],
    workflow: ["driveway-thickness-calculator", "paver-base-calculator"],
  },
  "surface-area-calculator": {
    primary: ["gravel-calculator", "asphalt-calculator", "concrete-slab-calculator"],
    workflow: ["flooring-calculator", "paint-calculator"],
  },
  "construction-material-cost-calculator": {
    primary: ["concrete-cost-calculator", "lumber-cost-calculator", "gravel-cost-calculator"],
    workflow: ["deck-cost-calculator", "fence-cost-calculator", "shingle-cost-calculator"],
  },
};

// Public API: get workflow-related slugs for a calculator.
// Returns up to 6 unique slugs from primary + workflow, deduplicated.
export function getWorkflowRelated(slug: string): string[] {
  const adj = workflowAdjacency[slug];
  if (!adj) return [];

  const seen = new Set<string>();
  const out: string[] = [];

  for (const s of [...adj.primary, ...adj.workflow]) {
    if (s !== slug && !seen.has(s)) {
      seen.add(s);
      out.push(s);
      if (out.length >= 6) break;
    }
  }
  return out;
}
