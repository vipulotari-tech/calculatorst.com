import { expect, test } from "@playwright/test";

const slug = "brick-joint-calculator";
const path = `/${slug}/`;

test.describe("Brick Joint Calculator", () => {
  test("solves equal joint width with N-1 internal joints", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    const diagram = root.locator("[data-project-diagram]");

    await expect(diagram).toHaveAttribute("data-kind", "brickJoint");
    await root.locator(`#${slug}-length`).fill("25");
    await root.locator(`#${slug}-length-unit`).selectOption("in");
    await root.locator(`#${slug}-brickLength`).fill("8");
    await root.locator(`#${slug}-brickLength-unit`).selectOption("in");
    await root.locator(`#${slug}-quantity`).fill("3");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root.locator(".result-primary")).toHaveText("0.5");
    await expect(root.locator(".result-primary-unit")).toHaveText("in");
    await expect(root).toContainText("2 joints");
    await expect(root).toContainText("8.5 in");
    await expect(diagram.locator("[data-brick-joint-mode]")).toHaveText("Solve equal joint width");
    await expect(diagram.locator("[data-brick-count-label]")).toContainText("3 bricks · 2 internal joints");
    await expect(diagram.locator("[data-brick-joint-label]")).toContainText("0.5000 in");
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });

  test("target-joint mode finds whole bricks and leftover course length", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await root.locator(`#${slug}-layoutMode`).selectOption("1");
    await expect(root.locator(`#${slug}-field-quantity`)).toBeHidden();
    await expect(root.locator(`#${slug}-field-targetJoint`)).toBeVisible();

    await root.locator(`#${slug}-length`).fill("120");
    await root.locator(`#${slug}-length-unit`).selectOption("in");
    await root.locator(`#${slug}-brickLength`).fill("7.625");
    await root.locator(`#${slug}-brickLength-unit`).selectOption("in");
    await root.locator(`#${slug}-targetJoint`).fill("0.375");
    await root.locator(`#${slug}-targetJoint-unit`).selectOption("in");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root.locator(".result-primary")).toHaveText("15");
    await expect(root.locator(".result-primary-unit")).toHaveText("bricks");
    await expect(root).toContainText("0.375 in");
    await expect(root.locator("[data-brick-joint-mode]")).toHaveText("Find whole bricks at target joint");
    await expect(root.locator("[data-brick-joint-summary]")).toContainText("15 whole bricks");
  });

  test("required-course mode calculates length and hides finished length input", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await root.locator(`#${slug}-layoutMode`).selectOption("2");
    await expect(root.locator(`#${slug}-field-length`)).toBeHidden();
    await expect(root.locator(`#${slug}-field-quantity`)).toBeVisible();
    await expect(root.locator(`#${slug}-field-targetJoint`)).toBeVisible();

    await root.locator(`#${slug}-brickLength`).fill("7.625");
    await root.locator(`#${slug}-quantity`).fill("15");
    await root.locator(`#${slug}-targetJoint`).fill("0.375");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("119.625 in");
    await expect(root).toContainText("14 joints");
    await expect(root.locator("[data-brick-joint-mode]")).toHaveText("Find required course length");
    await expect(root.locator("[data-brick-course-length]")).toContainText("119.625 in");
  });

  test("impossible course fit returns a field error instead of negative joint width", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await root.locator(`#${slug}-length`).fill("20");
    await root.locator(`#${slug}-length-unit`).selectOption("in");
    await root.locator(`#${slug}-brickLength`).fill("8");
    await root.locator(`#${slug}-quantity`).fill("3");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root.locator(`#${slug}-quantity-err`)).toContainText("longer than the finished course");
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });
});
