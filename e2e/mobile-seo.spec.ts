import { test, expect } from "@playwright/test";

const viewports = [
  { width: 320, height: 700 },
  { width: 360, height: 780 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 768, height: 1024 },
];

const representativePages = [
  "/concrete-calculator/",
  "/paint-calculator/",
  "/roof-pitch-calculator/",
  "/tile-calculator/",
  "/fence-calculator/",
];

test.beforeEach(async ({ context }) => {
  await context.route(/https:\/\/([^/]+\.)?(googletagmanager\.com|google-analytics\.com|googlesyndication\.com|cloudflareinsights\.com)\//, route =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: "" }),
  );
});

for (const viewport of viewports) {
  test(`priority calculator layout has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);

    for (const path of representativePages) {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("[data-calculator-slug]")).toBeVisible();

      const overflow = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));

      expect(overflow.document, `${path} document overflow at ${viewport.width}px`).toBeLessThanOrEqual(overflow.viewport + 1);
      expect(overflow.body, `${path} body overflow at ${viewport.width}px`).toBeLessThanOrEqual(overflow.viewport + 1);
    }
  });
}
