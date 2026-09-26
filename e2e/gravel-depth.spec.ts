import { expect, test } from "@playwright/test";

const slug = "gravel-depth-calculator";
const path = `/${slug}/`;

test.describe("Gravel Depth Calculator", () => {
  test("calculates depth from weight without invalid output", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    await root.locator(`#${slug}-areaMode`).selectOption("1");
    await root.locator(`#${slug}-area`).fill("200");
    await root.locator(`#${slug}-supplyMode`).selectOption("1");
    await root.locator(`#${slug}-tons`).fill("2.8");
    await root.locator(`#${slug}-density`).fill("1.4");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();
    await expect(root.locator(".result-primary")).toHaveText("3.24");
    await expect(root.locator(".result-primary-unit")).toHaveText("in");
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });
});
