import { describe, expect, it } from "vitest";
import { hubCalculators } from "../../data/hubCalculators";

const concrete = hubCalculators.filter((c) => c.cluster === "concrete");

describe("Concrete calculator SEO metadata", () => {
  it("keeps exactly 17 concrete calculator pages in the cluster", () => {
    expect(concrete).toHaveLength(17);
  });

  it("uses unique titles and descriptions", () => {
    expect(new Set(concrete.map((c) => c.title)).size).toBe(concrete.length);
    expect(new Set(concrete.map((c) => c.description)).size).toBe(concrete.length);
  });

  it("keeps concise, descriptive titles and useful meta descriptions", () => {
    for (const page of concrete) {
      expect(page.title.length, page.slug).toBeGreaterThanOrEqual(32);
      expect(page.title.length, page.slug).toBeLessThanOrEqual(72);
      expect(page.title.toLowerCase(), page.slug).toContain(page.h1.toLowerCase());

      expect(page.description.length, page.slug).toBeGreaterThanOrEqual(110);
      expect(page.description.length, page.slug).toBeLessThanOrEqual(180);
      expect(page.description.toLowerCase(), page.slug).toContain("concrete");
    }
  });

  it("keeps each page mapped to its primary search intent", () => {
    const bySlug = new Map(concrete.map((c) => [c.slug, c]));
    const expected: Record<string, RegExp> = {
      "concrete-calculator": /cubic yards|bags|weight/i,
      "concrete-volume-calculator": /cubic feet|cubic yards/i,
      "concrete-weight-calculator": /pounds|tons|metric tonnes/i,
      "concrete-cost-calculator": /cost|price|quoted/i,
      "concrete-mix-calculator": /cement|sand|aggregate/i,
      "concrete-pour-calculator": /truck|pump|short-load/i,
      "concrete-footing-calculator": /strip|round|footing/i,
      "concrete-foundation-calculator": /wall|footing|slab|pier/i,
      "concrete-slab-calculator": /slab|40\/50\/60\/80-lb/i,
      "concrete-wall-calculator": /opening|wall/i,
      "concrete-column-calculator": /circular|square|rectangular/i,
      "concrete-curb-calculator": /curb|gutter|linear feet/i,
      "concrete-stair-calculator": /solid|waist-slab|stair/i,
      "concrete-ramp-calculator": /slope|landing|ramp/i,
      "concrete-tube-calculator": /hollow|diameter|tube/i,
      "concrete-waste-calculator": /waste|rounding|order/i,
      "concrete-crack-repair-calculator": /crack|cartridge|sealant/i,
    };

    for (const [slug, pattern] of Object.entries(expected)) {
      const page = bySlug.get(slug);
      expect(page, slug).toBeDefined();
      expect(page!.title + " " + page!.description, slug).toMatch(pattern);
    }
  });

  it("does not reintroduce previously inaccurate concrete metadata claims", () => {
    const text = concrete.map((c) => `${c.title} ${c.description}`).join("\n");
    expect(text).not.toContain("Concrete Foundation Calculator — Concrete");
    expect(text).not.toContain("straight, L-shaped and U-shaped stairs");
    expect(text).not.toContain("with rebar and formwork considerations");
    expect(text).not.toContain("40/60/80-lb bags vs ready-mix");
  });
});
