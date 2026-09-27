import { expect, test } from "@playwright/test";

const slug = "concrete-stair-calculator";
const path = `/${slug}/`;

test.describe("Concrete Stair Calculator", () => {
  test("model switching controls waist inputs and the live stair section", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    const diagram = root.locator("[data-project-diagram]");

    await expect(diagram).toHaveAttribute("data-kind", "concreteStair");
    await expect(diagram.locator("[data-concrete-stair-model-name]")).toHaveText("Solid / mass concrete");
    await expect(root.locator(`#${slug}-field-waistThickness`)).toBeHidden();
    await expect(root.locator(`#${slug}-field-landingThickness`)).toBeHidden();
    await expect(diagram.locator("[data-concrete-stair-model=\"0\"]")).toBeVisible();
    await expect(diagram.locator("[data-concrete-stair-model=\"1\"]")).toBeHidden();

    await root.locator(`#${slug}-stairModel`).selectOption("1");

    await expect(root.locator(`#${slug}-field-waistThickness`)).toBeVisible();
    await expect(root.locator(`#${slug}-field-landingThickness`)).toBeVisible();
    await expect(diagram.locator("[data-concrete-stair-model-name]")).toHaveText("Waist-slab RCC");
    await expect(diagram.locator("[data-concrete-stair-model=\"0\"]")).toBeHidden();
    await expect(diagram.locator("[data-concrete-stair-model=\"1\"]")).toBeVisible();
  });

  test("solid top platform is full-height mass concrete", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await root.locator(`#${slug}-width`).fill("4");
    await root.locator(`#${slug}-width-unit`).selectOption("ft");
    await root.locator(`#${slug}-rise`).fill("7");
    await root.locator(`#${slug}-rise-unit`).selectOption("in");
    await root.locator(`#${slug}-run`).fill("11");
    await root.locator(`#${slug}-run-unit`).selectOption("in");
    await root.locator(`#${slug}-steps`).fill("4");
    await root.locator(`#${slug}-landingLength`).fill("2");
    await root.locator(`#${slug}-landingLength-unit`).selectOption("ft");
    await root.locator(`#${slug}-landingWidth`).fill("4");
    await root.locator(`#${slug}-landingWidth-unit`).selectOption("ft");

    await root.getByText("Advanced material assumptions", { exact: true }).click();
    await root.locator(`#${slug}-waste`).fill("0");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root.locator(".result-primary")).toHaveText("1.4835");
    await expect(root).toContainText("Top platform mass volume");
    await expect(root).toContainText("18.6667");
    await expect(root).toContainText("Full-height top platform");
    await expect(root.locator("[data-concrete-stair-landing=\"solid\"]")).toBeVisible();
  });

  test("waist mode uses step wedges once and validates waist thickness", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await root.locator(`#${slug}-stairModel`).selectOption("1");
    await root.locator(`#${slug}-waistThickness`).fill("6");
    await root.locator(`#${slug}-landingLength`).fill("2");
    await root.locator(`#${slug}-landingWidth`).fill("4");

    await root.getByText("Advanced material assumptions", { exact: true }).click();
    await root.locator(`#${slug}-waste`).fill("0");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("Step wedges: 0.5 × 4 ×");
    await expect(root).not.toContainText("0.5 × 3.6667 × 2.3333");
    await expect(root.locator("[data-concrete-stair-landing=\"waist\"]")).toBeVisible();

    await root.locator(`#${slug}-waistThickness`).fill("0");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();
    await expect(root.locator(`#${slug}-waistThickness-err`)).toContainText("greater than zero");
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });

  test("diagram labels track step count, dimensions and units", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await root.locator(`#${slug}-rise`).fill("7");
    await root.locator(`#${slug}-run`).fill("11");
    await root.locator(`#${slug}-steps`).fill("4");

    await expect(root.locator("[data-concrete-stair-step]")).toContainText("4 steps");
    await expect(root.locator("[data-concrete-stair-total]")).toContainText("28.00 in");
    await expect(root.locator("[data-concrete-stair-total]")).toContainText("44.00 in");

    await root.locator(`#${slug}-run-unit`).selectOption("cm");
    await root.locator(`#${slug}-run`).fill("28");

    await expect(root.locator("[data-concrete-stair-step]")).toContainText("28 cm");
    await expect(root.locator("[data-concrete-stair-total]")).toContainText("112.00 cm");
  });
});
