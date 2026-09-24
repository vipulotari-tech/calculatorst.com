import { describe, expect, it } from "vitest";
import { hubCalculators } from "../../data/hubCalculators";

const pages = hubCalculators.filter((c) => c.cluster === "foundation");

describe("Foundation & Footing SEO metadata", () => {
  it("keeps exactly 10 calculators in the category", () => {
    expect(pages).toHaveLength(10);
  });

  it("uses unique titles and descriptions with sensible SERP lengths", () => {
    expect(new Set(pages.map((p) => p.title)).size).toBe(pages.length);
    expect(new Set(pages.map((p) => p.description)).size).toBe(pages.length);
    for (const page of pages) {
      expect(page.title.length, page.slug).toBeGreaterThanOrEqual(35);
      expect(page.title.length, page.slug).toBeLessThanOrEqual(72);
      expect(page.description.length, page.slug).toBeGreaterThanOrEqual(120);
      expect(page.description.length, page.slug).toBeLessThanOrEqual(180);
    }
  });

  it("maps every calculator to a distinct foundation search intent", () => {
    const bySlug = new Map(pages.map((p) => [p.slug, p]));
    const expected: Record<string, RegExp> = {
      "foundation-cost-calculator": /cost|project|reinforcement|labor/i,
      "foundation-excavation-calculator": /excavation|bank|swell|haul/i,
      "strip-footing-calculator": /strip|continuous|linear|centerline/i,
      "pad-footing-calculator": /pad|rectangular|square|round/i,
      "pier-footing-calculator": /pier|shaft|bell|diameter/i,
      "footing-volume-calculator": /volume|cubic feet|cubic yards|meters/i,
      "footing-concrete-calculator": /bags|weight|cost|concrete/i,
      "foundation-wall-calculator": /wall|opening|form/i,
      "basement-wall-calculator": /basement|perimeter|opening|form/i,
      "crawl-space-calculator": /crawl|stem-wall|vent/i,
    };
    for (const [slug, pattern] of Object.entries(expected)) {
      const p = bySlug.get(slug);
      expect(p, slug).toBeDefined();
      expect(`${p!.title} ${p!.description}`, slug).toMatch(pattern);
    }
  });

  it("avoids structural-design promises", () => {
    const text = pages.map((p) => `${p.title} ${p.description}`).join("\n").toLowerCase();
    expect(text).not.toContain("recommended footing size");
    expect(text).not.toContain("required frost depth");
    expect(text).not.toContain("safe foundation design");
    expect(text).not.toContain("soil bearing capacity calculator");
  });

  it("keeps wall, basement and crawl-space intents separate", () => {
    const wall = pages.find(p => p.slug === "foundation-wall-calculator")!;
    const basement = pages.find(p => p.slug === "basement-wall-calculator")!;
    const crawl = pages.find(p => p.slug === "crawl-space-calculator")!;
    expect(wall.title).not.toBe(basement.title);
    expect(basement.description).toMatch(/outside length|width|extra wall/i);
    expect(crawl.description).toMatch(/stem-wall|vent\/access|interior wall/i);
  });
});
