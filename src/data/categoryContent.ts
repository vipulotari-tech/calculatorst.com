// Category page content — per-category intro, guidance, and related links
// Each entry is unique to its category; no shared paragraphs across categories.
// Category guidance is intentionally general. Calculator pages carry formula-specific assumptions and source links where applicable.

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
      "Use a project-specific ordering allowance for form tolerances, uneven subgrade and handling loss; do not treat one waste percentage as universal.",
      "Use the supplier or product yield for the exact mix being ordered; mix design, air content and placement conditions can change actual yield.",
      "Exposure, climate and project specifications can change mix requirements. Confirm the specified concrete mix with the supplier or project documents.",
      "Slab thickness, reinforcement, vapor control and base preparation are design inputs, not outputs of a volume calculator. Use the project plans or local requirements.",
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
    beforeYouCalculate: "Measure length, width and the specified slab thickness. For driveways and patios, get the required thickness, base section and drainage slope from the project design or local requirements rather than assuming a universal value.",
    tips: [
      "Reinforcement type, size and spacing depend on loads, slab design and project requirements; use the rebar calculators only after those inputs are specified.",
      "Joint layout depends on slab geometry, thickness and project specifications. Treat joint spacing as a design input rather than a fixed rule.",
      "Vapor-barrier location and subbase details depend on the floor assembly and project specification; do not add an assumed air gap from this calculator.",
      "Ready-mix suppliers set their own minimum loads, rounding increments, short-load fees and delivery rules. Confirm the order increment with the supplier.",
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
      "Footing width, thickness and embedment depend on loads, soil, frost conditions and local requirements. Enter dimensions from the approved design rather than using a fixed wall-width multiple.",
      "Crawl-space ventilation and conditioned-crawlspace requirements vary by assembly and jurisdiction; verify the applicable code path for the project.",
      "Basement-wall thickness and reinforcement depend on wall height, soil pressure, groundwater and structural design; use the specified dimensions.",
      "Working room, over-excavation and backfill requirements are project-specific. Include only dimensions required by the excavation and foundation plan.",
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
      "Lap splice length is not a universal multiple of bar diameter. Use the splice length shown on the approved reinforcement design or applicable detailing standard.",
      "Rebar chairs or supports maintain the specified bar position and cover. Cover requirements depend on exposure, member type and reinforcement details.",
      "Reinforcement coating and corrosion protection are specification choices tied to exposure conditions; use the material called for in the project documents.",
      "Hook and bend dimensions vary with bar size, hook type and detailing requirements. Use the bend dimensions from the bar schedule or governing standard.",
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
      "A modular brick laid to an approximately 8 in × 2⅝ in nominal face module is about 6.9 bricks per square foot. Use the actual unit and joint dimensions for the final count.",
      "Brick veneer cavity, flashing, drainage and weep details are assembly-specific; follow the wall design and applicable code requirements.",
      "Brick sizes vary widely by manufacturer and product line, so enter the actual face dimensions of the unit being ordered.",
      "Set the waste allowance from the bond pattern, cuts, breakage and project geometry rather than relying on one universal percentage.",
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
      "Grouted-cell and reinforcement spacing come from the structural design. Use the grout calculator only after the cells to be filled are known.",
      "Special units at corners, bond beams and openings should be counted from the wall layout; a generic waste percentage is not a substitute for that takeoff.",
      "Bond beams and reinforcement are design details that depend on wall loading, height and construction; follow the structural drawings.",
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
      "Deck footing embedment and frost protection depend on local requirements, soil and the deck design; use the specified footing depth.",
      "Fence-post hole diameter, embedment and concrete geometry depend on post size, soil, wind exposure and the fence system. Enter the dimensions selected for the project.",
      "Joist span depends on species, grade, member size, spacing and load. Use an approved span table or engineered design rather than inferring capacity from spacing alone.",
      "Guard height and opening limits are code requirements that vary by application and jurisdiction; verify the rules that apply to the project.",
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
      "Guard height and opening limits depend on the adopted code and project condition; verify them before using a material takeoff.",
      "Stair rise, run and uniformity limits are code-sensitive. Use the calculator for geometry, then verify the resulting layout against the adopted requirements.",
      "Use connectors approved for the member size, fasteners, treatment chemistry and exposure condition specified by the connector manufacturer.",
      "Deck-board gaps depend on moisture content and product instructions. Follow the decking manufacturer’s installation spacing rather than using a universal spacer.",
      "Beam size cannot be inferred from joist depth alone. Span, tributary load, species, grade, ply count and support conditions all affect beam selection.",
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
      "Paint and primer coverage vary by product, surface and application. Enter the coverage printed on the selected product rather than relying on a generic rate.",
      "Use the paint calculator's ceiling and wall separation feature — ceiling white and wall color usually need different gallons.",
      "Spray-foam thermal performance varies by formulation and installed thickness. Use the product data sheet for coverage and thermal values.",
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
      "Excavation swell is material- and condition-specific. Enter a project-appropriate swell factor or use measured haul volumes when available.",
      "OSHA generally requires cave-in protection at 5 ft or greater unless the excavation is entirely in stable rock; shallower excavations can also require protection when a competent person identifies a cave-in hazard.",
      "Call 811 before any excavation — utility strikes cause injury, delays and cost overruns.",
      "Backfill material, lift thickness and compaction criteria should follow the project specification and equipment limitations rather than a universal lift depth.",
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
      "Post length and embedment depend on fence height, wind exposure, soil and the fence system. Use the selected post and footing design rather than a fixed one-third rule.",
      "Concrete for a 12-inch-diameter × 24-inch-deep cylindrical hole is about 1.57 ft³ before subtracting post volume. At 0.45 ft³ mixed yield per 60-lb bag, that is about 3.5 bags before any allowance; use the exact bag yield and post dimensions.",
      "Gate-post footing size depends on gate width, weight, hardware, wind and soil. Use the gate or fence system requirements for footing dimensions.",
      "Slope the top of concrete post holes away from the post to shed water — water pooled against the post rots wood from below.",
      "For sloped terrain, choose stepped fencing (panels step down with the slope) or racked fencing (panels follow the angle) — each affects material count.",
      "Post spacing is controlled by the selected fence or panel system. Use the manufacturer’s panel width and installation requirements.",
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
      "Flooring allowance depends on board length, room geometry, pattern and manufacturer guidance. Set waste from the actual layout rather than a fixed percentage.",
      "Tile allowance depends on layout, pattern, tile size, cuts and spare-stock requirements. Use a project-specific allowance.",
      "Underlayment requirements vary by flooring product, substrate and installation method. Follow the flooring-system instructions.",
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
    beforeYouCalculate: "Measure wall length and height for stud counts and enter the on-center spacing specified for the wall. Joist, header and beam spans depend on species, grade, member size, spacing and loads, so use the applicable span table or engineered design.",
    tips: [
      "Common wall layouts may use 16 or 24 inches on center, but the required spacing comes from the wall design. The calculator counts members from the spacing you enter.",
      "Do not estimate beam capacity from nominal size alone. Span, load, species/grade or engineered-product properties and support conditions all matter.",
      "Opening framing details, including king/jack studs and headers, depend on the wall design and load path; take them from the plans or applicable framing details.",
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
      "A roofing square is 100 ft², but bundles per square and bundle coverage vary by shingle product. Use the manufacturer’s package coverage and a project-specific allowance.",
      "Starter, ridge-cap, drip-edge and flashing quantities are separate linear takeoffs based on the measured eaves, rakes, ridges, hips and valleys.",
      "Underlayment and ice-barrier requirements depend on roof system, climate and adopted code. Verify the required assembly for the project.",
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
      "Suppliers set their own order increments, minimum loads and delivery fees. Confirm whether the quote is by ton, cubic yard or truckload.",
      "Landscape fabric, layer depth and drainage details depend on the application; do not assume the same section works for decorative beds, paths and structural bases.",
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
      "Paver base and bedding thickness depend on soil, climate, traffic and the selected paving system. Use the section specified for the project.",
      "Retaining-wall design requirements depend on height, retained soil, surcharge, drainage and local rules. Taller or loaded walls may require engineered design.",
      "Mulch at 3-inch depth covers about 108 sq ft per cubic yard — less if you need fewer inches, more for deeper beds.",
      "Joint material should match the paver system and manufacturer instructions; climate alone is not enough to select a joint product.",
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
      "Mortar type is a project specification, not a choice the quantity calculator should make. Use the mortar type required for the masonry assembly and exposure.",
      "Grout for CMU walls: flowable grout fills cores by gravity; use the grout calculator with actual core dimensions, not nominal block size.",
      "Use the mixed yield stated on the exact mortar product. Coverage per bag changes with unit size, joint dimensions and waste, so calculate from product yield rather than a universal brick count.",
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
    beforeYouCalculate: "Measure the paved area and use the compacted asphalt thickness specified for the pavement section. Enter the mix density supplied for the material when available and keep aggregate base quantities as a separate layer.",
    tips: [
      "Asphalt tonnage = compacted volume × the selected mix density. A planning density can be used for an early estimate, but supplier or mix-design density is better for ordering.",
      "Asphalt and aggregate-base thicknesses are pavement-design inputs. Calculate each layer separately using the specified compacted thickness.",
      "Coverage per ton depends on compacted thickness and mix density. Calculate it from those two inputs rather than using a fixed square-yard-per-ton rule.",
      "Parking-lot pavement sections vary with traffic, subgrade and local specifications. Enter the designed asphalt and aggregate-base thicknesses rather than generic defaults.",
    ],
    relatedCategories: [
      { name: "Gravel & Aggregate", href: "/construction/gravel/", reason: "Crushed stone base under asphalt" },
      { name: "Concrete", href: "/construction/concrete/", reason: "Concrete curbs and gutters adjacent to asphalt" },
      { name: "Slab, Patio & Driveway", href: "/construction/slab-patio-driveway/", reason: "Driveway thickness and cost" },
    ],
  },
};
