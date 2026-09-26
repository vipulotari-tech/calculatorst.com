import { expect, test } from "@playwright/test";

const slug = "brick-wall-calculator";
const path = `/${slug}/`;

test.describe("Brick Wall Calculator", () => {
  test("calculates opening-adjusted bricks, mortar bags and shipment tons", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await root.locator(`#${slug}-length`).fill("10");
    await root.locator(`#${slug}-height`).fill("10");
    await root.locator(`#${slug}-openings`).fill("10");
    await root.locator(`#${slug}-brickLength`).fill("11");
    await root.locator(`#${slug}-brickHeight`).fill("11");
    await root.locator(`#${slug}-joint`).fill("1");
    await root.locator(`#${slug}-unitWeight`).fill("5");
    await root.getByText("Advanced material assumptions", { exact: true }).click();
    await root.locator(`#${slug}-waste`).fill("0");
    await root.locator(`#${slug}-mortarCoverage`).fill("10");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root.locator(".result-primary")).toHaveText("90");
    await expect(root.locator(".result-primary-unit")).toHaveText("bricks");
    const results = root.locator(".result-rows-grid");
    await expect(results).toContainText("Planning mortar bags");
    await expect(results).toContainText("9 bags");
    await expect(results).toContainText("0.225 US tons");
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });

  test("shared URL restores mortar coverage and reset returns defaults", async ({ page }) => {
    const query = new URLSearchParams({
      cs_calc: slug,
      cs_length: "10",
      cs_length_unit: "ft",
      cs_height: "10",
      cs_height_unit: "ft",
      cs_openings: "10",
      cs_openings_unit: "ft2",
      cs_brickLength: "11",
      cs_brickLength_unit: "in",
      cs_brickHeight: "11",
      cs_brickHeight_unit: "in",
      cs_brickDepth: "4",
      cs_brickDepth_unit: "in",
      cs_joint: "1",
      cs_joint_unit: "in",
      cs_wythes: "1",
      cs_waste: "0",
      cs_mortarCoverage: "10",
      cs_unitWeight: "5",
    });
    await page.goto(`${path}?${query.toString()}`);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await root.getByText("Advanced material assumptions", { exact: true }).click();
    await expect(root.locator(`#${slug}-mortarCoverage`)).toHaveValue("10");
    await expect(root.locator(".result-primary")).toHaveText("90");
    await expect(root.locator(".result-rows-grid")).toContainText("9 bags");

    await root.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(root.locator(`#${slug}-mortarCoverage`)).toHaveValue("37");
    await expect(page).not.toHaveURL(/cs_calc=/);
  });
});
