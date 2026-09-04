import fs from 'fs';

const slugs = fs.readFileSync('scripts/200-slugs.txt','utf8').trim().split('\n');
const hub = slugs.map(slug=>{
  const h1 = slug.split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' ');
  // Derive category from hubCategories logic
  const idx = slugs.indexOf(slug);
  let category="Concrete", cluster="concrete";
  if (idx < 15) { category="Concrete"; cluster="concrete"; }
  else if (idx < 25) { category="Slab & Patio"; cluster="slab"; }
  else if (idx < 35) { category="Foundation"; cluster="foundation"; }
  else if (idx < 45) { category="Rebar"; cluster="rebar"; }
  else if (idx < 60) { category="Brick & Masonry"; cluster="brick"; }
  else if (idx < 70) { category="Concrete Block"; cluster="cmu"; }
  else if (idx < 80) { category="Mortar & Cement"; cluster="mortar"; }
  else if (idx < 95) { category="Gravel & Aggregate"; cluster="gravel"; }
  else if (idx < 105) { category="Excavation"; cluster="excavation"; }
  else if (idx < 120) { category="Framing & Lumber"; cluster="framing"; }
  else if (idx < 135) { category="Roofing"; cluster="roofing"; }
  else if (idx < 150) { category="Flooring & Tile"; cluster="flooring"; }
  else if (idx < 165) { category="Drywall & Paint"; cluster="drywall"; }
  else if (idx < 180) { category="Deck & Fence"; cluster="deck-fence"; }
  else if (idx < 190) { category="Paver & Landscaping"; cluster="landscaping"; }
  else { category="Asphalt & Surface"; cluster="asphalt"; }
  return { slug, h1, category, cluster };
});

function slugToName(slug){ return slug.split('-').map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(' '); }

