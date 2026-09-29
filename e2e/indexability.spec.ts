import { expect, test } from "@playwright/test";

const priorityCalculators = [
  "concrete-calculator",
  "paint-calculator",
  "gravel-calculator",
  "mulch-calculator",
  "roofing-calculator",
  "roof-pitch-calculator",
  "flooring-calculator",
  "carpet-calculator",
  "tile-calculator",
  "concrete-slab-calculator",
  "drywall-calculator",
  "fence-calculator",
  "deck-calculator",
  "paver-calculator",
  "asphalt-calculator",
  "brick-calculator",
  "concrete-block-calculator",
  "rebar-calculator",
  "excavation-calculator",
  "earthwork-calculator",
];

test("Google crawl controls explicitly allow canonical pages", async ({ request }) => {
  const response = await request.get("/robots.txt");
  expect(response.status()).toBe(200);
  const body = await response.text();

  expect(body).toContain("User-agent: Googlebot\nAllow: /");
  expect(body).toContain("User-agent: Googlebot-Image\nAllow: /");
  expect(body).toContain("User-agent: Google-Extended\nAllow: /");
  expect(body).toContain("User-agent: *\nAllow: /");
  expect(body).toContain("Sitemap: https://calculatorst.com/sitemap.xml");
  expect(body).not.toMatch(/Disallow:\s*\//i);
});

test("priority 20 calculator URLs are sitemap-listed and indexable", async ({ page, request }) => {
  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.status()).toBe(200);
  const sitemap = await sitemapResponse.text();

  for (const slug of priorityCalculators) {
    const path = `/${slug}/`;
    const canonical = `https://calculatorst.com/${slug}/`;

    expect(sitemap, `${slug} missing from sitemap`).toContain(`<loc>${canonical}</loc>`);

    const response = await page.goto(path);
    expect(response?.status(), `${slug} must return HTTP 200`).toBe(200);

    const robotsMeta = page.locator('meta[name="robots"]');
    await expect(robotsMeta, `${slug} must not ship noindex`).toHaveCount(0);

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);

    const xRobots = response?.headers()["x-robots-tag"] ?? "";
    expect(xRobots.toLowerCase(), `${slug} must not return X-Robots-Tag noindex`).not.toContain("noindex");
  }
});
