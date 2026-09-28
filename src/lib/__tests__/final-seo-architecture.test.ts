import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const layout = readFileSync("src/layouts/Layout.astro", "utf8");
const calculatorLayout = readFileSync("src/components/CalculatorLayout.astro", "utf8");
const homepage = readFileSync("src/pages/index.astro", "utf8");
const author = readFileSync("src/pages/author/vipul-otari/index.astro", "utf8");
const construction = readFileSync("src/pages/construction/index.astro", "utf8");

describe("final SEO authority and crawl architecture", () => {
  it("uses stable entity IDs across site and calculator schemas", () => {
    expect(layout).toContain('const organizationId = siteNoSlash + "/#organization"');
    expect(layout).toContain('const authorId = siteNoSlash + "/author/vipul-otari/#person"');
    expect(layout).toContain('"@id": canonicalUrl + "#webpage"');
    expect(calculatorLayout).toContain('"@id": canonicalUrl + "#calculator"');
    expect(calculatorLayout).toContain('mainEntityOfPage: { "@id": canonicalUrl + "#webpage" }');
    expect(author).toContain('"@id": "https://calculatorst.com/author/vipul-otari/#person"');
  });

  it("links homepage directly to previously broad-query calculator intents", () => {
    for (const slug of [
      "deck-mud-calculator",
      "concrete-crack-repair-calculator",
      "driveway-gravel-calculator",
      "carpet-cost-calculator",
      "cut-and-fill-calculator",
      "asphalt-weight-calculator",
      "foundation-cost-calculator",
      "aggregate-weight-calculator",
    ]) {
      expect(homepage).toContain(`"${slug}"`);
    }
    expect(homepage).toContain("US + Metric");
  });

  it("publishes an ItemList for construction category hierarchy", () => {
    expect(construction).toContain('"@type": "ItemList"');
    expect(construction).toContain("numberOfItems: hubCategories.length");
  });
});
