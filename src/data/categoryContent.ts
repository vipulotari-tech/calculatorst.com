// Category page content — per-category intro, guidance, and related links
// Each entry is unique to its category; no shared paragraphs across categories.
// Sources: common construction practice, NIST SP 811, TxDOT, CPSC, manufacturer data.

export interface CategoryContent {
  intro: string;              // What the category covers and when to use these calculators
  beforeYouCalculate: string; // Measurements and info to gather first
  tips: string[];             // Category-specific practical tips or common mistakes
  relatedCategories: { name: string; href: string; reason: string }[]; // Contextual cross-links
}

// Map URL slug → internal cluster key (most are identical, some differ)
export const slugToCluster: Record<string, string> = {
  concrete: "concrete",
  "slab-patio-driveway": "slab",
  foundation: "foundation",
  rebar: "rebar",
  "brick-masonry": "brick",
  "concrete-block": "cmu",
  "mortar-grout-cement": "mortar",
  gravel: "gravel",
  excavation: "excavation",
  framing: "framing",
  roofing: "roofing",
  flooring: "flooring",
  "drywall-paint": "drywall",
  "deck-fence": "deck-fence",
  decking: "deck-fence",
  fencing: "deck-fence",
  landscaping: "landscaping",
  asphalt: "asphalt",
};

