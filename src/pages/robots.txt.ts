import type { APIRoute } from "astro";

export const prerender = true;

const site = "https://calculatorst.com";

export const GET: APIRoute = () => {
  // Keep canonical Calculator Street pages crawlable by Google Search and
  // Google's image crawler. Google-Extended is also explicitly allowed so
  // AI/grounding crawlers cannot be mistaken for a site-wide crawl block.
  // Search-result URLs are handled with noindex at the page/worker level,
  // not by robots.txt, so Google can still crawl and see the noindex signal.
  const body = `User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: *
Allow: /

# Sitemap
Sitemap: ${site}/sitemap.xml
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
