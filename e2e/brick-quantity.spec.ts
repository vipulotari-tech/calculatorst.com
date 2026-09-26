import { expect, test } from "@playwright/test";

const slug = "brick-quantity-calculator";
const path = `/${slug}/`;

test.describe("Brick Quantity Calculator", () => {
  test("calculates a known net wall area and restores dimensions mode on reset", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    await root.locator(`#${slug}-mode`).selectOption("1");
    await root.locator(`#${slug}-knownArea`).fill("100");
    await root.locator(`#${slug}-brickLength`).fill("11");
    await root.locator(`#${slug}-brickHeight`).fill("11");
    await root.locator(`#${slug}-joint`).fill("1");
    await root.locator(`#${slug}-wythes`).fill("2");
    await root.getByText("Advanced material assumptions", { exact: true }).click();
    await root.locator(`#${slug}-waste`).fill("10");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root.locator(".result-primary")).toHaveText("220");
    await expect(root.locator(".result-primary-unit")).toHaveText("bricks");
    await expect(root.locator(".result-rows-grid")).toContainText("200 bricks");
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);

    await root.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(root.locator(`#${slug}-mode`)).toHaveValue("0");
    await expect(root.locator(`#${slug}-length`)).toBeVisible();
  });

  test("shared URL restores known-area mode", async ({ page }) => {
    const query = new URLSearchParams({
      cs_calc: slug, cs_mode: "1", cs_knownArea: "100", cs_knownArea_unit: "ft2",
      cs_brickLength: "11", cs_brickLength_unit: "in", cs_brickHeight: "11",
      cs_brickHeight_unit: "in", cs_joint: "1", cs_joint_unit: "in",
      cs_wythes: "2", cs_waste: "10"
    });
    await page.goto(`${path}?${query.toString()}`);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    await expect(root.locator(`#${slug}-mode`)).toHaveValue("1");
    await expect(root.locator(`#${slug}-knownArea`)).toHaveValue("100");
    await expect(root.locator(".result-primary")).toHaveText("220");
  });
});
