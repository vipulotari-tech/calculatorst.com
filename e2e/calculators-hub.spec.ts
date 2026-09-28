import { expect, test } from "@playwright/test";

test.describe("All calculators hub", () => {
  test("keeps the no-results message out of the initial rendered content and shows it only after an empty search", async ({ page }) => {
    await page.goto("/calculators/");

    await expect(page.getByRole("heading", { level: 1, name: "Construction Calculators" })).toBeVisible();

    const emptyState = page.locator("#search-empty");
    await expect(emptyState).toBeHidden();
    await expect(emptyState).toHaveText("");

    const categoryNav = page.locator("[data-category-nav]");
    await expect(categoryNav.getByRole("link", { name: /Concrete Calculators/i })).toBeVisible();
    await expect(categoryNav.locator('a[href="/construction/asphalt/"]')).toBeVisible();

    const search = page.locator("#calc-search");
    await search.fill("zzzz-no-calculator-match");
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText("No calculators match");

    await search.fill("concrete");
    await expect(emptyState).toBeHidden();
    await expect(page.locator("#calculator-list li:not([hidden])").first()).toBeVisible();
  });
});
