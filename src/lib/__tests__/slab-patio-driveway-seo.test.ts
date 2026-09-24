import { describe, expect, it } from "vitest";
import { hubCalculators } from "../../data/hubCalculators";

const pages = hubCalculators.filter((c) => c.cluster === "slab");

describe("Slab, Patio & Driveway SEO metadata", () => {
  it("keeps exactly 10 calculators in the category", () => {
    expect(pages).toHaveLength(10);
  });

  it("uses unique, concise titles and useful descriptions", () => {
    expect(new Set(pages.map((p) => p.title)).size).toBe(pages.length);
    expect(new Set(pages.map((p) => p.description)).size).toBe(pages.length);

    for (const page of pages) {
      expect(page.title.length, page.slug).toBeGreaterThanOrEqual(35);
      expect(page.title.length, page.slug).toBeLessThanOrEqual(70);
      expect(page.description.length, page.slug).toBeGreaterThanOrEqual(120);
      expect(page.description.length, page.slug).toBeLessThanOrEqual(170);
    }
  });

  it("keeps each calculator mapped to a distinct search intent", () => {
    const bySlug = new Map(pages.map((p) => [p.slug, p]));
    const expected: Record<string, RegExp> = {
      "slab-thickness-calculator": /volume|depth|coverage/i,
      "slab-cost-calculator": /cost|price|project/i,
      "slab-reinforcement-calculator": /rebar|grid|spacing/i,
      "patio-concrete-calculator": /patio|yards|bags|base/i,
      "patio-cost-calculator": /patio|cost|finish|labor/i,
      "driveway-concrete-calculator": /driveway|apron|base|truck/i,
      "driveway-cost-calculator": /driveway|cost|replacement|removal/i,
      "driveway-thickness-calculator": /driveway|volume|depth|scenario/i,
      "garage-slab-calculator": /garage|thickened|base|concrete/i,
      "shed-foundation-calculator": /shed|slab|pier|footing/i,
    };

    for (const [slug, pattern] of Object.entries(expected)) {
      const page = bySlug.get(slug);
      expect(page, slug).toBeDefined();
      expect(`${page!.title} ${page!.description}`, slug).toMatch(pattern);
    }
  });

  it("does not imply that inverse thickness calculators perform structural design", () => {
    const thicknessPages = pages.filter((p) => p.slug.includes("thickness"));
    for (const page of thicknessPages) {
      expect(page.description.toLowerCase()).not.toContain("recommended thickness");
      expect(page.description.toLowerCase()).not.toContain("required thickness");
    }
  });

  it("keeps previously misleading metadata out of the category", () => {
    const text = pages.map((p) => `${p.title} ${p.description}`).join("\n");
    expect(text).not.toContain("Works for single or double car driveways");
    expect(text).not.toContain("Works for single or double car garages");
    expect(text).not.toContain("how thick should a slab be");
  });
});
