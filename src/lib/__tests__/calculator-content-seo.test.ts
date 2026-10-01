import { describe, expect, it } from "vitest";
import { getCalculatorContent } from "../calculator-content";
import { getModelForSlug } from "../calculator-registry";

describe("programmatic SEO content quality", () => {
  it("deduplicates equivalent result labels before rendering page copy and FAQs", () => {
    const content = getCalculatorContent("Paint Calculator", getModelForSlug("paint-calculator"));
    const normalized = content.outputs.map((label) => label.trim().toLowerCase());

    expect(new Set(normalized).size).toBe(normalized.length);
    expect(normalized.filter((label) => label === "calculated paint requirement")).toHaveLength(1);
    expect(content.faq[0].a.match(/Calculated paint requirement/g) ?? []).toHaveLength(1);
  });
});
