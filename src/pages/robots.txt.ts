import type { APIRoute } from "astro";

const site = "https://calculatorst.com";

export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: /

# Sitemap
Sitemap: ${site}/sitemap.xml

# Disallow no-value params
Disallow: /*?*
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
