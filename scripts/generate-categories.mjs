import fs from 'fs';
import path from 'path';

const categories = [
  { slug: "slab-patio-driveway", name: "Slab, Patio & Driveway Calculators", desc: "Slab thickness, cost, reinforcement and garage/shed pads. Includes patio and driveway concrete", calculators: ["slab-thickness-calculator","slab-cost-calculator","slab-reinforcement-calculator","patio-concrete-calculator","patio-cost-calculator","driveway-concrete-calculator","driveway-cost-calculator","driveway-thickness-calculator","garage-slab-calculator","shed-foundation-calculator"] },
  { slug: "foundation", name: "Foundation & Footing Calculators", desc: "Strip, pad and pier footings plus foundation walls, basement and crawl space", calculators: ["foundation-cost-calculator","foundation-excavation-calculator","strip-footing-calculator","pad-footing-calculator","pier-footing-calculator","footing-volume-calculator","footing-concrete-calculator","foundation-wall-calculator","basement-wall-calculator","crawl-space-calculator"] },
  { slug: "rebar", name: "Rebar & Reinforcement Calculators", desc: "Rebar weight, spacing, laps, grids, mesh and chairs for US concrete work", calculators: ["rebar-calculator","rebar-weight-calculator","rebar-spacing-calculator","rebar-length-calculator","rebar-quantity-calculator","rebar-cost-calculator","rebar-grid-calculator","rebar-lap-length-calculator","reinforcement-mesh-calculator","rebar-chair-calculator"] },
  { slug: "brick-masonry", name: "Brick & Masonry Calculators", desc: "Brick quantity, mortar, veneer, pavers and masonry walls with waste and joints", calculators: ["brick-calculator","brick-wall-calculator","brick-quantity-calculator","brick-cost-calculator","brick-mortar-calculator","brick-veneer-calculator","brick-patio-calculator","brick-paver-calculator","masonry-calculator","masonry-wall-calculator","masonry-cost-calculator","masonry-block-calculator","brick-weight-calculator","brick-waste-calculator","brick-joint-calculator"] },
  { slug: "concrete-block", name: "Concrete Block & CMU Calculators", desc: "CMU walls, grout, mortar and reinforcement for block construction", calculators: ["concrete-block-calculator","cmu-calculator","cmu-wall-calculator","cmu-quantity-calculator","cmu-cost-calculator","concrete-block-wall-calculator","concrete-block-weight-calculator","concrete-block-mortar-calculator","cmu-grout-calculator","cmu-reinforcement-calculator"] },
  { slug: "mortar-grout-cement", name: "Mortar, Grout & Cement Calculators", desc: "Mortar and grout quantity plus cement bags and sand ratios", calculators: ["mortar-calculator","mortar-mix-calculator","mortar-quantity-calculator","mortar-cost-calculator","grout-calculator","grout-quantity-calculator","grout-cost-calculator","cement-calculator","cement-bag-calculator","cement-sand-ratio-calculator"] },
  { slug: "excavation", name: "Excavation & Earthwork Calculators", desc: "Trenches, cut/fill, soil volume and dirt removal", calculators: ["excavation-calculator","excavation-cost-calculator","trench-calculator","trench-volume-calculator","trench-backfill-calculator","earthwork-calculator","cut-and-fill-calculator","dirt-removal-calculator","soil-volume-calculator","soil-weight-calculator"] },
  { slug: "framing", name: "Framing & Lumber Calculators", desc: "Studs, joists, headers, beams and board feet for US framing", calculators: ["framing-calculator","wall-framing-calculator","stud-calculator","stud-spacing-calculator","lumber-calculator","lumber-cost-calculator","board-foot-calculator","board-foot-cost-calculator","joist-calculator","joist-spacing-calculator","floor-joist-calculator","ceiling-joist-calculator","header-size-calculator","beam-calculator","beam-load-calculator"] },
  { slug: "flooring", name: "Flooring & Tile Calculators", desc: "Hardwood, laminate, vinyl, carpet and tile quantity plus grout and adhesive", calculators: ["flooring-calculator","flooring-cost-calculator","hardwood-flooring-calculator","hardwood-flooring-cost-calculator","laminate-flooring-calculator","vinyl-flooring-calculator","carpet-calculator","carpet-cost-calculator","tile-calculator","tile-quantity-calculator","tile-cost-calculator","tile-grout-calculator","tile-adhesive-calculator","flooring-waste-calculator","underlayment-calculator"] },
  { slug: "drywall-paint", name: "Drywall, Paint & Insulation Calculators", desc: "Drywall sheets, screws, paint coverage, primer and spray foam", calculators: ["drywall-calculator","drywall-sheet-calculator","drywall-cost-calculator","drywall-joint-compound-calculator","drywall-screw-calculator","drywall-tape-calculator","paint-calculator","paint-coverage-calculator","paint-cost-calculator","primer-calculator","ceiling-paint-calculator","wall-paint-calculator","insulation-calculator","insulation-cost-calculator","spray-foam-calculator"] },
  { slug: "asphalt", name: "Asphalt, Parking & Surface Calculators", desc: "Asphalt driveways, parking lots, road base and surface area", calculators: ["asphalt-calculator","asphalt-cost-calculator","asphalt-driveway-calculator","asphalt-weight-calculator","asphalt-thickness-calculator","parking-lot-calculator","parking-lot-cost-calculator","road-base-calculator","surface-area-calculator","construction-material-cost-calculator"] },
];

