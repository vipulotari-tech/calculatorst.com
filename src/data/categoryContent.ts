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
    intro: "Slab, patio and driveway estimates involve different decisions: concrete quantity, inverse thickness/coverage, reinforcement takeoff, project cost and delivery planning. These 10 calculators keep those tasks separate while sharing consistent units, allowances and worked formulas.",
    beforeYouCalculate: "Measure the finished footprint and gather the thickness, base depth, reinforcement spacing or cost quote required by the specific calculator. Treat structural thickness, reinforcement, joints and foundation dimensions as project inputs from the plans, applicable requirements or qualified designer — not defaults selected by a quantity calculator.",
    tips: [
      "Use the quantity calculator for the actual project shape; use the thickness calculator only when solving or comparing the area-volume-depth relationship.",
      "For tapered driveways, measure both end widths and the full length. For a separate apron, measure it independently and avoid counting the same area inside the main driveway rectangle.",
      "Rebar size, spacing and edge position are design inputs. The reinforcement calculator converts a specified grid into bar count, cut length and weight; it does not select reinforcement.",
      "Base quantities are reported as compacted volume. Loose delivered gravel can require a supplier-specific conversion.",
      "Ready-mix truck capacity, short-load rules, minimum orders and rounding increments vary by supplier. Use the supplier quote for purchasing decisions.",
    ],
    relatedCategories: [
      { name: "Concrete", href: "/construction/concrete/", reason: "General concrete volume, cost and mix calculators" },
      { name: "Foundation & Footing", href: "/construction/foundation/", reason: "Shed footings and garage footings" },
      { name: "Rebar & Reinforcement", href: "/construction/rebar/", reason: "Reinforcement for slabs and driveways" },
      { name: "Gravel & Aggregate", href: "/construction/gravel/", reason: "Sub-base material for driveways and patios" },
    ],
  },

  foundation: {
    intro: "Foundation estimating involves several separate tasks: excavation, strip/pad/pier footing concrete, wall concrete, basement or crawl-space geometry and quote-based project cost. These 10 calculators keep those intents separate while using consistent units, allowances and transparent formulas.",
    beforeYouCalculate: "Use dimensions from the approved foundation plan or qualified designer. Gather the finished concrete geometry, opening areas, excavation working room, soil swell or overbreak assumptions and current supplier/contractor quotes required by the specific calculator. These tools estimate quantities and entered costs; they do not select bearing capacity, frost depth, footing size or reinforcement.",
    tips: [
      "Use centerline length for connected strip footings and foundation walls so corners are not double-counted.",
      "Keep bank excavation, overbreak and loose-volume swell conceptually separate. Swell converts in-place soil to hauled volume; it is not another concrete or excavation waste allowance.",
      "Use the dedicated Strip, Pad or Pier Footing Calculator for project-specific outputs; use Footing Volume for pure geometry and Footing Concrete for bags, weight and cost.",
      "Basement and crawl-space wall calculators deduct openings by face area × wall thickness. Footings, slabs, waterproofing and drainage remain separate unless explicitly entered in a cost calculator.",
      "Foundation dimensions, reinforcement, soil support and frost embedment are design inputs. Confirm them from the project requirements rather than treating calculator defaults as recommendations.",
    ],
    relatedCategories: [
      { name: "Concrete", href: "/construction/concrete/", reason: "General concrete volume, mix, pour and weight tools" },
      { name: "Rebar & Reinforcement", href: "/construction/rebar/", reason: "Steel takeoff after reinforcement is specified" },
      { name: "Excavation & Earthwork", href: "/construction/excavation/", reason: "Trench, cut/fill, backfill and soil-volume workflows" },
      { name: "Slab, Patio & Driveway", href: "/construction/slab-patio-driveway/", reason: "Slab thickness, reinforcement and cost tools" },
    ],
  },

  rebar: {
    intro: "Rebar estimating involves several different jobs: laying out a grid, converting that grid to purchasing quantity, checking nominal weight, pricing stock, solving equal center spacing, totaling specified lap steel, and estimating mesh or support chairs. These 10 calculators keep those intents separate while using consistent units and transparent formulas.",
    beforeYouCalculate: "Use the bar size, center spacing, edge position, lap length and support layout shown on the approved structural or placing drawings. Measure edge offsets to bar centerline when the calculator asks for centerline offset, and use current supplier stock lengths and prices for purchasing estimates. These tools perform takeoff and layout math; they do not choose reinforcement design.",
    tips: [
      "Bar spacing is center-to-center. Convert specified clear cover to bar-center offset before using a grid or spacing calculator.",
      "Stock-bar counts based on total footage are minimum equivalents, not optimized cutting or splice schedules. Individual cut lengths and lap locations can require more stock.",
      "Lap splice length is not a universal bar-diameter multiple. Enter the splice length shown on the approved drawings; concrete strength, bar grade, size, cover, spacing and confinement affect the required lap.",
      "Nominal bar weights depend on the selected US bar designation. Use the material schedule and supplier data when ordering.",
      "Chair type, height, load capacity and spacing come from the reinforcement support plan. The chair calculator only converts a specified support grid into quantity.",
    ],
    relatedCategories: [
      { name: "Concrete", href: "/construction/concrete/", reason: "Concrete quantity, pour and slab tools around the reinforcement takeoff" },
      { name: "Slab, Patio & Driveway", href: "/construction/slab-patio-driveway/", reason: "Slab reinforcement and concrete project workflows" },
      { name: "Foundation & Footing", href: "/construction/foundation/", reason: "Footing, wall and foundation geometry before reinforcement takeoff" },
      { name: "Concrete Block & CMU", href: "/construction/concrete-block/", reason: "Vertical and horizontal reinforcement for reinforced masonry" },
    ],
  },

  "brick-masonry": {
    intro: "Brick and masonry estimating involves different jobs: wall quantity, course layout, mortar, veneer, paved surfaces, shipment weight, waste and project cost. These 15 calculators separate those intents so users can choose the tool that matches the actual takeoff instead of repeating one generic wall formula.",
    beforeYouCalculate: "Measure the wall or paved area and use the actual unit dimensions for the product being ordered. For mortared walls, include the intended joint width; for multi-wythe work, know the number of brick layers. Gather openings, unit weight, supplier prices, mortar yield, paver base depth or veneer tie spacing only when the selected calculator needs them.",
    tips: [
      "Use actual brick dimensions plus the joint to form the installed module. Brick products vary substantially, so product dimensions are more reliable than a single default size.",
      "Courses and units-per-course are layout checks; opening-adjusted material quantity should be based on net wall area and the installed module.",
      "Mortar volume and bag yield vary with unit shape, joint geometry and workmanship. Use product yield when purchasing and treat geometric mortar volume as an estimate.",
      "Brick veneer ties, flashing, drainage, cavity width and weeps are assembly-design details. The veneer calculator only converts entered tie spacing into a planning count.",
      "Paver base and bedding outputs are placed/compacted volumes. Loose delivery quantities can require supplier-specific conversion.",
      "Choose waste from cuts, bond pattern, breakage and project geometry rather than assuming one universal percentage."
    ],
    relatedCategories: [
      { name: "Mortar, Grout & Cement", href: "/construction/mortar-grout-cement/", reason: "Mortar and cement workflows for masonry installation" },
      { name: "Paver & Landscaping", href: "/construction/landscaping/", reason: "Paver base, sand and landscaping material takeoffs" },
      { name: "Concrete Block & CMU", href: "/construction/concrete-block/", reason: "Concrete masonry units, grout and reinforced masonry" },
      { name: "Rebar & Reinforcement", href: "/construction/rebar/", reason: "Reinforcement takeoff where masonry walls are reinforced" },
    ],
  },

  "concrete-block": {
    intro: "Concrete block and CMU estimating has several distinct scopes: block count and course layout, mortar, grout core fill, shipment weight, project cost and reinforcement takeoff. These 10 calculators keep those scopes separate while using specified block dimensions, transparent allowances and project-entered material assumptions.",
    beforeYouCalculate: "Know the wall length, height and openings plus the CMU face dimensions being supplied. For common modular CMU, specified dimensions are typically 3/8 inch smaller than nominal dimensions so the unit plus mortar joint fits the nominal module. Gather manufacturer block weight, mortar coverage, grout cell volume and structural reinforcement spacing only for calculators that need them.",
    tips: [
      "Do not confuse nominal and specified CMU dimensions. A nominal 8 × 8 × 16 in module commonly uses a 7⅝ × 7⅝ × 15⅝ in specified unit with a ⅜ in mortar joint.",
      "Block face count depends on length and height; wall thickness affects weight, mortar/grout geometry and structural design but not units per square foot.",
      "Mortar and grout are different materials. Mortar forms joints; grout fills selected cores, bond beams and lintels.",
      "Use manufacturer core/cell geometry for grout volume. Hollow-unit voids vary by block width, shape and producer.",
      "Vertical and horizontal reinforcement spacing, bar size, lap and anchorage come from the structural masonry design. The reinforcement calculator only performs takeoff math.",
      "Special corner units, bond-beam units, lintels, jamb units and cuts should be counted from the wall layout rather than hidden inside a generic waste factor."
    ],
    relatedCategories: [
      { name: "Rebar & Reinforcement", href: "/construction/rebar/", reason: "Detailed rebar weight, spacing, lap and quantity workflows" },
      { name: "Mortar, Grout & Cement", href: "/construction/mortar-grout-cement/", reason: "Mortar and grout products used with CMU" },
      { name: "Foundation & Footing", href: "/construction/foundation/", reason: "Footings and foundation geometry supporting masonry walls" },
      { name: "Brick & Masonry", href: "/construction/brick-masonry/", reason: "Brick and generic masonry unit takeoffs" },
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
    intro: "Excavation and earthwork quantities change depending on whether material is measured in place (bank), loosened for haulage, or compacted as fill. These 10 calculators separate excavation geometry, trench volume, backfill displacement, cut/fill balance, soil weight, truck trips and quote-based cost.",
    beforeYouCalculate: "Use the project excavation geometry, including bottom dimensions and any specified side slope. Gather project-specific swell or shrink factors when loose haulage or compacted fill is involved. For cost work, confirm whether rates are quoted per bank cubic yard, loose cubic yard, truck trip or fixed mobilization. Safety slopes, shoring and protective systems must come from the applicable excavation plan and requirements—not from a volume calculator.",
    tips: [
      "Keep bank, loose and compacted quantities on clearly identified bases. FHWA guidance notes that shrink/swell factors vary by material and construction method, so use local geotechnical or field information when available.",
      "An entered side slope is geometry only; the calculator does not determine whether that slope or vertical excavation is safe. Excavation protection depends on soil and site conditions and applicable safety requirements.",
      "Trench backfill should deduct the actual pipe and bedding/occupied volume before applying a loose-to-placed conversion and purchasing allowance.",
      "Cut-and-fill balance first converts required compacted fill back to a bank-volume basis before comparing it with available bank cut.",
      "Truck-trip estimates use entered loose-volume capacity. Legal payload, axle limits, access constraints and contractor minimums still need separate checking."
    ],
    relatedCategories: [
      { name: "Foundation & Footing", href: "/construction/foundation/", reason: "Foundation-specific working room, excavation and concrete" },
      { name: "Gravel & Aggregate", href: "/construction/gravel/", reason: "Backfill, base and imported bulk-material quantities" },
      { name: "Concrete", href: "/construction/concrete/", reason: "Concrete volume for excavated footings and foundations" },
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
    intro: "Gravel, crushed stone, aggregate, sand, fill dirt and topsoil are usually ordered by cubic yard or by weight, but their bulk density changes with grading, moisture and compaction state. These 15 calculators separate volume, weight, reverse-depth and cost workflows while keeping density and purchasing allowance explicit.",
    beforeYouCalculate: "Measure the placed or measured area and depth, or use a known volume when you already have one. Match the density to the same material state as the dimensions—loose delivery and compacted placement are not interchangeable. Confirm whether the supplier quote is per cubic yard, cubic meter or US ton and keep delivery or spreading charges separate when they are quoted separately.",
    tips: [
      "Bulk density is not a universal constant. Use supplier scale-ticket or product data for the exact material, grading, moisture and loose/compacted condition whenever possible.",
      "Keep compaction and purchasing waste separate. The main Gravel Calculator exposes both inputs explicitly; for other material tools, use supplier/project information to convert loose delivery to placed volume instead of hiding compaction inside waste.",
      "The weight-only calculators deliberately do not add hidden overage; they convert the measured volume you enter into estimated mass.",
      "The depth calculator solves average coverage from the material you already have. It does not recommend a structural base thickness.",
      "Cost calculators keep material subtotal, tax, delivery/trucking and spreading/labor separate so quoted scopes are not double counted."
    ],
    relatedCategories: [
      { name: "Concrete", href: "/construction/concrete/", reason: "Concrete volume over a specified aggregate base" },
      { name: "Paver & Landscaping", href: "/construction/landscaping/", reason: "Paver base, bedding sand and landscape material takeoffs" },
      { name: "Slab, Patio & Driveway", href: "/construction/slab-patio-driveway/", reason: "Specified base depth under slabs and driveways" },
      { name: "Excavation & Earthwork", href: "/construction/excavation/", reason: "Bank excavation, haul volume and trench backfill" },
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
    intro: "Mortar, grout and cement are related but different estimating scopes. Mortar calculators handle masonry-unit coverage, joint volume, mix proportions and bag cost; grout calculators cover known mixed volume or tile-joint geometry; cement tools handle cement-only volume, dry ratios and optional placed-to-dry batch conversion.",
    beforeYouCalculate: "Identify what you actually know: installed masonry units, wall geometry, tile-joint geometry, mixed volume, a dry batch, or a placed/wet batch with an estimating dry-volume factor. Use the exact product yield, package weight, joint dimensions and supplier price. These calculators do not choose a mortar type, grout specification or structural mix.",
    tips: [
      "Use the exact mixed yield or unit coverage stated for the mortar product and masonry unit. Bag coverage changes with unit size, bedding method, joint dimensions and workmanship.",
      "Tile grout and masonry core-fill grout are different estimating tasks. Use the tile-joint grout tools here for tile joints; use the CMU Grout Calculator for filled block cells and bond beams.",
      "Mortar mix ratios and cement:sand ratios are project inputs. A quantity calculator should proportion the ratio you enter rather than infer a strength class or suitability.",
      "Cement is a constituent, not a complete concrete or mortar mix. Keep cement-only bag calculations separate from sand, aggregate, lime, water and admixture requirements unless the chosen calculator explicitly includes them.",
      "Apply purchasing allowance once, then round discrete bags up at the end. Do not round intermediate component volumes."
    ],
    relatedCategories: [
      { name: "Brick & Masonry", href: "/construction/brick-masonry/", reason: "Brick quantity and geometric mortar takeoff" },
      { name: "Concrete Block & CMU", href: "/construction/concrete-block/", reason: "CMU mortar, core-fill grout and reinforcement" },
      { name: "Concrete", href: "/construction/concrete/", reason: "Concrete mix, volume, pour and bag calculations" },
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
