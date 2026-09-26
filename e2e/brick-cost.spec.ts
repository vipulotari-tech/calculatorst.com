import { expect, test } from "@playwright/test";

const slug = "brick-cost-calculator";
const path = `/${slug}/`;

test.describe("Brick Cost Calculator", () => {
  test("prices opening-adjusted bricks, mortar and project extras without invalid outputs", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await root.locator(`#${slug}-length`).fill("10");
    await root.locator(`#${slug}-height`).fill("10");
    await root.locator(`#${slug}-openings`).fill("10");
    await root.locator(`#${slug}-brickLength`).fill("11");
    await root.locator(`#${slug}-brickHeight`).fill("11");
    await root.locator(`#${slug}-brickDepth`).fill("4");
    await root.locator(`#${slug}-joint`).fill("1");
    await root.locator(`#${slug}-wythes`).fill("1");

    await root.getByText("Advanced material assumptions", { exact: true }).click();
    await root.locator(`#${slug}-waste`).fill("10");
    await root.locator(`#${slug}-blocksPerMortarBag`).fill("10");

    await root.getByText("Cost & project extras", { exact: true }).click();
    await root.locator(`#${slug}-price`).fill("2");
    await root.locator(`#${slug}-mortarBagPrice`).fill("5");
    await root.locator(`#${slug}-tax`).fill("10");
    await root.locator(`#${slug}-delivery`).fill("20");
    await root.locator(`#${slug}-labor`).fill("30");

    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root.locator(".result-primary")).toHaveText("317.3");
    await expect(root.locator(".result-primary-unit")).toHaveText("USD");

    const results = root.locator(".result-rows-grid");
    await expect(results).toContainText("99 bricks");
    await expect(results).toContainText("90 bricks");
    await expect(results).toContainText("9 bricks");
    await expect(results).toContainText("9 bags");
    await expect(results).toContainText("90 ft²");
    await expect(results).toContainText("3.526 USD/ft²");

    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });
});
