import { describe, expect, it } from "vitest";
import { hubCalculators } from "../../data/hubCalculators";

const bySlug = new Map(hubCalculators.map((c) => [c.slug, c]));

describe("GSC cannibalization intent separation", () => {
  it("gives concrete pad/slab cost its own exact intent", () => {
    expect(bySlug.get("slab-cost-calculator")!.title).toContain("Concrete Pad & Slab Cost Calculator");
    expect(bySlug.get("concrete-cost-calculator")!.title.toLowerCase()).not.toContain("pad");
  });

  it("separates parking-lot quantity from parking-lot cost", () => {
    expect(bySlug.get("parking-lot-calculator")!.title).toMatch(/Quantity Calculator/i);
    expect(bySlug.get("parking-lot-calculator")!.title).not.toMatch(/Cost/i);
    expect(bySlug.get("parking-lot-cost-calculator")!.title).toMatch(/Cost Calculator/i);
  });

  it("keeps drywall mud and foundation cost mapped to dedicated pages", () => {
    expect(bySlug.get("drywall-joint-compound-calculator")!.title).toMatch(/^Drywall Mud Calculator/);
    expect(bySlug.get("foundation-cost-calculator")!.title).toMatch(/^Foundation Cost Calculator/);
  });
});
