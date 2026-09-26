import { expect, test } from "@playwright/test";

const slug = "fill-dirt-cost-calculator";
const path = `/${slug}/`;

test.describe("Fill Dirt Cost Calculator", () => {
  test("separates compaction from waste and includes entered project costs", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    await root.getByText("Advanced material assumptions", { exact: true }).click();
    await root.locator(`#${slug}-compaction`).fill("15");
    await root.locator(`#${slug}-waste`).fill("10");
    await root.locator(`#${slug}-price`).fill("18");
    await root.getByText("Cost & project extras", { exact: true }).click();
    await root.locator(`#${slug}-tax`).fill("5");
    await root.locator(`#${slug}-delivery`).fill("90");
    await root.locator(`#${slug}-labor`).fill("50");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();
    await expect(root.locator(".result-primary-unit")).toHaveText("USD");
    await expect(root.locator(".result-rows-grid")).toContainText("Loose fill dirt to order");
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });

  test("reset restores defaults", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    await root.getByText("Advanced material assumptions", { exact: true }).click();
    await root.locator(`#${slug}-compaction`).fill("25");
    await root.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(root.locator(`#${slug}-compaction`)).toHaveValue("15");
  });
});
