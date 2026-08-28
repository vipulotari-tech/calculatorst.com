import type { APIRoute } from "astro";
import fs from "fs";
import path from "path";
import { calculators } from "../data/calculators";

const site = "https://calculatorst.com";

// Core pages — calculators injected dynamically from src/data/calculators.ts for single-source truth
const staticPages = [
  "/",
  "/construction/",
  "/construction/gravel/",
  "/construction/fencing/",
  "/construction/concrete/",
  "/construction/roofing/",
  "/construction/decking/",
  "/construction/landscaping/",
  "/calculators/",
  "/about/",
  "/contact/",
  "/privacy/",
  "/terms/",
  "/disclaimer/",
];
const calculatorPages = calculators.map((c) => `/${c.slug}/`);
const pages = [...staticPages.slice(0, 8), ...calculatorPages, ...staticPages.slice(8)];

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
      "/about/": "src/pages/about/index.astro",
      "/contact/": "src/pages/contact/index.astro",
      "/privacy/": "src/pages/privacy/index.astro",
      "/terms/": "src/pages/terms/index.astro",
      "/disclaimer/": "src/pages/disclaimer/index.astro",
    };
    let rel = fileMap[urlPath];
    if (!rel) {
      // Dynamic calculator: /slug/ -> src/pages/slug/index.astro
      const slug = urlPath.replace(/^\//, "").replace(/\/$/, "");
      rel = `src/pages/${slug}/index.astro`;
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
