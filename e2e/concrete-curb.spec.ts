import { expect, test } from "@playwright/test";

const slug = "concrete-curb-calculator";
const path = `/${slug}/`;

test.describe("Concrete Curb Calculator", () => {
  test("live diagram follows curb profile and gutter style", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    const diagram = root.locator("[data-project-diagram]");

    await expect(diagram).toHaveAttribute("data-kind", "concreteCurb");
    await expect(diagram.locator("[data-concrete-curb-title]")).toHaveText("Curb + gutter · rectangular curb");
    await expect(diagram.locator("[data-concrete-curb-profile=\"0\"]")).toBeVisible();
    await expect(diagram.locator("[data-concrete-curb-profile=\"1\"]")).toBeHidden();
    await expect(root.locator(`#${slug}-field-curbBaseWidth`)).toBeHidden();

    await root.locator(`#${slug}-curbProfile`).selectOption("1");

    await expect(root.locator(`#${slug}-field-curbBaseWidth`)).toBeVisible();
    await expect(diagram.locator("[data-concrete-curb-profile=\"0\"]")).toBeHidden();
    await expect(diagram.locator("[data-concrete-curb-profile=\"1\"]")).toBeVisible();
    await expect(diagram.locator("[data-concrete-curb-title]")).toContainText("tapered curb");

    await root.locator(`#${slug}-curbStyle`).selectOption("1");

    await expect(root.locator(`#${slug}-field-gutterWidth`)).toBeHidden();
    await expect(root.locator(`#${slug}-field-gutterThickness`)).toBeHidden();
    await expect(diagram.locator("[data-concrete-curb-gutter]")).toBeHidden();
    await expect(diagram.locator("[data-concrete-curb-title]")).toContainText("Curb only");
  });

  test("forward and reverse modes show only relevant quantity input", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    const diagram = root.locator("[data-project-diagram]");

    await expect(root.locator(`#${slug}-field-length`)).toBeVisible();
    await expect(root.locator(`#${slug}-field-volume`)).toBeHidden();
    await expect(diagram.locator("[data-concrete-curb-mode]")).toContainText("Forward");

    await root.locator(`#${slug}-curbMode`).selectOption("1");

    await expect(root.locator(`#${slug}-field-length`)).toBeHidden();
    await expect(root.locator(`#${slug}-field-volume`)).toBeVisible();
    await expect(diagram.locator("[data-concrete-curb-mode]")).toContainText("Reverse");
  });

  test("20 ft rectangular curb and gutter gives 25 ft3 geometric volume", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await root.locator(`#${slug}-length`).fill("20");
    await root.locator(`#${slug}-curbWidth`).fill("6");
    await root.locator(`#${slug}-curbHeight`).fill("12");
    await root.locator(`#${slug}-gutterWidth`).fill("18");
    await root.locator(`#${slug}-gutterThickness`).fill("6");

    await root.getByText("Advanced material assumptions", { exact: true }).click();
    await root.locator(`#${slug}-waste`).fill("0");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("25 ft³");
    await expect(root).toContainText("1.25 ft²");
    await expect(root).toContainText("Concrete per 100 linear ft");
    await expect(root).toContainText("Linear ft per 1 yd³");
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });

  test("tapered profile updates cross-section and reverse mode validates volume", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await root.locator(`#${slug}-curbProfile`).selectOption("1");
    await root.locator(`#${slug}-curbBaseWidth`).fill("8");
    await expect(root.locator("[data-concrete-curb-base]")).toContainText("8 in");

    await root.locator(`#${slug}-curbMode`).selectOption("1");
    await root.locator(`#${slug}-volume`).fill("0");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root.locator(`#${slug}-volume-err`)).toContainText("greater than zero");

    await root.locator(`#${slug}-volume`).fill("1");
    await root.locator(`#${slug}-volume-unit`).selectOption("yd3");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("Linear feet of curb");
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });
});