function getCategoryContent(cat){
  const map={
    "Concrete": {
      whatIs: "Estimates concrete volume, weight and ready-mix versus bag count for US slabs, footings and walls.",
      whatCalc: ["Concrete volume in cubic yards and cubic feet","Ready-mix loads vs 40/60/80-lb bags","Weight and cost with waste"],
      material: "Concrete — 4000 psi typical for driveways, 3000 psi for patios. Ordered by cubic yard (27 ft³) or bags (0.60 ft³ per 80-lb). Keep slump 4 in for slabs.",
      waste: "Add 5–10% for spillage and uneven subgrade — 10% is safe for hand-screeded forms.",
      tips: ["Order ready-mix over ~1 yd³ (45 bags) — faster and cheaper","Keep subgrade compacted and forms braced","Add one extra bag per 10 as buffer"],
      mistakes: ["Forgetting to convert inches to feet (4 in = 0.333 ft)","Ordering the theoretical minimum — second trip costs more than 10% waste"],
    },
    "Gravel & Aggregate": {
      whatIs: "Sizes gravel and aggregate for driveways and patios — volume, weight and cost with density.",
      whatCalc: ["Cubic yards and cubic feet","Tons and pounds using 1.35–1.60 t/yd³","Cost per ton or per yard with waste"],
      material: "Pea gravel 1.35 t/yd³, crushed stone 1.40, river rock 1.33, limestone 1.60, sand 1.30. Confirm with scale ticket — moisture adds 10%.",
      waste: "Open-graded stone settles ~8% (×1.10), crusher run compacts 15–25% (×1.20). Add after volume.",
      tips: ["Use fabric under decorative gravel","Crown driveway center 2% for drainage"],
      mistakes: ["Mixing tons and yards without density","Not adding compaction for crusher run"],
    },
    "Slab & Patio": {
      whatIs: "Sizes slabs and patio concrete for US patios and shed pads — area, thickness, reinforcement and cost.",
      whatCalc: ["Slab area in square feet","Concrete volume in cubic yards","Bags and reinforcement with waste"],
      material: "Patio slabs 3.5–4 in thick, 3000–3500 psi. Base 4 in compacted gravel. Use welded wire mesh or rebar for crack control.",
      waste: "Add 5–10% for spillage and thickness variation — 10% safe for hand-screeded patios.",
      tips: ["Slope patio 1/4 in per foot away from house","Keep joints every 8–10 ft to control cracking"],
      mistakes: ["Pouring too thin (under 3.5 in) — cracks and frost heave","Forgetting slope — water pools against house"],
    },
    "Foundation": {
      whatIs: "Estimates foundation excavation, footings and walls for US homes — volume, concrete and cost.",
      whatCalc: ["Footing volume in cubic yards","Foundation wall area and concrete","Excavation volume with waste"],
      material: "Footings 8–12 in thick, walls 8 in. Concrete 3000–4000 psi. Footing below frost line per local code.",
      waste: "Add 10% for over-excavation and slough — trench sides cave.",
      tips: ["Call 811 before digging","Keep footings on undisturbed soil or compacted fill"],
      mistakes: ["Shallow footings above frost line — heave","Not adding extra for footing flares"],
    },
    "Rebar": {
      whatIs: "Sizes rebar for US concrete — count, length, weight, spacing and cost with laps and chairs.",
      whatCalc: ["Rebar count from spacing","Total length and weight (lb/ft)","Laps and chairs with waste"],
      material: "Rebar #3 (0.376 lb/ft), #4 (0.668), #5 (1.043). Epoxy-coated for corrosive soils. Laps 40x diameter per ACI 318.",
      waste: "Add 5% for cuts and laps — 10% for complex grids. Chairs every 4 ft.",
      tips: ["Maintain 3 in cover to soil, 1.5 in to forms","Tie with wire, not weld, unless specified"],
      mistakes: ["Wrong lap length — 20x vs 40x diameter","Too few chairs — rebar sinks to bottom"],
    },
    "Brick & Masonry": {
      whatIs: "Counts bricks and masonry units for US walls, patios and veneers — quantity, mortar and cost.",
      whatCalc: ["Bricks or blocks per wall area","Mortar volume with 3/8 in joint","Waste-adjusted count and cost"],
      material: "Standard brick 7.5x2.25 in, 6.8 per ft2 with 3/8 in joint. Mortar Type S 1:3, Type N 1:4. CMU 16x8 in face (1.125 per ft2).",
      waste: "Add 7% for cuts and breakage — 10% for arches or curves.",
      tips: ["Dry-lay a course to check bond","Keep mortar workable — do not retemper after initial set"],
      mistakes: ["Forgetting joint thickness — count off 15%","Not adding waste for cuts around openings"],
    },
    "Concrete Block": {
      whatIs: "Counts CMU and concrete blocks for US walls — units, grout, mortar and reinforcement.",
      whatCalc: ["CMU count per wall area","Grout and mortar volume","Reinforcement with waste"],
      material: "CMU 16x8 in face, 8 in thick. Grout 0.5 ft3 per core. Mortar 0.02 yd3 per 100 blocks.",
      waste: "Add 5% for cuts and breakage — 7% for pilasters.",
      tips: ["Stagger joints half-block","Use half-blocks at openings to avoid cuts"],
      mistakes: ["Not deducting openings — over-order 10%","Forgetting grout for reinforced cells"],
    },
    "Mortar & Cement": {
      whatIs: "Mixes mortar, grout and cement for US masonry — volume, bags and sand ratios.",
      whatCalc: ["Mortar volume in cubic feet","Cement bags (94-lb) and sand","Water and cost with waste"],
      material: "Portland cement 94-lb bag, 1 ft3. Mortar Type S 1:3, Type M 1:2, Type N 1:4. Grout 1:2 cement:sand.",
      waste: "Add 10% for spillage and retemper — mortar stiffens in 90 min.",
      tips: ["Mix small batches — do not add water after stiffening","Keep sand damp for consistent mix"],
      mistakes: ["Wrong ratio — weak mortar cracks","Too much water — weak and shrinks"],
    },
    "Excavation": {
      whatIs: "Volumes earthwork for US trenches and grading — cut, fill, backfill and soil weight.",
      whatCalc: ["Trench volume in cubic yards","Backfill less pipe volume","Soil weight in tons with swell"],
      material: "Soil swells 15–25% when dug (1.2x). Clay 1.6 t/yd3, sand 1.5, topsoil 1.2. Call 811 before dig.",
      waste: "Trench sides slough — add 10% for over-excavation. Shrinkage 10% on backfill.",
      tips: ["Bench or slope sides per OSHA over 5 ft","Stockpile topsoil separate from subsoil"],
      mistakes: ["Forgetting swell — truck count short","Not subtracting pipe volume for backfill"],
    },
    "Framing & Lumber": {
      whatIs: "Frames US walls and floors — studs, joists, headers, beams and board feet.",
      whatCalc: ["Stud count from spacing","Board feet (T x W x L /12)","Joist/beam loads with waste"],
      material: "Studs 2x4/2x6, 16 in o.c. typical. SPF #2, 1.5x3.5 in actual. Board foot = 1x12x12 in.",
      waste: "Add 10% for cuts and cripples — 15% for gable walls.",
      tips: ["Add 1 stud per corner and opening","Crown joists up"],
      mistakes: ["16 in vs 24 in o.c. — count off 30%","Forgetting cripples under sills"],
    },
    "Roofing": {
      whatIs: "Measures US roofs — area, pitch, shingles, underlayment and rafters with waste.",
      whatCalc: ["Roof area via pitch multiplier","Shingle bundles and squares (100 ft2)","Underlayment and waste"],
      material: "Shingles 3 bundles per square, 33 ft2 each. Underlayment 2 squares per roll. Drip edge linear feet.",
      waste: "Add 10% for gable, 15% for hip/valley — cuts add waste.",
      tips: ["Order ridge caps separate","Valley metal 10% extra"],
      mistakes: ["Using footprint not roof area — short 12% at 6:12","Forgetting starter strip"],
    },
    "Flooring & Tile": {
      whatIs: "Covers US floors — hardwood, laminate, vinyl, carpet and tile with grout and waste.",
      whatCalc: ["Floor area in square feet","Boxes or rolls with waste","Grout and adhesive"],
      material: "Tile 12x12 in = 1 ft2, 6.8 per ft2 with grout. Hardwood 20 ft2 per box. Carpet 12 ft wide rolls.",
      waste: "Add 10% for straight, 15% for diagonal or large tile. Pattern adds 20%.",
      tips: ["Acclimate wood 72 hours","Stagger joints 6 in"],
      mistakes: ["Not adding waste for diagonal — short 15%","Forgetting grout joint — count off"],
    },
    "Drywall & Paint": {
      whatIs: "Covers US interiors — drywall sheets, screws, tape, paint and insulation.",
      whatCalc: ["Sheets (4x8 =32 ft2)","Gallons at 350 ft2/gal","Insulation batts with waste"],
      material: "Drywall 4x8, screws 28 per sheet, tape 500 ft per roll. Paint 350 ft2/gal, primer 300. Spray foam 1 in = R6.",
      waste: "Add 10% for cuts and openings — 15% for vaulted ceilings.",
      tips: ["Hang drywall perpendicular to joists","Prime before paint for true color"],
      mistakes: ["Not deducting openings — over-order 10%","One coat paint — needs two for coverage"],
    },
    "Deck & Fence": {
      whatIs: "Builds US decks and fences — boards, joists, posts, panels and concrete with waste.",
      whatCalc: ["Deck boards and joists","Fence posts, panels and rails","Concrete bags per post"],
      material: "Deck boards 5.5 in + 1/8 in gap, joists 16 in o.c. Fence posts 8 ft spacing, 2.5 ft deep, 0.5 bag 50-lb per post.",
      waste: "Add 10% for cuts and angles — 15% for curves.",
      tips: ["Crown deck boards up","Set posts in gravel + concrete for drainage"],
      mistakes: ["Wrong gap — boards buckle","Shallow posts — frost heave"],
    },
    "Paver & Landscaping": {
      whatIs: "Hardscape for US yards — pavers, base, sand, mulch and retaining walls.",
      whatCalc: ["Paver count from area / paver area","Base gravel and sand volume","Mulch yards vs bags"],
      material: "Pavers 12x12 in =1 ft2, base 4 in gravel, 1 in sand. Mulch 2 ft3 bag =8 ft2 at 3 in.",
      waste: "Add 10% for cuts and curves — 15% for radial patterns.",
      tips: ["Compact base in 2 in lifts","Edge restraint prevents shift"],
      mistakes: ["No base — pavers settle","Thin mulch — weeds poke through"],
    },
    "Asphalt & Surface": {
      whatIs: "Paves US driveways and lots — asphalt weight, thickness and parking layout.",
      whatCalc: ["Asphalt tons from volume x 2.025 t/yd3","Thickness and area","Parking spaces with waste"],
      material: "Asphalt 145 lb/ft3 (2.025 t/yd3), 2–3 in driveways, 4 in commercial. Tack coat 0.05 gal/ft2.",
      waste: "Add 5% for screed loss — 10% for hand work.",
      tips: ["Compact while hot (>275F)","Slope 2% for drainage"],
      mistakes: ["Thin asphalt — cracks in year","No base — base failure, not asphalt"],
    },
  };
  return map[cat] || map["Concrete"];
}

