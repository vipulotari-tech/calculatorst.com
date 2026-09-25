import { expect, test } from "@playwright/test";

const slug = "concrete-footing-calculator";
const path = `/${slug}/`;

test.describe("Concrete Footing Calculator", () => {
  test("mode switching shows only active geometry and updates the live diagram", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    const shape = root.locator(`#${slug}-footingShape`);
    const diagram = root.locator("[data-project-diagram]");

    await expect(root.locator(`#${slug}-field-length`)).toBeVisible();
    await expect(root.locator(`#${slug}-field-width`)).toBeVisible();
    await expect(root.locator(`#${slug}-field-sideWidth`)).toBeHidden();
    await expect(diagram.locator("[data-concrete-footing-shape-name]")).toHaveText("Strip / continuous footing");

    await shape.selectOption("1");
    await expect(root.locator(`#${slug}-field-length`)).toBeHidden();
    await expect(root.locator(`#${slug}-field-sideWidth`)).toBeVisible();
    await expect(root.locator(`#${slug}-field-padLength`)).toBeHidden();
    await expect(diagram.locator("[data-concrete-footing-shape-name]")).toHaveText("Square isolated pad");

    await shape.selectOption("2");
    await expect(root.locator(`#${slug}-field-sideWidth`)).toBeHidden();
    await expect(root.locator(`#${slug}-field-padLength`)).toBeVisible();
    await expect(root.locator(`#${slug}-field-padWidth`)).toBeVisible();
    await expect(diagram.locator("[data-concrete-footing-shape-name]")).toHaveText("Rectangular isolated pad");

    await shape.selectOption("3");
    await expect(root.locator(`#${slug}-field-padLength`)).toBeHidden();
    await expect(root.locator(`#${slug}-field-diameter`)).toBeVisible();
    await expect(diagram.locator("[data-concrete-footing-shape-name]")).toHaveText("Round / circular footing");

    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });

  test("round-footing golden result and active-field validation", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await root.locator(`#${slug}-footingShape`).selectOption("3");
    await root.locator(`#${slug}-diameter`).fill("24");
    await root.locator(`#${slug}-diameter-unit`).selectOption("in");
    await root.locator(`#${slug}-depth`).fill("12");
    await root.locator(`#${slug}-depth-unit`).selectOption("in");
    await root.locator(`#${slug}-quantity`).fill("3");
    await root.getByText("Advanced material assumptions", { exact: true }).click();
    await root.locator(`#${slug}-waste`).fill("0");

    await expect(root.locator(".result-primary")).toHaveText("0.3491");
    await expect(root.locator(".result-primary-unit")).toHaveText("yd³");
    await expect(root.locator(".result-secondary")).toHaveText("Concrete to order");

    await root.locator(`#${slug}-diameter`).fill("0");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();
    await expect(root.locator(`#${slug}-diameter-err`)).toContainText("greater than zero");
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });

  test("shared URL restores mode, units and result; reset preserves backward-compatible defaults", async ({ page }) => {
    const query = new URLSearchParams({
      cs_calc: slug,
      cs_footingShape: "3",
      cs_diameter: "24",
      cs_diameter_unit: "in",
      cs_depth: "12",
      cs_depth_unit: "in",
      cs_quantity: "3",
      cs_waste: "0",
      cs_length: "0",
      cs_width: "0",
    });

    await page.goto(`${path}?${query.toString()}`);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await expect(root.locator(`#${slug}-footingShape`)).toHaveValue("3");
    await expect(root.locator(`#${slug}-field-length`)).toBeHidden();
    await expect(root.locator(`#${slug}-field-diameter`)).toBeVisible();
    await expect(root.locator(".result-primary")).toHaveText("0.3491");
    await expect(root.locator("[data-concrete-footing-shape-name]")).toHaveText("Round / circular footing");

    await root.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(root.locator(`#${slug}-footingShape`)).toHaveValue("0");
    await expect(root.locator(`#${slug}-length`)).toHaveValue("20");
    await expect(root.locator(`#${slug}-width`)).toHaveValue("12");
    await expect(root.locator(`#${slug}-depth`)).toHaveValue("12");
    await expect(root.locator("[data-concrete-footing-shape-name]")).toHaveText("Strip / continuous footing");
    await expect(page).not.toHaveURL(/cs_calc=/);
  });
});
