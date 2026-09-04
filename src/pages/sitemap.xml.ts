// @ts-nocheck
import type { APIRoute } from "astro";
import fs from "fs";
import path from "path";
import { calculators } from "../data/calculators";
import { hubCalculators } from "../data/hubCalculators";

export const prerender = true;

const site = "https://calculatorst.com";

// Core pages — 16 category hubs (hubCategories) + 200 calculators — single registry
import { hubCategories } from "../data/hubCalculators";
const staticPages = [
  "/",
  "/construction/",
  ...hubCategories.map(c => `/construction/${c.slug}/`),
  // Legacy aliases — keep for indexed URLs, not primary
  "/construction/fencing/",
  "/construction/decking/",
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
const calcIdx = staticPages.indexOf("/calculators/");
const pages = [...staticPages.slice(0, calcIdx + 1), ...calculatorPages, ...staticPages.slice(calcIdx + 1)];

function getLastmod(urlPath: string): string {
  const fallback = new Date().toISOString().split("T")[0];
  try {
    const fileMap: Record<string, string> = {
      "/": "src/pages/index.astro",
      "/construction/": "src/pages/construction/index.astro",
      ...Object.fromEntries(hubCategories.map(c => [`/construction/${c.slug}/`, `src/pages/construction/${c.slug}/index.astro`])),
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
