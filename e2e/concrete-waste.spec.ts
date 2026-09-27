import { expect, test } from "@playwright/test";

const slug = "concrete-waste-calculator";
const path = `/${slug}/`;

test.describe("Concrete Waste Calculator", () => {
  test("dimension mode keeps allowance and supplier rounding separate", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    const diagram = root.locator("[data-project-diagram]");

    await expect(diagram).toHaveAttribute("data-kind", "concreteWaste");
    await expect(root.locator(`#${slug}-field-length`)).toBeVisible();
    await expect(root.locator(`#${slug}-field-volume`)).toBeHidden();

    await root.locator(`#${slug}-length`).fill("10");
    await root.locator(`#${slug}-width`).fill("10");
    await root.locator(`#${slug}-depth`).fill("12");
    await root.locator(`#${slug}-depth-unit`).selectOption("in");
    await root.locator(`#${slug}-quantity`).fill("1");
    await root.locator(`#${slug}-wastePercent`).fill("10");
    await root.locator(`#${slug}-orderIncrement`).fill("0.25");

    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("Waste-adjusted target order");
    await expect(root).toContainText("4.0741 yd³");
    await expect(root).toContainText("4.25 yd³");
    await expect(root).toContainText("Extra caused by supplier rounding");
    await expect(root).toContainText("Total order above net volume");
    await expect(diagram.locator("[data-waste-order-label]")).toContainText("4.250 yd³");
    await expect(diagram.locator("[data-waste-allowance-label]")).toContainText("10.00%");
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });

  test("known-volume mode supports 50-lb bags and effective overage", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    const diagram = root.locator("[data-project-diagram]");

    await root.locator(`#${slug}-wasteMode`).selectOption("1");
    await expect(root.locator(`#${slug}-field-length`)).toBeHidden();
    await expect(root.locator(`#${slug}-field-width`)).toBeHidden();
    await expect(root.locator(`#${slug}-field-depth`)).toBeHidden();
    await expect(root.locator(`#${slug}-field-quantity`)).toBeHidden();
    await expect(root.locator(`#${slug}-field-volume`)).toBeVisible();

    await root.locator(`#${slug}-volume`).fill("2.5");
    await root.locator(`#${slug}-volume-unit`).selectOption("yd3");
    await root.locator(`#${slug}-wastePercent`).fill("8");
    await root.locator(`#${slug}-orderIncrement`).fill("0.25");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("2.7 yd³");
    await expect(root).toContainText("2.75 yd³");
    await expect(root).toContainText("50-lb bags");
    await expect(root).toContainText("195 bags");
    await expect(root).toContainText("Effective overage after rounding");
    await expect(root).toContainText("10 %");
    await expect(diagram.locator("[data-waste-source]")).toHaveText("Known net concrete volume");
    await expect(diagram.locator("[data-waste-rounding-label]")).toContainText("+0.050 yd³");
    await expect(diagram.locator("[data-waste-effective-label]")).toContainText("+10.00%");
  });

  test("round pier and wall modes switch geometry and calculate independently", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    const diagram = root.locator("[data-project-diagram]");

    await root.locator(`#${slug}-wasteMode`).selectOption("2");
    await expect(root.locator(`#${slug}-field-diameter`)).toBeVisible();
    await expect(root.locator(`#${slug}-field-pierDepth`)).toBeVisible();
    await expect(root.locator(`#${slug}-field-pierQuantity`)).toBeVisible();
    await expect(root.locator(`#${slug}-field-length`)).toBeHidden();
    await expect(diagram.locator('[data-waste-geometry="2"]')).toBeVisible();
    await expect(diagram.locator("[data-waste-source]")).toHaveText("Round footing / pier");

    await root.locator(`#${slug}-diameter`).fill("18");
    await root.locator(`#${slug}-diameter-unit`).selectOption("in");
    await root.locator(`#${slug}-pierDepth`).fill("4");
    await root.locator(`#${slug}-pierDepth-unit`).selectOption("ft");
    await root.locator(`#${slug}-pierQuantity`).fill("4");
    await root.locator(`#${slug}-wastePercent`).fill("10");
    await root.locator(`#${slug}-orderIncrement`).fill("0.25");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("Round cross-section area");
    await expect(root).toContainText("Concrete per pier / round footing");
    await expect(root).toContainText("1.25 yd³");

    await root.locator(`#${slug}-wasteMode`).selectOption("3");
    await expect(root.locator(`#${slug}-field-sectionLength`)).toBeVisible();
    await expect(root.locator(`#${slug}-field-sectionHeight`)).toBeVisible();
    await expect(root.locator(`#${slug}-field-sectionThickness`)).toBeVisible();
    await expect(diagram.locator('[data-waste-geometry="3"]')).toBeVisible();
    await expect(diagram.locator("[data-waste-source]")).toHaveText("Wall / rectangular footing");

    await root.locator(`#${slug}-sectionLength`).fill("40");
    await root.locator(`#${slug}-sectionLength-unit`).selectOption("ft");
    await root.locator(`#${slug}-sectionHeight`).fill("2");
    await root.locator(`#${slug}-sectionHeight-unit`).selectOption("ft");
    await root.locator(`#${slug}-sectionThickness`).fill("8");
    await root.locator(`#${slug}-sectionThickness-unit`).selectOption("in");
    await root.locator(`#${slug}-sectionQuantity`).fill("1");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("Wall / footing cross-section area");
    await expect(root).toContainText("2.25 yd³");
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });

  test("truck planning uses rounded order and exposes final-load utilization", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    const diagram = root.locator("[data-project-diagram]");

    await root.locator(`#${slug}-wasteMode`).selectOption("1");
    await root.locator(`#${slug}-volume`).fill("18");
    await root.locator(`#${slug}-volume-unit`).selectOption("yd3");
    await root.locator(`#${slug}-wastePercent`).fill("10");
    await root.locator(`#${slug}-orderIncrement`).fill("0.25");
    await root.locator(`#${slug}-truckCapacity`).fill("9");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("20 yd³");
    await expect(root).toContainText("3 loads");
    await expect(root).toContainText("Final truck load");
    await expect(root).toContainText("2 yd³");
    await expect(root).toContainText("Final truck utilization");
    await expect(diagram.locator("[data-waste-truck-plan]")).toContainText("3 truck loads");
  });

  test("result can invoke the print / save-PDF estimate workflow", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await root.getByRole("button", { name: "Calculate", exact: true }).click();
    await page.evaluate(() => {
      window.print = () => document.body.setAttribute("data-print-invoked", "yes");
    });

    const printButton = root.getByRole("button", { name: "Print or save calculation as PDF" });
    await expect(printButton).toBeVisible();
    await expect(printButton).toContainText("Print / Save PDF");
    await printButton.click();
    await expect(page.locator("body")).toHaveAttribute("data-print-invoked", "yes");
  });

  test("zero supplier increment skips rounding without invalid output", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await root.locator(`#${slug}-wasteMode`).selectOption("1");
    await root.locator(`#${slug}-volume`).fill("2");
    await root.locator(`#${slug}-volume-unit`).selectOption("yd3");
    await root.locator(`#${slug}-wastePercent`).fill("5");
    await root.locator(`#${slug}-orderIncrement`).fill("0");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("2.1 yd³");
    await expect(root).toContainText("Extra caused by supplier rounding");
    await expect(root).toContainText("0 yd³");
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });
});
