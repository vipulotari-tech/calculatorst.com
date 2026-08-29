import type { APIRoute } from "astro";
import fs from "fs";
import path from "path";
import { calculators } from "../data/calculators";
import { hubCalculators } from "../data/hubCalculators";

const site = "https://calculatorst.com";

// Core pages — 16 category hubs + 200 calculators
const staticPages = [
  "/",
  "/construction/",
  "/construction/gravel/",
  "/construction/fencing/",
  "/construction/concrete/",
  "/construction/roofing/",
  "/construction/decking/",
  "/construction/landscaping/",
  // New 10 hubs for 200-hub
  "/construction/slab-patio-driveway/",
  "/construction/foundation/",
  "/construction/rebar/",
  "/construction/brick-masonry/",
  "/construction/concrete-block/",
  "/construction/mortar-grout-cement/",
  "/construction/excavation/",
  "/construction/framing/",
  "/construction/flooring/",
  "/construction/drywall-paint/",
  "/construction/asphalt/",
  "/calculators/",
  "/about/",
  "/contact/",
  "/privacy/",
  "/terms/",
  "/disclaimer/",
];
// Merge 10 existing + 190 new (avoid duplicates)
const allCalcs = [...calculators];
const existingSlugs = new Set(calculators.map(c=>c.slug));
for (const h of hubCalculators) {
  if (!existingSlugs.has(h.slug)) allCalcs.push(h as any);
}
const calculatorPages = allCalcs.map((c) => `/${c.slug}/`);
const pages = [...staticPages.slice(0, 18), ...calculatorPages, ...staticPages.slice(18)];

function getLastmod(urlPath: string): string {
  const fallback = new Date().toISOString().split("T")[0];
  try {
    const fileMap: Record<string, string> = {
      "/": "src/pages/index.astro",
      "/construction/": "src/pages/construction/index.astro",
      "/construction/gravel/": "src/pages/construction/gravel/index.astro",
      "/construction/fencing/": "src/pages/construction/fencing/index.astro",
      "/construction/concrete/": "src/pages/construction/concrete/index.astro",
      "/construction/roofing/": "src/pages/construction/roofing/index.astro",
      "/construction/decking/": "src/pages/construction/decking/index.astro",
      "/construction/landscaping/": "src/pages/construction/landscaping/index.astro",
      "/construction/slab-patio-driveway/": "src/pages/construction/slab-patio-driveway/index.astro",
      "/construction/foundation/": "src/pages/construction/foundation/index.astro",
      "/construction/rebar/": "src/pages/construction/rebar/index.astro",
      "/construction/brick-masonry/": "src/pages/construction/brick-masonry/index.astro",
      "/construction/concrete-block/": "src/pages/construction/concrete-block/index.astro",
      "/construction/mortar-grout-cement/": "src/pages/construction/mortar-grout-cement/index.astro",
      "/construction/excavation/": "src/pages/construction/excavation/index.astro",
      "/construction/framing/": "src/pages/construction/framing/index.astro",
      "/construction/flooring/": "src/pages/construction/flooring/index.astro",
      "/construction/drywall-paint/": "src/pages/construction/drywall-paint/index.astro",
      "/construction/asphalt/": "src/pages/construction/asphalt/index.astro",
      "/calculators/": "src/pages/calculators/index.astro",
      "/about/": "src/pages/about/index.astro",
      "/contact/": "src/pages/contact/index.astro",
      "/privacy/": "src/pages/privacy/index.astro",
      "/terms/": "src/pages/terms/index.astro",
      "/disclaimer/": "src/pages/disclaimer/index.astro",
    };
    let rel = fileMap[urlPath];
    if (!rel) {
      // Dynamic calculator: /slug/ -> src/pages/[slug]/index.astro or src/pages/slug/index.astro
      const slug = urlPath.replace(/^\//, "").replace(/\/$/, "");
      // Try static file first, else dynamic template
      const staticPath = `src/pages/${slug}/index.astro`;
      const dynamicPath = `src/pages/[slug]/index.astro`;
      rel = fs.existsSync(path.join(process.cwd(), staticPath)) ? staticPath : dynamicPath;
    }
    const full = path.join(process.cwd(), rel);
    const stat = fs.statSync(full);
    return stat.mtime.toISOString().split("T")[0];
  } catch {
    return fallback;
  }
}

export const GET: APIRoute = () => {
  const urls = pages
    .map((p) => {
      const lastmod = getLastmod(p);
      return `  <url>
    <loc>${site}${p}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${p === "/" ? "1.0" : p.includes("calculator") ? "0.9" : "0.7"}</priority>
  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};
