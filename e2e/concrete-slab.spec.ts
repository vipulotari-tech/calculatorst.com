import { expect, test } from "@playwright/test";

const slug = "concrete-slab-calculator";
const path = `/${slug}/`;

test.describe("Concrete Slab Calculator diagram", () => {
  test("live diagram switches between rectangle and circle geometry", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    const diagram = root.locator("[data-project-diagram]");

    await expect(diagram).toHaveAttribute("data-kind", "concreteSlab");
    await expect(diagram.locator("[data-concrete-slab-shape-name]")).toHaveText("Rectangular slab");
    await expect(diagram.locator("[data-concrete-slab-shape=\"0\"]")).toBeVisible();
    await expect(diagram.locator("[data-concrete-slab-shape=\"1\"]")).toBeHidden();
    await expect(diagram.locator("[data-concrete-slab-primary]")).toContainText("Length × width");

    await root.locator(`#${slug}-slabShape`).selectOption("1");

    await expect(root.locator(`#${slug}-field-length`)).toBeHidden();
    await expect(root.locator(`#${slug}-field-width`)).toBeHidden();
    await expect(root.locator(`#${slug}-field-diameter`)).toBeVisible();
    await expect(diagram.locator("[data-concrete-slab-shape-name]")).toHaveText("Circular slab");
    await expect(diagram.locator("[data-concrete-slab-shape=\"0\"]")).toBeHidden();
    await expect(diagram.locator("[data-concrete-slab-shape=\"1\"]")).toBeVisible();
    await expect(diagram.locator("[data-concrete-slab-primary]")).toContainText("Diameter");
  });

  test("thickened edge and gravel base appear only when entered", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    const rect = root.locator("[data-concrete-slab-shape=\"0\"]");
    const detail = root.locator("[data-concrete-slab-detail]");

    await expect(rect.locator("[data-concrete-slab-edge]")).toBeHidden();
    await expect(rect.locator("[data-concrete-slab-subbase]")).toBeHidden();
    await expect(detail).toHaveText("Uniform slab");

    await root.locator(`#${slug}-thickenedEdgeDepth`).fill("12");
    await root.locator(`#${slug}-thickenedEdgeWidth`).fill("6");

    await expect(rect.locator("[data-concrete-slab-edge]")).toBeVisible();
    await expect(detail).toContainText("edge");
    await expect(detail).toContainText("12 in");

    await root.locator(`#${slug}-subbaseDepth`).fill("4");

    await expect(rect.locator("[data-concrete-slab-subbase]")).toBeVisible();
    await expect(detail).toContainText("base 4 in deep");
    await expect(root.locator(".calc-project-diagram-values")).toContainText("Thickened edge");
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });

  test("diagram labels follow live unit and dimension changes", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    const primary = root.locator("[data-concrete-slab-primary]");
    const thickness = root.locator("[data-concrete-slab-thickness]");

    await root.locator(`#${slug}-length`).fill("12");
    await root.locator(`#${slug}-width`).fill("10");
    await root.locator(`#${slug}-thickness`).fill("5");

    await expect(primary).toHaveText("Length × width: 12 ft × 10 ft");
    await expect(thickness).toHaveText("Slab thickness: 5 in");

    await root.locator(`#${slug}-length-unit`).selectOption("m");
    await root.locator(`#${slug}-length`).fill("4");

    await expect(primary).toContainText("4 m");
  });
});
