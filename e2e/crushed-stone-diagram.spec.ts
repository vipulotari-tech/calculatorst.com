import { expect, test } from "@playwright/test";

test.describe("Crushed stone live measurement diagram", () => {
  test("shows the active rectangular geometry and the same computed order math", async ({ page }) => {
    await page.goto("/crushed-stone-calculator/");
    const diagram = page.locator("[data-crushed-stone-diagram]");
    await expect(diagram).toBeVisible();
    await expect(diagram.locator('[data-stone-mode="0"]')).toBeVisible();
    await expect(diagram.locator('[data-stone-mode="1"]')).toBeHidden();
    await expect(diagram.locator("[data-stone-length]")).toContainText("20 ft");
    await expect(diagram.locator("[data-stone-width]")).toContainText("10 ft");
    await expect(diagram.locator("[data-stone-depth]")).toContainText("4 in");
    await expect(diagram.locator("[data-stone-net]")).toContainText("2.469 yd³");
    await expect(diagram.locator("[data-stone-order]")).toContainText("2.716 yd³");
    await expect(diagram.locator("[data-stone-weight]")).toContainText("4.074 US tons");
  });

  test("changes the geometry for known area and known volume, not a rectangular sketch", async ({ page }) => {
    await page.goto("/crushed-stone-calculator/");
    const diagram = page.locator("[data-crushed-stone-diagram]");
    const mode = page.locator("#crushed-stone-calculator-mode");

    await mode.selectOption("1");
    await expect(diagram.locator('[data-stone-mode="0"]')).toBeHidden();
    await expect(diagram.locator('[data-stone-mode="1"]')).toBeVisible();
    await expect(diagram.locator("[data-stone-geometry]")).toContainText("200 ft² × 4 in");
    await expect(diagram.locator("[data-stone-net]")).toContainText("2.469 yd³");

    await mode.selectOption("2");
    await expect(diagram.locator('[data-stone-mode="1"]')).toBeHidden();
    await expect(diagram.locator('[data-stone-mode="2"]')).toBeVisible();
    await expect(diagram.locator("[data-stone-geometry]")).toContainText("2 yd³");
    await expect(diagram.locator("[data-stone-net]")).toContainText("2 yd³");
    await expect(diagram.locator("[data-stone-order]")).toContainText("2.2 yd³");
    await expect(diagram.locator("[data-stone-weight]")).toContainText("3.3 US tons");
  });

  test("reflects unit changes, shareable state, and mobile containment", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/crushed-stone-calculator/?cs_calc=crushed-stone-calculator&cs_mode=2&cs_volume=3&cs_volume_unit=yd3&cs_density=1.5&cs_waste=10");
    const diagram = page.locator("[data-crushed-stone-diagram]");
    await expect(diagram.locator('[data-stone-mode="2"]')).toBeVisible();
    await expect(diagram.locator("[data-stone-geometry]")).toContainText("3 yd³");
    await expect(diagram.locator("[data-stone-order]")).toContainText("3.3 yd³");
    await expect(diagram.locator("[data-stone-weight]")).toContainText("4.95 US tons");
    const noPageOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
    expect(noPageOverflow).toBeTruthy();

    await page.locator("#crushed-stone-calculator-volume-unit").selectOption("m3");
    await page.locator("#crushed-stone-calculator-volume").fill("1");
    await expect(diagram.locator("[data-stone-geometry]")).toContainText("1 m³");
    await expect(diagram.locator("[data-stone-net]")).toContainText("1.308 yd³");
  });
});