for (const cat of categories) {
  const dir = path.join('src/pages/construction', cat.slug);
  fs.mkdirSync(dir, { recursive: true });
  const content = `---
import Layout from "../../../layouts/Layout.astro";
import Header from "../../../components/Header.astro";
import Footer from "../../../components/Footer.astro";
import Breadcrumbs from "../../../components/Breadcrumbs.astro";
import { hubCalculators } from "../../../data/hubCalculators";

const calculators = hubCalculators.filter(c => ${JSON.stringify(cat.calculators)}.includes(c.slug));
---

<Layout title="${cat.name} — Construction Calculators | Calculator Street" description="${cat.desc} — Free US construction calculators with waste and cost." canonical="/construction/${cat.slug}/">
  <Header slot="header" />
  <main id="main" tabindex="-1" class="w-full">
    <div class="mx-auto max-w-[1400px] px-6 py-4 max-md:px-4">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Construction", href: "/construction/" }, { label: "${cat.name.replace(/"/g,'\\"')}" }]} />
    </div>
    <section class="mx-auto max-w-[1400px] px-6 pb-12 max-md:px-4">
      <div class="mx-auto max-w-[900px]">
        <h1 class="text-display-lg font-semibold tracking-[-0.04em] text-ink">${cat.name}</h1>
        <p class="mt-3 text-body-md leading-6 text-body [text-wrap:pretty]">${cat.desc}. All calculators run 100% in your browser — no backend, no tracking. US customary default with metric where useful. Estimates only — verify with a qualified professional for structural or code-regulated work.</p>
        <div class="mt-8 grid gap-4 sm:grid-cols-2">
          {calculators.map((c) => (
            <a href={\`/\${c.slug}/\`} class="group rounded-lg border border-hairline bg-canvas p-5 shadow-card transition hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link">
              <h3 class="text-[15px] font-semibold tracking-[-0.02em] text-ink group-hover:text-link">{c.h1}</h3>
              <p class="mt-1 line-clamp-2 text-sm leading-5 text-body">{c.description}</p>
              <span class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-ink group-hover:text-link">Open <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true" class="transition group-hover:translate-x-0.5"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg></span>
            </a>
          ))}
        </div>
        <div class="mt-10 rounded-lg border border-hairline bg-canvas p-6">
          <h2 class="text-display-sm font-semibold tracking-[-0.03em] text-ink">How to use these calculators</h2>
          <ol class="mt-3 list-decimal space-y-1 pl-5 text-sm leading-6 text-body">
            <li>Choose the calculator that matches your job (e.g., volume vs. cost vs. weight).</li>
            <li>Enter dimensions and select units — the tool converts to feet before math.</li>
            <li>Add waste % (5–10% rectangular, 10–15% irregular) and optional price to see cost.</li>
          </ol>
          <p class="mt-3 text-sm leading-6 text-body">All results are estimates. Actual needs vary by site, material and installation. For beams, headers and loads, have a professional review your plans.</p>
        </div>
      </div>
    </section>
  </main>
  <Footer slot="footer" />
</Layout>
`;
  fs.writeFileSync(path.join(dir, 'index.astro'), content);
  console.log(`Created ${cat.slug} with ${cat.calculators.length} calculators`);
}
console.log('Done');
