import type { APIRoute } from "astro";
import { siteCalculators, siteCategories as hubCategories } from "../data/siteCalculators";

export const prerender = true;

const site = "https://calculatorst.com";

// Keep the sitemap canonical-only. Do not publish redirect aliases or synthetic
// lastmod dates: Google can trust lastmod only when it reflects real page changes.
const staticPaths = [
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

const calculatorPaths = siteCalculators.map(({ slug }) => `/${slug}/`);

const paths = Array.from(new Set([...staticPaths, ...calculatorPaths]));

export const GET: APIRoute = () => {
  const urls = paths
    .map((path) => `  <url>\n    <loc>${site}${path}</loc>\n  </url>`)
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
