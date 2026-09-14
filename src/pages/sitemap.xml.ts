import type { APIRoute } from "astro";
import { calculators } from "../data/calculators";
import { hubCalculators, hubCategories } from "../data/hubCalculators";

export const prerender = true;

const site = "https://calculatorst.com";

const staticPages = [
  { path: "/", changefreq: "daily" as const, priority: 1.0 },
  { path: "/author/vipul-otari/", changefreq: "monthly" as const, priority: 0.6 },
  { path: "/construction/", changefreq: "weekly" as const, priority: 0.8 },
  ...hubCategories.map((c) => ({ path: `/construction/${c.slug}/`, changefreq: "weekly" as const, priority: 0.7 })),
  // Aliases that have standalone HTML (decking/fencing duplicate deck-fence) — include with correct lastmod to fix 1970 epoch
  { path: "/construction/decking/", changefreq: "weekly" as const, priority: 0.6 },
  { path: "/construction/fencing/", changefreq: "weekly" as const, priority: 0.6 },
  { path: "/calculators/", changefreq: "daily" as const, priority: 0.9 },
  { path: "/about/", changefreq: "monthly" as const, priority: 0.6 },
  { path: "/contact/", changefreq: "monthly" as const, priority: 0.6 },
  { path: "/privacy/", changefreq: "monthly" as const, priority: 0.6 },
  { path: "/terms/", changefreq: "monthly" as const, priority: 0.6 },
  { path: "/disclaimer/", changefreq: "monthly" as const, priority: 0.6 },
];

// Extra standalone calculators with dedicated pages (not in hubCalculators)
const extraCalculatorSlugs = [
  "deck-material-calculator",
  "driveway-gravel-calculator",
  "pea-gravel-calculator",
  "roof-square-footage-calculator",
];

const allCalcSlugs = Array.from(
  new Set([
    ...calculators.map((c) => c.slug),
    ...hubCalculators.map((c) => c.slug),
    ...extraCalculatorSlugs,
  ])
);

const priorityMap: Record<string, number> = {
  "gravel-calculator": 0.95,
  "concrete-calculator": 0.95,
  "concrete-slab-calculator": 0.95,
  "roof-pitch-calculator": 0.95,
  "fence-calculator": 0.95,
  "concrete-weight-calculator": 0.9,
  "deck-calculator": 0.9,
  "paver-calculator": 0.9,
  "mulch-calculator": 0.9,
  "brick-calculator": 0.85,
  "rebar-calculator": 0.85,
  "excavation-calculator": 0.85,
  "paint-calculator": 0.8,
  "flooring-calculator": 0.8,
  "mortar-calculator": 0.8,
  "deck-material-calculator": 0.85,
  "driveway-gravel-calculator": 0.85,
  "pea-gravel-calculator": 0.85,
  "roof-square-footage-calculator": 0.85,
};

const calculatorPages = allCalcSlugs.map((s) => {
  const priority = priorityMap[s] ?? 0.8;
  return { path: `/${s}/`, changefreq: "weekly" as const, priority };
});

const pages = [...staticPages, ...calculatorPages];

export const GET: APIRoute = () => {
  // Use build date as lastmod - fixes 1970-01-01 epoch bug when dates were missing or defaulted to 0
  const lastmod = new Date().toISOString().split("T")[0];
  const urls = pages
    .map((p) => {
      const pc = typeof p === "string" ? p : p.path;
      const pr = typeof p === "string" ? (pc === "/" ? 1.0 : pc.includes("calculator") ? 0.8 : 0.6) : p.priority;
      const ch = typeof p === "string" ? "weekly" : p.changefreq;
      return `  <url>
    <loc>${site}${pc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${ch}</changefreq>
    <priority>${pr}</priority>
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
