import type { APIRoute } from "astro";
import fs from "fs";
import path from "path";

const site = "https://calculatorst.com";

const pages = [
  "/",
  "/construction/",
  "/construction/gravel/",
  "/construction/fencing/",
  "/construction/concrete/",
  "/construction/roofing/",
  "/construction/decking/",
  "/construction/landscaping/",
  "/calculators/",
  "/gravel-calculator/",
  "/pea-gravel-calculator/",
  "/driveway-gravel-calculator/",
  "/fence-cost-calculator/",
  "/concrete-slab-calculator/",
  "/roof-pitch-calculator/",
  "/roof-square-footage-calculator/",
  "/deck-material-calculator/",
  "/paver-calculator/",
  "/mulch-calculator/",
  "/about/",
  "/contact/",
  "/privacy/",
  "/terms/",
  "/disclaimer/",
];

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
      "/calculators/": "src/pages/calculators/index.astro",
      "/gravel-calculator/": "src/pages/gravel-calculator/index.astro",
      "/pea-gravel-calculator/": "src/pages/pea-gravel-calculator/index.astro",
      "/driveway-gravel-calculator/": "src/pages/driveway-gravel-calculator/index.astro",
      "/fence-cost-calculator/": "src/pages/fence-cost-calculator/index.astro",
      "/concrete-slab-calculator/": "src/pages/concrete-slab-calculator/index.astro",
      "/roof-pitch-calculator/": "src/pages/roof-pitch-calculator/index.astro",
      "/roof-square-footage-calculator/": "src/pages/roof-square-footage-calculator/index.astro",
      "/deck-material-calculator/": "src/pages/deck-material-calculator/index.astro",
      "/paver-calculator/": "src/pages/paver-calculator/index.astro",
      "/mulch-calculator/": "src/pages/mulch-calculator/index.astro",
      "/about/": "src/pages/about/index.astro",
      "/contact/": "src/pages/contact/index.astro",
      "/privacy/": "src/pages/privacy/index.astro",
      "/terms/": "src/pages/terms/index.astro",
      "/disclaimer/": "src/pages/disclaimer/index.astro",
    };
    const rel = fileMap[urlPath];
    if (!rel) return fallback;
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
