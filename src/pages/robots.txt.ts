import type { APIRoute } from "astro";

export const prerender = true;

const site = "https://calculatorst.com";

export const GET: APIRoute = () => {
  // Note: Search result pages (/calculators/?q=...) are intentionally
  // NOT blocked via robots.txt. They are allowed but serve
  // <meta name="robots" content="noindex"> via Layout.astro (see
  // isSearchResultPage logic). This avoids GSC "Blocked by robots.txt"
  // while keeping search results out of the index and preserving crawl
  // budget. Junk templated URLs like ?q=<JS template> are
  // 301-redirected to /calculators/ via src/middleware.ts.
  const body = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${site}/sitemap.xml
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
