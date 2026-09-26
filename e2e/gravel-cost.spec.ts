import { expect, test } from "@playwright/test";

const slug = "gravel-cost-calculator";
const path = `/${slug}/`;

test.describe("Gravel Cost Calculator", () => {
  test("uses density presets, compaction and metric quote pricing with cost-first results", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await root.locator(`#${slug}-mode`).selectOption("2");
    await root.locator(`#${slug}-volume`).fill("1");
    await root.locator(`#${slug}-volume-unit`).selectOption("m3");
    await root.getByText("Advanced material assumptions", { exact: true }).click();
    await root.locator(`#${slug}-material`).selectOption("1");
    await expect(root.locator(`#${slug}-field-density`)).toBeHidden();
    await root.locator(`#${slug}-compaction`).fill("10");
    await root.locator(`#${slug}-waste`).fill("0");
    await root.locator(`#${slug}-price`).fill("100");
    await root.locator(`#${slug}-price-unit`).selectOption("USD/m3");
    await root.getByText("Cost & project extras", { exact: true }).click();
    await root.locator(`#${slug}-tax`).fill("10");
    await root.locator(`#${slug}-delivery`).fill("20");
    await root.locator(`#${slug}-labor`).fill("30");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root.locator(".result-primary")).toHaveText("171");
    await expect(root.locator(".result-primary-unit")).toHaveText("USD");
    const results = root.locator(".result-rows-grid");
    await expect(results).toContainText("Gravel to order");
    await expect(results).toContainText("1.1 m³");
    await expect(results).toContainText("110 USD");
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });

  test("old shared density URLs still restore custom density and reset cleanly", async ({ page }) => {
    const query = new URLSearchParams({
      cs_calc: slug,
      cs_mode: "2",
      cs_volume: "27",
      cs_volume_unit: "ft3",
      cs_density: "1.6",
      cs_density_unit: "ton/yd3",
      cs_waste: "0",
      cs_price: "10",
      cs_price_unit: "USD/yd3",
      cs_tax: "0",
      cs_delivery: "0",
      cs_labor: "0",
    });
    await page.goto(`${path}?${query.toString()}`);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await root.getByText("Advanced material assumptions", { exact: true }).click();
    await expect(root.locator(`#${slug}-material`)).toHaveValue("5");
    await expect(root.locator(`#${slug}-density`)).toHaveValue("1.6");
    await expect(root.locator(".result-primary")).toHaveText("10");
    await expect(root.locator(".result-primary-unit")).toHaveText("USD");

    await root.getByRole("button", { name: "Reset", exact: true }).click();
    await expect(root.locator(`#${slug}-material`)).toHaveValue("5");
    await expect(root.locator(`#${slug}-compaction`)).toHaveValue("0");
    await expect(page).not.toHaveURL(/cs_calc=/);
  });
});


test("Crushed Stone calculator browser regression", async ({ page }) => {
  await page.goto("/crushed-stone-calculator/");
  const root = page.locator('[data-calculator-slug="crushed-stone-calculator"]');
  await root.locator("#crushed-stone-calculator-mode").selectOption("0");
  await root.locator("#crushed-stone-calculator-length").fill("10");
  await root.locator("#crushed-stone-calculator-width").fill("10");
  await root.locator("#crushed-stone-calculator-depth").fill("12");
  await root.getByText("Advanced material assumptions", { exact: true }).click();
  await root.locator("#crushed-stone-calculator-material").selectOption("1");
  await root.locator("#crushed-stone-calculator-compaction").fill("20");
  await root.locator("#crushed-stone-calculator-waste").fill("10");
  await root.getByRole("button", { name: "Calculate", exact: true }).click();
  await expect(root.locator(".result-rows-grid")).toContainText("Volume after compaction allowance");
  expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  await root.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(root.locator("#crushed-stone-calculator-compaction")).toHaveValue("0");
});
