import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const generic = readFileSync("src/components/calculators/GenericCalculator.astro", "utf8");
const priority = readFileSync("src/components/calculators/PriorityCalculatorDiagram.astro", "utf8");
const project = readFileSync("src/components/calculators/ProjectDiagram.astro", "utf8");

const slugs = [
  "paint-calculator",
  "gravel-calculator",
  "mulch-calculator",
  "roofing-calculator",
  "flooring-calculator",
  "carpet-calculator",
  "tile-calculator",
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

describe("priority construction calculator diagrams", () => {
  it("routes all requested calculators to the rich diagram component", () => {
    for (const slug of slugs) {
      expect(generic, slug).toContain(`"${slug}"`);
    }
    expect(generic).toContain("<PriorityCalculatorDiagram");
  });

  it("keeps calculators with richer dedicated geometry on their specialized diagrams", () => {
    expect(generic).toContain("<ConcreteCalculatorDiagram");
    expect(generic).toContain("<ConcreteVolumeDiagram");
    expect(project).toContain('lower === "concrete-slab-calculator" ? "concreteSlab"');
    expect(project).toContain('lower === "roof-pitch-calculator" ? "roofPitch"');
  });

  it("includes live SVG input bindings and accessible metadata", () => {
    expect(priority).toContain("data-priority-rich-diagram");
    expect(priority).toContain("role=\"img\"");
    expect(priority).toContain("<title");
    expect(priority).toContain("<desc");
    expect(priority).toContain("data-live-value");
    expect(priority).toContain("Formula used by this calculator");
  });
});
