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
    await expect(diagram.locator("[data-waste-source]")).toHaveText("Net volume entered directly");
    await expect(diagram.locator("[data-waste-rounding-label]")).toContainText("+0.050 yd³");
    await expect(diagram.locator("[data-waste-effective-label]")).toContainText("+10.00%");
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
