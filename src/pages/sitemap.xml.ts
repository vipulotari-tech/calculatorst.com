import type { APIRoute } from "astro";
import { calculators } from "../data/calculators";
import { hubCalculators, hubCategories } from "../data/hubCalculators";

export const prerender = true;

const site = "https://calculatorst.com";

// Core static hubs and trust pages
const staticPages = [
  "/",
  "/author/vipul-otari/",
  "/construction/",
  ...hubCategories.map((c) => `/construction/${c.slug}/`),
  "/calculators/",
  "/about/",
  "/contact/",
  "/privacy/",
  "/terms/",
  "/disclaimer/",
];

// All 205 verified, indexable calculators
const allCalcSlugs = Array.from(
  new Set([
    ...calculators.map((c) => c.slug),
    ...hubCalculators.map((c) => c.slug),
  ])
);
const calculatorPages = allCalcSlugs.map((s) => `/${s}/`);

const pages = Array.from(new Set([...staticPages, ...calculatorPages]));

export const GET: APIRoute = () => {
  const lastmod = "2026-09-11";
  const urls = pages
    .map((p) => {
      const isHome = p === "/";
      const isCalc = p.includes("calculator");
      const priority = isHome ? "1.0" : isCalc ? "0.9" : "0.7";
      return `  <url>
    <loc>${site}${p}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
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