// Generate detailed content
const out = {};
for(const c of hub){
  const name=c.h1;
  const cat=c.category;
  const slug=c.slug;
  const base=name.replace(' Calculator','');
  const catInfo=getCategoryContent(cat);
  
  // Formula specific — fallback now per-calculator unique to avoid duplicate generic
  let formula=`Volume = Length x Width x Depth for ${base}`;
  let vars=[{symbol:"L",meaning:`Length for ${base} in feet`},{symbol:"W",meaning:`Width for ${base} in feet`},{symbol:"D",meaning:`Depth for ${base} in feet`}];
  let exampleInputs=`${base} 20 ft x 10 ft x 4 in`;
  let exampleSteps=[
    {label:"Convert depth",value:"4 in /12 = 0.333 ft"},
    {label:"Cubic feet",value:"20 x 10 x 0.333 = 66.67 ft3"},
    {label:"Cubic yards",value:"66.67 /27 = 2.47 yd3"},
    {label:"With 10% waste",value:"2.72 yd3"},
  ];
  let construction=`<ul class="list-disc pl-5 space-y-1"><li>Measure longest x widest; split L-shapes into two rectangles and add.</li><li>Compact subgrade — soft spots add thickness.</li><li>For structural sizing (beams, headers, rebar) verify with a professional per local code.</li></ul>`;
  
  if(name.includes("Concrete Column")){
    formula="Volume = pi * (Diameter/2)^2 * Height";
    vars=[{symbol:"D",meaning:"Diameter in feet"},{symbol:"H",meaning:"Height in feet"}];
    exampleInputs="Column 12 in diameter x 8 ft tall";
    exampleSteps=[
      {label:"Radius",value:"12 in /2 = 6 in = 0.5 ft"},
      {label:"Area",value:"pi*0.5^2 = 0.785 ft2"},
      {label:"Volume",value:"0.785*8 = 6.28 ft3 = 0.23 yd3"},
      {label:"With 5% waste",value:"0.24 yd3 (11 bags 80lb)"},
    ];
    construction="<p class='text-sm'>Sonotube columns need 5% waste for over-pour. Vibrate to eliminate voids.</p>";
  } else if(name.includes("Concrete Curb")){
    formula="Volume = Length * (Curb Width * Curb Height + Gutter Width * Thickness)";
    vars=[{symbol:"Length",meaning:"Curb length in feet"},{symbol:"Curb",meaning:"Width x Height"}];
    exampleInputs="Curb 20 ft, 6x6 in curb + 18x6 in gutter";
    exampleSteps=[
      {label:"Curb area",value:"0.5*0.5 = 0.25 ft2"},
      {label:"Gutter area",value:"1.5*0.5 = 0.75 ft2"},
      {label:"Volume",value:"20*1.0 = 20 ft3 = 0.74 yd3"},
    ];
    construction="<p class='text-sm'>Curb and gutter combined — include gutter thickness. Add 10% for curves.</p>";
  } else if(name.includes("Concrete Stair")){
    formula="Volume = Sum (Tread Depth * Riser Height * Width) per step";
    vars=[{symbol:"Run",meaning:"Tread depth in feet"},{symbol:"Rise",meaning:"Riser height in feet"},{symbol:"Width",meaning:"Stair width"}];
    exampleInputs="Stair 4 ft wide, 7 in rise, 11 in run, 4 steps";
    exampleSteps=[
      {label:"Per step",value:"0.917*0.583*4 = 2.14 ft3"},
      {label:"Total",value:"2.14*4 = 8.56 ft3 = 0.32 yd3"},
      {label:"With waste",value:"0.35 yd3"},
    ];
    construction="<p class='text-sm'>Stairs need formwork bracing — add 10% for over-excavation.</p>";
  } else if(name.includes("Slab Thickness")){
    formula="Thickness = Volume / Area";
    vars=[{symbol:"Area",meaning:"Length x Width in ft2"},{symbol:"Volume",meaning:"Cubic yards x 27"}];
    exampleInputs="Slab 12x10 ft, 1.5 yd3 ordered";
    exampleSteps=[
      {label:"Area",value:"12*10 = 120 ft2"},
      {label:"Volume ft3",value:"1.5*27 = 40.5 ft3"},
      {label:"Thickness",value:"40.5/120 = 0.337 ft = 4.05 in"},
    ];
    construction="<p class='text-sm'>Check thickness with string line — add 10% for uneven subgrade.</p>";
  } else if(name.includes("Patio Cost")||name.includes("Driveway Cost")||name.includes("Garage Slab")||name.includes("Shed Foundation")){
    formula="Cost = Volume * Price per yard + Delivery";
    vars=[{symbol:"Volume",meaning:"Cubic yards with waste"},{symbol:"Price",meaning:"$ per yd3"}];
    exampleInputs="Patio 12x10 ft x 4 in, $150/yd3 + $100 delivery";
    exampleSteps=[
      {label:"Volume",value:"1.48 yd3 +10% = 1.63 yd3"},
      {label:"Material",value:"1.63*150 = $244.50"},
      {label:"Total",value:"$244.50+100 = $344.50"},
    ];
    construction="<p class='text-sm'>Cost varies $140-180/yd3 + delivery. Bags vs truck break-even ~1 yd3.</p>";
  } else if(name.includes("Strip Footing")||name.includes("Pad Footing")||name.includes("Pier Footing")){
    formula="Volume = Length * Width * Depth (per footing)";
    vars=[{symbol:"L",meaning:"Footing length"},{symbol:"W",meaning:"Width"},{symbol:"D",meaning:"Depth"}];
    exampleInputs="Strip footing 40 ft x 16 in wide x 8 in deep";
    exampleSteps=[
      {label:"Convert",value:"16 in=1.333 ft, 8 in=0.667 ft"},
      {label:"Volume",value:"40*1.333*0.667 = 35.56 ft3 = 1.32 yd3"},
      {label:"With waste",value:"1.45 yd3"},
    ];
    construction="<p class='text-sm'>Footings below frost line per code. Call 811 before dig.</p>";
  } else if(name.includes("Foundation Wall")||name.includes("Basement Wall")){
    formula="Volume = Wall Length * Wall Height * Wall Thickness";
    vars=[{symbol:"Length",meaning:"Total wall length"},{symbol:"Height",meaning:"Wall height"},{symbol:"Thickness",meaning:"Wall thickness"}];
    exampleInputs="Foundation 40x30 ft perimeter 140 ft x 8 ft high x 8 in thick";
    exampleSteps=[
      {label:"Thickness ft",value:"8/12 = 0.667 ft"},
      {label:"Volume",value:"140*8*0.667 = 746.7 ft3 = 27.66 yd3"},
      {label:"With waste",value:"30.4 yd3"},
    ];
    construction="<p class='text-sm'>8 in walls typical for 8 ft height. Add rebar and grout per code.</p>";
  } else if(name.includes("Gravel Weight")||name.includes("Sand Weight")||name.includes("Aggregate Weight")){
    formula="Weight = Volume (yd3) * Density (tons/yd3)";
    vars=[{symbol:"Volume",meaning:"Cubic yards with waste"},{symbol:"Density",meaning:"Pea 1.35, Crushed 1.40, Limestone 1.60 t/yd3"}];
    exampleInputs="Yard 2.47 yd3 pea gravel 1.35 t/yd3";
    exampleSteps=[
      {label:"Volume",value:"2.47 yd3"},
      {label:"Weight",value:"2.47*1.35 = 3.33 tons = 6,670 lb"},
      {label:"With waste",value:"3.67 tons"},
    ];
    construction="<p class='text-sm'>Pea 1.35, crushed 1.40, limestone 1.60, granite 1.42 t/yd3. Moisture +10%.</p>";
  } else if(name.includes("Gravel Cost")||name.includes("Sand Cost")||name.includes("Topsoil Cost")){
    formula="Cost = Weight or Volume * Price + Delivery";
    vars=[{symbol:"Qty",meaning:"Tons or yd3 with waste"},{symbol:"Price",meaning:"$ per ton or per yd3"}];
    exampleInputs="3.67 tons @ $45/ton + $75 delivery";
    exampleSteps=[
      {label:"Material",value:"3.67*45 = $165.15"},
      {label:"Total",value:"$165.15+75 = $240.15"},
    ];
    construction="<p class='text-sm'>Bulk $25-60/ton or $40-75/yd3 + $50-150 delivery. Bags 5x cost.</p>";
  } else if(name.includes("Gravel Depth")||name.includes("Crushed Stone Depth")){
    formula="Depth = Volume / Area";
    vars=[{symbol:"Volume",meaning:"Cubic yards *27"},{symbol:"Area",meaning:"Length * Width ft2"}];
    exampleInputs="Area 200 ft2, 2.47 yd3 ordered";
    exampleSteps=[
      {label:"Volume ft3",value:"2.47*27 = 66.69 ft3"},
      {label:"Depth",value:"66.69/200 = 0.333 ft = 4.0 in"},
    ];
    construction="<p class='text-sm'>Depth check — add compaction 1.10x for open-graded, 1.20x for crusher run.</p>";
  } else if(name.includes("Rebar Weight")){
    formula="Weight = Count * Length * Weight per foot";
    vars=[{symbol:"Count",meaning:"Rebar count"},{symbol:"Length",meaning:"Length per bar"},{symbol:"lb/ft",meaning:"0.376 #3, 0.668 #4, 1.043 #5"}];
    exampleInputs="16 bars #4 x 20 ft, 0.668 lb/ft";
    exampleSteps=[
      {label:"Total length",value:"16*20 = 320 ft"},
      {label:"Weight",value:"320*0.668 = 213.8 lb = 0.107 tons"},
      {label:"With waste",value:"0.118 tons"},
    ];
    construction="<p class='text-sm'>#4 rebar 0.668 lb/ft, #5 1.043 lb/ft. Add 5% for laps.</p>";
  } else if(name.includes("Rebar Cost")){
    formula="Cost = Weight (tons) * Price per ton";
    vars=[{symbol:"Weight",meaning:"Tons with waste"},{symbol:"Price",meaning:"$ per ton"}];
    exampleInputs="0.12 tons @ $1200/ton";
    exampleSteps=[
      {label:"Weight",value:"0.107 tons +10% = 0.118 tons"},
      {label:"Cost",value:"0.118*1200 = $141.60"},
    ];
    construction="<p class='text-sm'>Rebar $900-1500/ton in 2026. Epoxy coated +15%.</p>";
  } else if(name.includes("Rebar")){
    formula="Rebar count = ceil(Length / Spacing) + 1";
    vars=[{symbol:"Length",meaning:"Total length in feet"},{symbol:"Spacing",meaning:"On-center spacing in inches"}];
    exampleInputs="Wall 20 ft, spacing 16 in";
    exampleSteps=[
      {label:"Convert spacing",value:"16 in = 1.333 ft"},
      {label:"Count",value:"ceil(20 /1.333)+1 = 16"},
      {label:"With 10% waste",value:"18"},
    ];
    construction="<p class='text-sm'>Rebar laps 40x diameter per ACI 318. Chairs every 4 ft hold cover.</p>";
  } else if(name.includes("Brick Weight")||name.includes("Block Weight")){
    formula="Weight = Quantity * Weight per unit";
    vars=[{symbol:"Qty",meaning:"Bricks/blocks with waste"},{symbol:"Unit wt",meaning:"Brick 4.3 lb, CMU 28-43 lb"}];
    exampleInputs="1,193 bricks x 4.3 lb";
    exampleSteps=[
      {label:"Weight",value:"1,193*4.3 = 5,130 lb = 2.57 tons"},
      {label:"With waste",value:"2.70 tons"},
    ];
    construction="<p class='text-sm'>Standard brick 4.3 lb, queen 5.7 lb. CMU 28 lb (8in) to 43 lb (12in).</p>";
  } else if(name.includes("Brick Cost")||name.includes("Block Cost")||name.includes("Masonry Cost")){
    formula="Cost = Quantity * Price per unit";
    vars=[{symbol:"Qty",meaning:"Units with waste"},{symbol:"Price",meaning:"$ per brick/block"}];
    exampleInputs="1,193 bricks @ $0.65 each";
    exampleSteps=[
      {label:"Material",value:"1,193*0.65 = $775.45"},
      {label:"With waste",value:"$814.22"},
    ];
    construction="<p class='text-sm'>Brick $0.50-1.20, CMU $1.20-2.50 in 2026. Mortar extra $8-12/bag.</p>";
  } else if(name.includes("Brick")||name.includes("Masonry")||name.includes("CMU")||name.includes("Block")){
    formula="Bricks = Wall area / Brick area (including mortar joint)";
    vars=[{symbol:"Wall area",meaning:"Length x Height in ft2"},{symbol:"Brick area",meaning:"(Brick L + joint) x (Brick H + joint)"}];
    exampleInputs="Wall 20 ft x 8 ft, brick 7.5x2.25 in, joint 0.375 in";
    exampleSteps=[
      {label:"Wall area",value:"160 ft2 = 23,040 in2"},
      {label:"Brick + joint",value:"7.875x2.625 = 20.67 in2"},
      {label:"Bricks",value:"ceil(23,040/20.67)=1,115"},
      {label:"With 7% waste",value:"1,193"},
    ];
  } else if(name.includes("Roof")||name.includes("Rafter")||name.includes("Truss")||name.includes("Shingle")||name.includes("Pitch")||name.includes("Slope")){
    formula="Multiplier = sqrt(pitch^2+144) /12  •  Roof area = Footprint x Multiplier";
    vars=[{symbol:"pitch",meaning:"Rise per 12\" run"}];
    exampleInputs="Footprint 30x40 ft, pitch 6:12, overhang 1.5 ft";
    exampleSteps=[
      {label:"Footprint + overhang",value:"33x43 = 1,419 ft2"},
      {label:"Multiplier",value:"sqrt(36+144)/12 = 1.118"},
      {label:"Roof area",value:"1,419x1.118 = 1,586 ft2"},
      {label:"Squares",value:"15.86 sq"},
    ];
  } else if(name.includes("Tile Quantity")||name.includes("Tile Cost")||name.includes("Tile Grout")){
    formula="Tiles = ceil(Area / Tile area) + Waste";
    vars=[{symbol:"Area",meaning:"Floor area ft2"},{symbol:"Tile area",meaning:"(W*H)/144 ft2"}];
    exampleInputs="Room 12x10 ft, tile 12x12 in, grout 1/8 in";
    exampleSteps=[
      {label:"Tile + grout",value:"12.125*12.125 = 147 in2 = 1.02 ft2"},
      {label:"Tiles",value:"120/1.02 = 117.6 -> 118"},
      {label:"With 10% waste",value:"130 tiles"},
    ];
    construction="<p class='text-sm'>12x12 tile ~1 ft2, 6x6 ~0.25 ft2. Add 15% for diagonal.</p>";
  } else if(name.includes("Hardwood")||name.includes("Laminate")||name.includes("Vinyl")){
    formula="Boxes = ceil(Area / Coverage per box)";
    vars=[{symbol:"Area",meaning:"Floor area ft2"},{symbol:"Coverage",meaning:"20-30 ft2 per box"}];
    exampleInputs="Room 12x10 ft =120 ft2, coverage 20 ft2/box";
    exampleSteps=[
      {label:"Boxes",value:"120/20 = 6"},
      {label:"With 10% waste",value:"7 boxes"},
    ];
    construction="<p class='text-sm'>Acclimate wood 72h. Stagger joints 6 in, waste 10% straight, 15% diagonal.</p>";
  } else if(name.includes("Carpet Cost")||name.includes("Carpet")){
    formula="Carpet = ceil(Area / Roll width) * Length";
    vars=[{symbol:"Area",meaning:"Length*Width"},{symbol:"Roll",meaning:"12 ft wide standard"}];
    exampleInputs="Room 12x10 ft, 12 ft roll";
    exampleSteps=[
      {label:"Strips",value:"10 ft width /12 ft roll = 1 strip"},
      {label:"Length",value:"12 ft *1 = 12 ft = 4 yd"},
      {label:"With waste",value:"4.4 yd"},
    ];
    construction="<p class='text-sm'>Carpet rolls 12 ft wide, seam in middle for >12 ft. Add 10% pattern waste.</p>";
  } else if(name.includes("Drywall Sheet")||name.includes("Drywall Cost")){
    formula="Sheets = ceil(Wall area / 32 ft2) + Waste";
    vars=[{symbol:"Wall area",meaning:"Perimeter*Height - openings"},{symbol:"Sheet",meaning:"4x8 =32 ft2"}];
    exampleInputs="Room 12x10 ft, 8 ft high, door 21 ft2";
    exampleSteps=[
      {label:"Wall area",value:"352-21 =331 ft2"},
      {label:"Sheets",value:"331/32 =10.34 ->11"},
      {label:"With 10% waste",value:"12 sheets"},
    ];
    construction="<p class='text-sm'>4x8 sheets 32 ft2, 4x12 is 48 ft2. Screws 28 per sheet, tape 500 ft/roll.</p>";
  } else if(name.includes("Paint Coverage")||name.includes("Paint Cost")||name.includes("Primer")){
    formula="Gallons = ceil(Area / Coverage per gallon)";
    vars=[{symbol:"Area",meaning:"Wall area ft2"},{symbol:"Coverage",meaning:"350 ft2/gal paint, 300 primer"}];
    exampleInputs="331 ft2 walls, 350 ft2/gal";
    exampleSteps=[
      {label:"Coats",value:"331*2 coats =662 ft2"},
      {label:"Gallons",value:"662/350 =1.89 ->2 gal"},
    ];
    construction="<p class='text-sm'>Paint 350 ft2/gal, primer 300. Two coats always, dark colors may need 3.</p>";
  } else if(name.includes("Insulation Cost")||name.includes("Insulation")){
    formula="Bags = ceil(Area / Coverage per bag)";
    vars=[{symbol:"Area",meaning:"Attic area ft2"},{symbol:"Coverage",meaning:"R-value dependent, e.g., R30 25 ft2/bag"}];
    exampleInputs="Attic 1000 ft2, R30, 25 ft2/bag";
    exampleSteps=[
      {label:"Bags",value:"1000/25 =40"},
      {label:"With waste",value:"44 bags"},
    ];
    construction="<p class='text-sm'>R13 40 ft2/bag, R19 30 ft2/bag, R30 25 ft2/bag. Blown-in settles 10%.</p>";
  } else if(name.includes("Excavation")||name.includes("Trench")||name.includes("Earthwork")||name.includes("Dirt Removal")||name.includes("Soil Volume")||name.includes("Cut and Fill")){
    formula="Volume = Length * Width * Depth * Swell factor";
    vars=[{symbol:"Volume",meaning:"Cubic yards with swell 1.2x"},{symbol:"Depth",meaning:"Feet or inches"}];
    exampleInputs="Trench 20 ft x 2 ft x 4 ft deep";
    exampleSteps=[
      {label:"Volume ft3",value:"20*2*4 =160 ft3"},
      {label:"Yards",value:"160/27 =5.93 yd3"},
      {label:"With swell 1.2x",value:"7.11 yd3"},
    ];
    construction="<p class='text-sm'>Soil swells 15-25% when dug (1.2x). Clay 1.6 t/yd3, call 811.</p>";
  } else if(name.includes("Framing")||name.includes("Stud")||name.includes("Joist")||name.includes("Lumber")||name.includes("Board Foot")||name.includes("Beam")||name.includes("Header")||name.includes("Ceiling Joist")||name.includes("Floor Joist")){
    formula="Studs = ceil(Length / Spacing) + 1, Board Feet = T*W*L/12";
    vars=[{symbol:"Spacing",meaning:"16 or 24 in on-center"},{symbol:"Board",meaning:"Thickness*Width*Length/12"}];
    exampleInputs="Wall 20 ft, studs 16 in OC";
    exampleSteps=[
      {label:"Studs",value:"ceil(20*12/16)+1 =16"},
      {label:"Board feet 2x4x8",value:"1.5*3.5*96/144 =3.5 bf"},
      {label:"With waste",value:"18 studs"},
    ];
    construction="<p class='text-sm'>Studs 16 in OC, 24 in non-load. Add cripples, headers per opening.</p>";
  } else if(name.includes("Deck")||name.includes("Fence")||name.includes("Gate")||name.includes("Post")||name.includes("Panel")||name.includes("Picket")){
    formula="Posts = ceil(Length / Spacing) + 1, Pickets = Length / (Picket width + gap)";
    vars=[{symbol:"Length",meaning:"Fence/deck length"},{symbol:"Spacing",meaning:"8 ft post, picket gap 0-0.5 in"}];
    exampleInputs="Fence 100 ft, post spacing 8 ft, picket 5.5 in + 0 in gap";
    exampleSteps=[
      {label:"Posts",value:"ceil(100/8)+1 =14"},
      {label:"Pickets",value:"1200 in /5.5 =218"},
      {label:"With waste",value:"236 pickets"},
    ];
    construction="<p class='text-sm'>Posts 8 ft OC, 1/3 buried below frost line. Gate needs 2 extra posts.</p>";
  } else if(name.includes("Paver")||name.includes("Landscaping")||name.includes("Retaining Wall")){
    formula="Pavers = ceil(Area / Paver area) + Waste, Base = Area*Depth/27";
    vars=[{symbol:"Area",meaning:"Length*Width ft2"},{symbol:"Paver area",meaning:"12x12=1 ft2, 4x8=0.222 ft2"}];
    exampleInputs="Patio 12x10 ft =120 ft2, paver 12x12 in";
    exampleSteps=[
      {label:"Pavers",value:"120/1 =120"},
      {label:"With 10% waste",value:"132 pavers"},
      {label:"Base 4 in",value:"120*0.333/27 =1.48 yd3"},
    ];
    construction="<p class='text-sm'>Base 4 in patio, 6-8 in driveway. Sand 1 in screeded. Waste 10% rect, 15% curve.</p>";
  } else if(name.includes("Asphalt")||name.includes("Road Base")||name.includes("Parking Lot")||name.includes("Surface Area")){
    formula="Weight = Volume * 2.025 tons/yd3 (145 lb/ft3)";
    vars=[{symbol:"Volume",meaning:"Area*Thickness/27 yd3"},{symbol:"Density",meaning:"2.025 t/yd3 asphalt"}];
    exampleInputs="Driveway 40x12 ft x 3 in asphalt";
    exampleSteps=[
      {label:"Volume",value:"40*12*0.25=120 ft3=4.44 yd3"},
      {label:"Weight",value:"4.44*2.025=9.0 tons"},
      {label:"With waste",value:"9.9 tons"},
    ];
    construction="<p class='text-sm'>Asphalt 145 lb/ft3 = 2.025 t/yd3. Drive 2-3 in, parking 4 in. Tack 0.05 gal/ft2.</p>";
  } else if(name.includes("Paint")||name.includes("Drywall")||name.includes("Flooring")||name.includes("Tile")||name.includes("Carpet")||name.includes("Insulation")){
    formula="Quantity = Area / Coverage per unit";
    vars=[{symbol:"Area",meaning:"Length x Width in ft2"}];
    exampleInputs="Room 12x10 ft, height 8 ft";
    exampleSteps=[
      {label:"Wall area",value:"2x(12x8)+2x(10x8)=352 ft2"},
      {label:"Less openings",value:"-21 ft2 door =331 ft2"},
      {label:"Gallons @350 ft2/gal",value:"ceil(331/350)=1"},
    ];
  }

  // FAQ specific - 4 unique per calculator
  const faq=[
    {q:`What does the ${name} calculate?`, a:`The ${name} estimates ${base.toLowerCase()} quantity for US jobs — ${catInfo.whatCalc.join(", ")}. Enter dimensions, choose units, add waste and price to get instant results.`},
    {q:`How do I measure for ${base.toLowerCase()}?`, a:`Measure ${exampleInputs.toLowerCase()} on site. Use the unit selectors — the tool converts inches→feet (÷12) and yards→feet (×3) before math. For non-rectangular, split into rectangles and add.`},
    {q:`How much waste should I add?`, a: catInfo.waste},
    {q:`How accurate is this ${base.toLowerCase()} estimate?`, a:`Math is exact for your inputs. Actual needs vary by site, material and installation. ${name.includes("Beam")||name.includes("Header")||name.includes("Load")||name.includes("Rebar") ? "For structural loads, have a qualified professional review your plans per code. " : ""}Add 5–10% waste for rectangular, 10–15% for irregular.`},
  ];

  out[slug] = {
    whatIs: `The <strong>${name}</strong> — ${catInfo.whatIs}`,
    whatCalculates: catInfo.whatCalc,
    howToUse: [
      `Measure ${exampleInputs} — use feet for length/width and inches for thickness where typical.`,
      `Enter values and select units. The calculator converts to feet before calculating (inches /12, yards x3).`,
      `Adjust waste % and optional price, then click Calculate. Results show with waste included.`,
      `Use Reset to clear and try another size.`,
    ],
    formula,
    variables: vars,
    example: { inputs: exampleInputs, steps: exampleSteps },
    constructionInfo: catInfo.material ? `<p class="text-sm"><strong>Material:</strong> ${catInfo.material}</p>`+construction : construction,
    materialInfo: catInfo.material,
    wasteInfo: catInfo.waste,
    tips: catInfo.tips,
    mistakes: catInfo.mistakes,
    assumptions: "This calculator provides an estimate based on your inputs. Actual requirements vary by site, material and installation. For code-regulated or load-bearing work, consult a qualified professional.",
    faq,
    visualVariant: c.cluster,
  };
}

fs.writeFileSync('src/data/calculatorDetails.ts', `// Auto-generated detailed content — original per calculator
export const calculatorDetails: Record<string, any> = ${JSON.stringify(out, null, 2)};
`);
console.log(`Generated details for ${Object.keys(out).length} calculators`);
