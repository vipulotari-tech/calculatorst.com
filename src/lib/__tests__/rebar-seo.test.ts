import { describe, expect, it } from "vitest";
import { hubCalculators } from "../../data/hubCalculators";

const pages = hubCalculators.filter((c) => c.cluster === "rebar");

describe("Rebar & Reinforcement SEO metadata", () => {
  it("keeps exactly 10 calculators in the category", () => {
    expect(pages).toHaveLength(10);
  });

  it("uses unique titles and descriptions with sensible SERP lengths", () => {
    expect(new Set(pages.map((p) => p.title)).size).toBe(pages.length);
    expect(new Set(pages.map((p) => p.description)).size).toBe(pages.length);
    for (const page of pages) {
      expect(page.title.length, page.slug).toBeGreaterThanOrEqual(35);
      expect(page.title.length, page.slug).toBeLessThanOrEqual(70);
      expect(page.description.length, page.slug).toBeGreaterThanOrEqual(120);
      expect(page.description.length, page.slug).toBeLessThanOrEqual(180);
    }
  });

  it("maps every page to a distinct rebar intent", () => {
    const bySlug = new Map(pages.map((p) => [p.slug, p]));
    const expected: Record<string, RegExp> = {
      "rebar-calculator": /grid|stock bars|weight|cost/i,
      "rebar-weight-calculator": /lb\/ft|tons|kilograms|metric tonnes/i,
      "rebar-quantity-calculator": /quantity|stock|grid bars/i,
      "rebar-cost-calculator": /cost|price|tax|delivery/i,
      "rebar-spacing-calculator": /spacing|bar count|equal/i,
      "rebar-length-calculator": /footage|stock bars|length/i,
      "rebar-grid-calculator": /rows|columns|grid|spacing/i,
      "rebar-lap-length-calculator": /lap|splice|additional|extra/i,
      "reinforcement-mesh-calculator": /mesh|sheet|overlap|orientation/i,
      "rebar-chair-calculator": /chair|support grid|spacing/i,
    };
    for (const [slug, pattern] of Object.entries(expected)) {
      const page = bySlug.get(slug);
      expect(page, slug).toBeDefined();
      expect(`${page!.title} ${page!.description}`, slug).toMatch(pattern);
    }
  });

  it("does not claim to design reinforcement or derive required lap length", () => {
    const text = pages.map((p) => `${p.title} ${p.description}`).join("\n").toLowerCase();
    expect(text).not.toContain("recommended rebar size");
    expect(text).not.toContain("code compliant spacing");
    expect(text).not.toContain("required lap splice length");
    expect(text).not.toContain("40d");
  });

  it("keeps mesh and chair intent separate from bar-grid intent", () => {
    const mesh = pages.find((p) => p.slug === "reinforcement-mesh-calculator")!;
    const chair = pages.find((p) => p.slug === "rebar-chair-calculator")!;
    const grid = pages.find((p) => p.slug === "rebar-grid-calculator")!;
    expect(mesh.description).toMatch(/sheet|roll|overlap/i);
    expect(chair.description).toMatch(/chair|support/i);
    expect(grid.description).toMatch(/rows|columns|grid/i);
  });
});