export const categoryContent: Record<string, CategoryContent> = {
  "concrete": {
    intro: "Concrete is the most-used construction material on earth — and one of the easiest to miscalculate. Whether you are pouring a slab, building a stem wall, or setting a mailbox post, these calculators cover volume, weight, cost, mix design and waste for every common concrete shape.",
    beforeYouCalculate: "Measure the exact length, width and thickness of the pour area in feet and inches. Note whether the project is a slab, footing, wall, column, tube or curb — each shape has a different formula. Check your local ready-mix batch plant for yield per bag and any additive requirements for cold-weather pours.",
    tips: [
      "Always add a 5–10% waste factor — concrete is easy to underestimate and short loads cost more than a little extra in the truck.",
      "Slump (consistency) affects yield. Stiff mixes settle less; soupy mixes can shrink more than you calculated.",
      "In cold weather, air-entrained mixes are standard above grade. Check your supplier for local requirements.",
      "A 4-inch slab over 6-mil vapor barrier is typical for interior floors. Exterior slabs often need 6 inches with compacted base.",
    ],
    relatedCategories: [
      { name: "Slab, Patio & Driveway", href: "/construction/slab-patio-driveway/", reason: "Dedicated calculators for patio and driveway pours" },
      { name: "Rebar & Reinforcement", href: "/construction/rebar/", reason: "Most concrete projects need reinforcement sizing" },
      { name: "Gravel & Aggregate", href: "/construction/gravel/", reason: "Sub-base gravel depth affects total project depth" },
      { name: "Foundation & Footing", href: "/construction/foundation/", reason: "Footing volume is separate from slab volume" },
    ],
  },

  "slab-patio-driveway": {
    intro: "Slabs, patios and driveways are the projects most homeowners tackle with concrete. A 4-inch patio slab and an 8-inch driveway slab are not the same pour — thickness alone changes the volume by a factor of two. These calculators break each project type into its own inputs so you are not guessing.",
    beforeYouCalculate: "Measure length, width and desired thickness. For driveways, check local code for minimum thickness (often 4–6 inches for passenger vehicles, 6–8 inches for RVs). Note whether you need a compacted gravel base underneath — that adds depth. For patios, plan for drainage slope (1/8 to 1/4 inch per foot away from the house).",
    tips: [
      "Driveway slabs over 6 inches thick should use rebar or wire mesh — see the rebar calculators for spacing and lap rules.",
      "Patio and walkway slabs often need control joints every 8–12 feet to control random cracking.",
      "A 1.5-inch air gap under the vapor barrier reduces moisture wicking in garage slabs.",
      "Order concrete in whole-yard increments — most batch plants have a 1-yard minimum per load.",
    ],
    relatedCategories: [
      { name: "Concrete", href: "/construction/concrete/", reason: "General concrete volume, cost and mix calculators" },
      { name: "Foundation & Footing", href: "/construction/foundation/", reason: "Shed footings and garage footings" },
      { name: "Rebar & Reinforcement", href: "/construction/rebar/", reason: "Reinforcement for slabs and driveways" },
      { name: "Gravel & Aggregate", href: "/construction/gravel/", reason: "Sub-base material for driveways and patios" },
    ],
  },

  foundation: {
    intro: "Foundation work starts below grade and rarely gets a second chance. Footing size depends on soil bearing capacity, wall load, and frost depth — not just guesswork. These calculators cover excavation, footing volume, foundation wall materials and crawl space estimates.",
    beforeYouCalculate: "Know your local frost depth (check county building code) and soil bearing capacity (a soils report or local geotech data). Measure the building footprint, wall height, and whether the foundation includes a basement, crawl space or slab-on-grade. Account for any waterproofing or drainage board on exterior walls.",
    tips: [
      "Strip footings typically run 2× the wall width and at least 12 inches below frost depth — verify with local code.",
      "Crawl space walls need ventilation openings of 1 sq ft per 150 sq ft of crawl space area, per IRC R408.1.",
      "Basement walls are typically 8–10 inches thick — check your engineer or local code for lateral load requirements.",
      "Always over-excavate by 6–12 inches and backfill with compacted fill; soft backfill settles.",
    ],
    relatedCategories: [
      { name: "Concrete", href: "/construction/concrete/", reason: "Footing and wall concrete volume" },
      { name: "Rebar & Reinforcement", href: "/construction/rebar/", reason: "Vertical and horizontal steel in footings and walls" },
      { name: "Excavation & Earthwork", href: "/construction/excavation/", reason: "Excavation and backfill volumes" },
      { name: "Foundation & Footing", href: "/construction/foundation/", reason: "Structural layout before finish work" },
    ],
  },

  rebar: {
    intro: "Rebar (reinforcing bar) provides the tensile strength that concrete lacks. Get the spacing, weight, length or cost wrong and you either waste money on excess steel or compromise the structure. These calculators cover every common rebar task from grid layout to lap splice length.",
    beforeYouCalculate: "Know your rebar size (#3 through #7 are most common for residential), the spacing layout (on-center in each direction), the total length of each mat, and whether the bars need lapping. For footings, measure the width and length to determine how many bars fit per row.",
    tips: [
      "Standard lap splice is 40 bar diameters in tension, 30 in compression — but check your project engineer.",
      "Rebar chairs or dobies keep bars at the right concrete cover depth (usually 1.5–3 inches depending on exposure).",
      "Epoxy-coated rebar costs more but is required in many coastal or deicing-salt environments.",
      "Don't forget hook lengths at bends — a standard 90-degree bend adds 12 bar diameters to the required length.",
    ],
    relatedCategories: [
      { name: "Concrete", href: "/construction/concrete/", reason: "Concrete volume to cover the rebar you sized" },
      { name: "Foundation & Footing", href: "/construction/foundation/", reason: "Footing rebar is the most common use case" },
      { name: "Concrete Block & CMU", href: "/construction/concrete-block/", reason: "CMU grout and vertical reinforcement" },
    ],
  },

  "brick-masonry": {
    intro: "Masonry work spans structural brick walls, veneer, patios and decorative paving. Each application has different mortar joints, waste factors and unit sizes. These calculators cover brick quantity, mortar volume, wall area and cost across every common masonry project.",
    beforeYouCalculate: "Measure the wall area (length × height) or paved area in square feet. Know your brick or block dimensions (standard modular brick is approximately 3-5/8 × 2-1/4 × 7-5/8 inches). Decide on mortar joint thickness (typically 3/8 inch). Check local code for veneer clearance and weep-slot requirements.",
    tips: [
      "A standard modular brick covers about 4.5 bricks per sq ft with a 3/8-inch mortar joint — but always verify with your actual unit size.",
      "Brick veneer over sheathing needs a 1-inch air gap and weep holes at the bottom course.",
      "Modular brick has seven standard sizes (modular, Norman, Roman, etc.) — confirm which type you are ordering.",
      "Order 5–10% extra brick for waste, cutting and future repairs — matching brick colors years later is nearly impossible.",
    ],
    relatedCategories: [
      { name: "Mortar, Grout & Cement", href: "/construction/mortar-grout-cement/", reason: "Mortar and grout quantity for brick and block walls" },
      { name: "Paver & Landscaping", href: "/construction/landscaping/", reason: "Brick pavers and patio layouts" },
      { name: "Concrete Block & CMU", href: "/construction/concrete-block/", reason: "Structural masonry with concrete blocks" },
    ],
  },

  "concrete-block": {
    intro: "Concrete masonry units (CMUs) — commonly called concrete blocks — are the backbone of structural masonry walls, foundations and retaining walls. Unlike brick, CMU dimensions are nominal and actual dimensions differ (a 8×8×16 block is actually 7-5/8 × 7-5/8 × 15-5/8 inches). These calculators account for the real unit size and mortar fill.",
    beforeYouCalculate: "Know the nominal block size (8×8×16 is standard), wall thickness (8-inch or 12-inch nominal), and wall height and length. Factor in mortar joint thickness (3/8 inch standard) and whether cores will be grouted for reinforcement. Check local code for required grout spacing.",
    tips: [
      "A standard 8×8×16 CMU covers 1.125 blocks per sq ft of wall face — but the actual block is smaller than the nominal dimension.",
      "Every third or fourth core is typically grouted with rebar for structural walls — use the grout calculator for fill volume.",
      "Half-blocks, corner blocks and bond-beam blocks are needed at openings and corners — add 2–3% for these cuts.",
      "CMU walls over 8 feet tall may need intermediate bond beams — check your structural drawings.",
    ],
    relatedCategories: [
      { name: "Rebar & Reinforcement", href: "/construction/rebar/", reason: "Vertical and horizontal steel in CMU cores" },
      { name: "Mortar, Grout & Cement", href: "/construction/mortar-grout-cement/", reason: "Mortar for laying blocks and grout for fill" },
      { name: "Foundation & Footing", href: "/construction/foundation/", reason: "CMU foundation walls and footings" },
    ],
  },

  "deck-fence": {
    intro: "Decks and fences share structural logic — posts set in concrete, joists or rails spaced on-center, and boards spanning between — but the load profiles and code requirements differ. Deck calculators focus on floor systems and railings; fence calculators focus on post schedules, panels and privacy layouts.",
    beforeYouCalculate: "For decks: measure the overall span, joist spacing (12 or 16 inches on-center typical), post locations and whether the deck is attached to the house or freestanding. For fences: measure the total linear footage, desired height, post spacing (6–8 feet typical), and whether you are using panels or individual pickets.",
    tips: [
      "Deck footings in cold climates must go below frost depth — same rule as house foundations.",
      "Fence posts set in concrete should be 6–8 inches in diameter and extend 6 inches above grade.",
      "Deck joists over 16 inches on-center need engineered I-joists or deeper lumber for longer spans — check span tables.",
      "Set deck railings at 36 inches minimum height (42 in some jurisdictions) with baluster spacing under 4 inches.",
    ],
    relatedCategories: [
      { name: "Concrete", href: "/construction/concrete/", reason: "Post footings and concrete pads" },
      { name: "Foundation & Footing", href: "/construction/foundation/", reason: "Deck footing sizing" },
      { name: "Gravel & Aggregate", href: "/construction/gravel/", reason: "Gravel base under deck footings" },
    ],
  },

  "decking": {
    intro: "Deck-only calculators focus on the deck surface system: board layouts, joist spacing, stair stringers, railing heights and ledger connections. If you also need fence or gate estimates, see the broader Deck, Fence & Outdoor category — but this page covers every deck-specific calculation in one place.",
    beforeYouCalculate: "Decide on board material (pressure-treated lumber, cedar, composite, PVC) — each has a different waste factor and expansion gap. Measure the deck footprint (length × width), note whether it's a single-level or multi-level structure, and identify any stairs or railings. For ledger attachments, identify the rim joist material and joist spacing of the house. Determine your local snow and live load requirements — they affect joist span.",
    tips: [
      "Pressure-treated lumber boards typically run 5/4 × 6 nominal (1-inch thick × 5-1/2 inch face) — composite boards are usually 5/4 × 5-1/2 inch face.",
      "Joist span tables depend on lumber species (Southern Pine spans further than SPF) and grade (#2 vs #1) — check the IRC span tables or your local building department.",
      "Deck railing height is 36 inches minimum for residential, 42 inches in some jurisdictions — IRC Table R301.5 governs.",
      "Stair treads must be uniform within 3/8 inch — use the deck stair calculator to plan the rise and run precisely.",
      "Joist hangers must match the lumber depth — a 2×10 joist needs a 2×10 hanger, and never use hangers with rust on a deck.",
      "Deck board spacing: use a 16d nail as a spacer between boards for pressure-treated, or follow the manufacturer's gap spec for composite.",
      "A beam supporting a deck is typically one size larger than the joists it carries — 2×10 joists usually need a 2×12 or double 2×10 beam.",
    ],
    relatedCategories: [
      { name: "Deck, Fence & Outdoor", href: "/construction/deck-fence/", reason: "Combined deck + fence calculators" },
      { name: "Framing & Lumber", href: "/construction/framing/", reason: "Lumber calculations for deck framing" },
      { name: "Concrete", href: "/construction/concrete/", reason: "Deck footing concrete" },
      { name: "Gravel & Aggregate", href: "/construction/gravel/", reason: "Gravel base for deck footings" },
    ],
  },

  "drywall-paint": {
    intro: "Interior finish work starts with drywall sheets and ends with paint. Getting the right number of drywall sheets, joint compound coats, screws, paint gallons and insulation batts requires accurate room measurements and waste factors for door and window openings.",
    beforeYouCalculate: "Measure wall and ceiling lengths and heights. Count doors, windows and openings that reduce coverage. Note whether you are using 4×8 or 4×12 sheets (4×12 reduces seams and waste). For paint, note the number of coats needed — new drywall needs primer plus at least one finish coat.",
    tips: [
      "Drywall sheets cover 32 or 48 sq ft each — calculate gross wall area, subtract openings, then add 5–10% waste for cuts.",
      "Paint coverage rates vary: primer typically covers 300–400 sq ft/gal, finish paint 350–400 sq ft/gal on drywall.",
      "Use the paint calculator's ceiling and wall separation feature — ceiling white and wall color usually need different gallons.",
      "Spray-foam insulation R-value depends on thickness: closed-cell at 1 inch ≈ R-6, open-cell at 1 inch ≈ R-3.5.",
    ],
    relatedCategories: [
      { name: "Flooring & Tile", href: "/construction/flooring/", reason: "Flooring underlayment after drywall" },
      { name: "Framing & Lumber", href: "/construction/framing/", reason: "Wall studs and framing behind drywall" },
    ],
  },

  excavation: {
    intro: "Excavation is the invisible cost of most construction projects. A trench for footings, a basement cut, or a pad for a driveway — each has different volume, soil type and equipment considerations. These calculators cover excavation volume, trench backfill, cut-and-fill and soil weight.",
    beforeYouCalculate: "Measure the length, width and depth of the excavation area. Know the soil type (sand, clay, gravel, topsoil) because it affects both volume swell and equipment choice. For trenches, note the width, depth and whether the bottom is flat or benched for safety. Check for underground utilities before digging.",
    tips: [
      "Excavated soil swells 10–30% when moved — a 10-cubic-yard excavation may produce 12–13 cubic yards of loose material.",
      "Trenches over 5 feet deep need shoring or sloping per OSHA 1926 — safety is not optional.",
      "Call 811 before any excavation — utility strikes cause injury, delays and cost overruns.",
      "Backfill in 6–8 inch lifts and compact each layer — uncontrolled backfill settles 2–4 inches per foot of fill.",
    ],
    relatedCategories: [
      { name: "Foundation & Footing", href: "/construction/foundation/", reason: "Foundation excavation depth" },
      { name: "Gravel & Aggregate", href: "/construction/gravel/", reason: "Gravel sub-base and backfill material" },
      { name: "Concrete", href: "/construction/concrete/", reason: "Concrete to fill excavated footings" },
    ],
  },

  fencing: {
    intro: "Fence installation is part layout, part materials list, and part concrete. Getting post spacing right, estimating concrete for each hole, and calculating picket or rail counts are the three tasks these calculators handle for wood, vinyl and chain-link fence projects.",
    beforeYouCalculate: "Measure the total linear footage of fence line. Note the fence height, post spacing (typically 6–8 feet), and whether you are using pre-assembled panels or individual pickets/rails. Check local code for height limits and setback requirements. Measure post hole depth — typically 1/3 of the post length underground.",
    tips: [
      "A 6-foot fence needs posts at least 8 feet long (2 feet underground) in most soils — add 6 inches more for gravel drainage.",
      "Concrete for post holes: a 12-inch diameter hole × 24 inches deep ≈ 1.4 cubic feet per hole — about 1/3 of a 60-lb bag.",
      "Gate posts need concrete footings at least 12 inches in diameter — the gate's weight and lever arm create much more force than a line post.",
      "Slope the top of concrete post holes away from the post to shed water — water pooled against the post rots wood from below.",
      "For sloped terrain, choose stepped fencing (panels step down with the slope) or racked fencing (panels follow the angle) — each affects material count.",
      "Vinyl fence post spacing can be longer than wood — typically 8 feet vs 6 feet — because vinyl panels are rigid.",
    ],
    relatedCategories: [
      { name: "Deck, Fence & Outdoor", href: "/construction/deck-fence/", reason: "Deck calculators alongside fence tools" },
      { name: "Concrete", href: "/construction/concrete/", reason: "Concrete for post footings" },
      { name: "Gravel & Aggregate", href: "/construction/gravel/", reason: "Gravel base for post holes" },
      { name: "Framing & Lumber", href: "/construction/framing/", reason: "Lumber for wood fence rails" },
    ],
  },

  flooring: {
    intro: "Flooring estimates go well beyond room area. Waste factors, underlayment, transition strips, and subfloor preparation all affect the final material count and cost. These calculators cover hardwood, laminate, vinyl plank, carpet and tile with per-material waste rules.",
    beforeYouCalculate: "Measure the room length and width, then subtract closets if they get a different flooring type. Note the flooring material — hardwood and tile have different waste factors (hardwood runs with the grain, tile needs cuts for pattern). Check subfloor flatness; major dips may need leveling compound before installation.",
    tips: [
      "Hardwood flooring typically needs 5–10% waste for diagonal installs or rooms with lots of angles — straight runs can be closer to 3–5%.",
      "Tile waste: grid pattern ≈ 5%, diagonal ≈ 10%, mosaic patterns ≈ 15% — more waste when cuts are frequent.",
      "Underlayment is needed under laminate and engineered hardwood but not under nail-down hardwood or tile.",
      "Buy extra tile of the same batch number — manufacturing color shifts between batches are visible.",
    ],
    relatedCategories: [
      { name: "Drywall & Paint", href: "/construction/drywall-paint/", reason: "Drywall sheets under flooring and paint above" },
      { name: "Drywall & Paint", href: "/construction/drywall-paint/", reason: "Drywall sheets under flooring" },
      { name: "Gravel & Aggregate", href: "/construction/gravel/", reason: "Sand or crushed stone base under tile" },
    ],
  },

  framing: {
    intro: "Framing is the skeleton of any building — studs, plates, joists, headers and rafters. Getting it wrong means ordering too much lumber or, worse, building walls that are not square and level. These calculators cover wall framing layouts, board-foot estimates, joist spacing and beam sizing.",
    beforeYouCalculate: "Measure wall length and height for stud counts (studs every 16 inches on-center is standard in residential framing). Know the span tables for joists and beams — span depends on lumber species, grade and load (live load vs dead load). Measure openings for header sizing (lintels over doors and windows).",
    tips: [
      "Standard stud layout is 16 inches on-center — add one stud at each end, then divide the remaining wall length by 16 inches.",
      "A triple 2×10 or engineered LVL may span 16–20 feet as a beam — check the IRC span tables or your engineer for exact spans.",
      "Headers over exterior walls need full-length king studs that run from bottom plate to top plate on each side of the opening.",
      "Board-foot = thickness(in) × width(in) × length(ft) ÷ 12 — this is the lumber industry's standard unit and what sawmills price by.",
    ],
    relatedCategories: [
      { name: "Roofing", href: "/construction/roofing/", reason: "Rafter and truss calculators for roof framing" },
      { name: "Drywall & Paint", href: "/construction/drywall-paint/", reason: "Drywall sheets after framing" },
      { name: "Flooring & Tile", href: "/construction/flooring/", reason: "Floor sheathing and subfloor" },
    ],
  },

  roofing: {
    intro: "A roof is geometry, slope and material waste combined. Roof pitch (rise over 12 inches of run) changes the actual surface area far more than the footprint suggests. These calculators cover roof area, pitch, shingle quantities, rafter lengths and truss sizing for gable, hip and shed roofs.",
    beforeYouCalculate: "Measure the building footprint (length × width) and know the roof pitch (e.g., 6/12, 8/12). Determine the roof type — gable, hip, gambrel or shed — because each has a different pitch multiplier. Note the overhang (eaves) and any dormers or intersecting roofs. Check local code for minimum roof slope by material.",
    tips: [
      "Pitch multiplier = √(pitch² + 144) ÷ 12 — a 6/12 roof is 1.118× the footprint, an 8/12 is 1.205×.",
      "Shingle bundles cover about 33.3 sq ft (one bundle = one-third of a square = 100 sq ft). Plan for 5–10% waste depending on roof complexity.",
      "Drip edge, starter strip and ridge cap add material not captured by shingle count alone — add 5 linear feet per eave/rake.",
      "Ice and water shield underlayment is required in most northern climates — check your local building code for the minimum exposure.",
    ],
    relatedCategories: [
      { name: "Framing & Lumber", href: "/construction/framing/", reason: "Rafters, trusses and framing lumber" },
      { name: "Siding & Trim", href: "/construction/roofing/", reason: "Roof-to-siding transitions" },
      { name: "Gravel & Aggregate", href: "/construction/gravel/", reason: "Roof gravel for built-up or tar-and-gravel roofs" },
    ],
  },

  gravel: {
    intro: "Gravel, crushed stone, sand and topsoil are the invisible base layers that support every hardscape project. The wrong depth or density means a driveway that sinks or a patio that shifts. These calculators cover gravel volume, weight, cost and depth for driveways, backfill, drainage and landscaping beds.",
    beforeYouCalculate: "Measure the area and desired depth in inches. Know the material type — pea gravel, crushed stone, limestone, sand and topsoil each have different densities and compaction behavior. For driveways, check local code for minimum base depth (typically 4–6 inches of compacted base). For drainage, note the slope and whether the material is for French drain backfill or surface drainage.",
    tips: [
      "Pea gravel compacts poorly — use it for drainage and decoration, not structural base. Crushed stone compacts well and is better for driveways.",
      "Gravel density: pea gravel ≈ 1.35 tons/yd³, crushed stone ≈ 1.40, limestone ≈ 1.60 — use the right density for accurate weight estimates.",
      "Order gravel in whole tons or cubic yards — most suppliers have a 1-ton or 1-yard minimum per load.",
      "A 2-inch layer of pea gravel over landscape fabric suppresses weeds while allowing drainage — do not skip the fabric.",
    ],
    relatedCategories: [
      { name: "Concrete", href: "/construction/concrete/", reason: "Concrete over gravel sub-base" },
      { name: "Paver & Landscaping", href: "/construction/landscaping/", reason: "Paver base and landscaping rock" },
      { name: "Slab, Patio & Driveway", href: "/construction/slab-patio-driveway/", reason: "Driveway gravel base depth" },
      { name: "Excavation & Earthwork", href: "/construction/excavation/", reason: "Excavation volume and backfill" },
    ],
  },

  landscaping: {
    intro: "Landscaping materials cover pavers, retaining walls, mulch and decorative rock. Unlike structural construction, landscaping is often about aesthetics as much as function — but the math is just as important. These calculators cover paver layouts, retaining wall blocks, mulch volume and edging.",
    beforeYouCalculate: "Measure the area to be paved or mulched in square feet. Note the paver size and joint sand width. For retaining walls, measure the wall length and height, and note whether you need geogrid reinforcement for walls over 3–4 feet. For mulch, measure the area and desired depth (2–3 inches is typical for beds).",
    tips: [
      "Paver base: 4–6 inches of compacted crushed stone, then 1 inch of bedding sand — both layers must be compacted before pavers go down.",
      "Retaining walls over 4 feet tall typically need engineering and drainage behind the wall (weep holes or perforated pipe).",
      "Mulch at 3-inch depth covers about 108 sq ft per cubic yard — less if you need fewer inches, more for deeper beds.",
      "Use polymeric joint sand for pavers in cold climates — it hardens and resists weed growth better than regular sand.",
    ],
    relatedCategories: [
      { name: "Gravel & Aggregate", href: "/construction/gravel/", reason: "Paver base gravel and drainage rock" },
      { name: "Retaining Walls", href: "/construction/landscaping/", reason: "Retaining wall block calculators" },
      { name: "Concrete", href: "/construction/concrete/", reason: "Concrete footings for retaining walls" },
    ],
  },

  "mortar-grout-cement": {
    intro: "Mortar, grout and cement are the bonding agents that hold masonry together — but they are not the same material. Mortar bonds masonry units (brick, block), grout fills hollow cores and joints, and cement is the powder that, when mixed with sand and water, becomes either. These calculators cover each material's quantity, cost and mix proportions.",
    beforeYouCalculate: "Know the masonry unit size, joint thickness and whether you are laying brick, block or stone. Mortar is batched by the bag (typically 80 lb covers about 30–36 sq ft of brick wall). Grout volume depends on core volume of the block and whether cores are fully or partially filled. Cement bag calculations depend on mix ratio (1:2:3, 1:1:6, etc.).",
    tips: [
      "Type S mortar is stronger than Type N — use Type S for below-grade or structural masonry, Type N for above-grade non-structural.",
      "Grout for CMU walls: flowable grout fills cores by gravity; use the grout calculator with actual core dimensions, not nominal block size.",
      "A standard 80-lb bag of mortar mix yields about 0.7 cu ft of mixed mortar — enough for roughly 30–36 modular bricks.",
      "Cement by itself is not mortar or concrete — it needs sand (and lime for mortar) to function as a bonding agent.",
    ],
    relatedCategories: [
      { name: "Brick & Masonry", href: "/construction/brick-masonry/", reason: "Mortar for brick walls and veneer" },
      { name: "Concrete Block & CMU", href: "/construction/concrete-block/", reason: "Grout for CMU cores" },
      { name: "Concrete", href: "/construction/concrete/", reason: "Concrete mix and pour calculators" },
    ],
  },


  asphalt: {
    intro: "Asphalt paving calculations differ from concrete because the material is sold by weight (tons) rather than volume, and the compaction factor matters. These calculators cover asphalt volume, weight, cost, driveway thickness and parking lot sizing.",
    beforeYouCalculate: "Measure the area to be paved (length × width) and the compacted thickness (typically 2–3 inches for driveways, 3–4 inches for parking lots). Know the asphalt density (≈ 145 lb/ft³ compacted) and your local supplier's price per ton. Check whether the base is already compacted or if you need to account for base material.",
    tips: [
      "Hot-mix asphalt density ≈ 145 lb/ft³ compacted. Multiply area × thickness (ft) × 145 to get pounds, then divide by 2000 for tons.",
      "Driveway asphalt is typically 2–3 inches thick over a 4-inch crushed stone base — the base and asphalt are separate calculations.",
      "Asphalt is sold by the ton, but installed by the square yard — one ton of 2-inch asphalt covers about 8–9 sq yd.",
      "Parking lots typically use 3–4 inches of asphalt over 6–8 inches of aggregate base — check local specs for required thickness.",
    ],
    relatedCategories: [
      { name: "Gravel & Aggregate", href: "/construction/gravel/", reason: "Crushed stone base under asphalt" },
      { name: "Concrete", href: "/construction/concrete/", reason: "Concrete curbs and gutters adjacent to asphalt" },
      { name: "Slab, Patio & Driveway", href: "/construction/slab-patio-driveway/", reason: "Driveway thickness and cost" },
    ],
  },
};
