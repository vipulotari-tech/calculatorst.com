import { expect, test } from "@playwright/test";

const slug = "concrete-waste-calculator";
const path = `/${slug}/`;

test.describe("Concrete Waste Calculator", () => {
  test("dimension mode keeps allowance, supplier rounding and minimum uplift separate", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    const diagram = root.locator("[data-project-diagram]");

    await expect(diagram).toHaveAttribute("data-kind", "concreteWaste");
    await expect(root.locator(`#${slug}-field-length`)).toBeVisible();
    await expect(root.locator(`#${slug}-field-volume`)).toBeHidden();

    await root.locator(`#${slug}-length`).fill("10");
    await root.locator(`#${slug}-width`).fill("10");
    await root.locator(`#${slug}-depth`).fill("12");
    await root.locator(`#${slug}-depth-unit`).selectOption("in");
    await root.locator(`#${slug}-quantity`).fill("1");
    await root.locator(`#${slug}-wastePercent`).fill("10");

    const supplier = root.locator("details").filter({ hasText: "Supplier & order settings" });
    await supplier.locator("summary").click();
    await root.locator(`#${slug}-orderIncrement`).fill("0.25");
    await root.locator(`#${slug}-supplierMinimum`).fill("5");

    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("Waste-adjusted requirement");
    await expect(root).toContainText("4.0741 yd³");
    await expect(root).toContainText("Supplier-rounded requirement");
    await expect(root).toContainText("4.25 yd³");
    await expect(root).toContainText("Extra caused by supplier minimum");
    await expect(root).toContainText("5 yd³");
    await expect(root).toContainText("Total supplier volume above net");
    await expect(diagram.locator("[data-waste-order-label]")).toContainText("5.000 yd³");
    await expect(diagram.locator("[data-waste-allowance-label]")).toContainText("10.00%");
    await expect(diagram.locator("[data-waste-rounding-label]")).toContainText("minimum");
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });

  test("known-volume mode supports common bags, custom yield and effective overage", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    const diagram = root.locator("[data-project-diagram]");

    await root.locator(`#${slug}-wasteMode`).selectOption("1");
    await expect(root.locator(`#${slug}-field-length`)).toBeHidden();
    await expect(root.locator(`#${slug}-field-volume`)).toBeVisible();

    await root.locator(`#${slug}-volume`).fill("2.5");
    await root.locator(`#${slug}-volume-unit`).selectOption("yd3");
    await root.locator(`#${slug}-wastePercent`).fill("8");

    const supplier = root.locator("details").filter({ hasText: "Supplier & order settings" });
    await supplier.locator("summary").click();
    await root.locator(`#${slug}-orderIncrement`).fill("0.25");
    await root.locator(`#${slug}-customBagYield`).fill("0.5");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("2.7 yd³");
    await expect(root).toContainText("2.75 yd³");
    await expect(root).toContainText("50-lb bags");
    await expect(root).toContainText("195 bags");
    await expect(root).toContainText("Bags at entered yield");
    await expect(root).toContainText("146 bags");
    await expect(root).toContainText("Effective overage after supplier rules");
    await expect(root).toContainText("10 %");
    await expect(diagram.locator("[data-waste-source]")).toHaveText("Known net concrete volume");
  });

  test("round pier and wall modes calculate independently", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    const diagram = root.locator("[data-project-diagram]");

    await root.locator(`#${slug}-wasteMode`).selectOption("2");
    await expect(root.locator(`#${slug}-field-diameter`)).toBeVisible();
    await expect(diagram.locator('[data-waste-geometry="2"]')).toBeVisible();

    await root.locator(`#${slug}-diameter`).fill("18");
    await root.locator(`#${slug}-diameter-unit`).selectOption("in");
    await root.locator(`#${slug}-pierDepth`).fill("4");
    await root.locator(`#${slug}-pierDepth-unit`).selectOption("ft");
    await root.locator(`#${slug}-pierQuantity`).fill("4");
    await root.locator(`#${slug}-wastePercent`).fill("10");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("Round cross-section area");
    await expect(root).toContainText("Concrete per pier / round footing");

    await root.locator(`#${slug}-wasteMode`).selectOption("3");
    await expect(root.locator(`#${slug}-field-sectionLength`)).toBeVisible();
    await expect(diagram.locator('[data-waste-geometry="3"]')).toBeVisible();

    await root.locator(`#${slug}-sectionLength`).fill("40");
    await root.locator(`#${slug}-sectionHeight`).fill("2");
    await root.locator(`#${slug}-sectionThickness`).fill("8");
    await root.locator(`#${slug}-sectionThickness-unit`).selectOption("in");
    await root.locator(`#${slug}-sectionQuantity`).fill("1");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("Wall / footing cross-section area");
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });

  test("dynamic multi-pour schedule combines mixed geometry and restores from shared URL", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    const diagram = root.locator("[data-project-diagram]");

    await root.locator(`#${slug}-wasteMode`).selectOption("4");
    const panel = root.locator(".concrete-waste-multipour");
    await expect(panel).toBeVisible();

    const first = panel.locator("[data-mp-row]").first();
    await first.locator("[data-mp-kind]").selectOption("known");
    await first.locator("[data-mp-known] [data-mp-a]").fill("1.5");
    await first.locator("[data-mp-known] [data-mp-a-unit]").selectOption("yd3");

    await panel.getByRole("button", { name: "+ Add pour" }).click();
    const second = panel.locator("[data-mp-row]").nth(1);
    await second.locator("[data-mp-kind]").selectOption("round");
    await second.locator("[data-mp-round] [data-mp-a]").fill("12");
    await second.locator("[data-mp-round] [data-mp-a-unit]").selectOption("in");
    await second.locator("[data-mp-round] [data-mp-b]").fill("3");
    await second.locator("[data-mp-round] [data-mp-b-unit]").selectOption("ft");
    await second.locator("[data-mp-qty]").fill("2");

    await expect(panel.locator(".multi-pour-total")).toContainText("yd³");
    await root.locator(`#${slug}-wastePercent`).fill("10");
    const supplier = root.locator("details").filter({ hasText: "Supplier & order settings" });
    await supplier.locator("summary").click();
    await root.locator(`#${slug}-orderIncrement`).fill("0.25");
    await root.locator(`#${slug}-supplierMinimum`).fill("3");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("Combined pour schedule");
    await expect(root).toContainText("2 pours");
    await expect(root).toContainText("Planned supplier / billable volume");
    await expect(root).toContainText("3 yd³");
    await expect(diagram.locator("[data-waste-source]")).toHaveText("Combined multi-pour order");
    await expect(diagram.locator('[data-waste-geometry="4"]')).toBeVisible();

    const schedule = await root.evaluate((el) => (el as HTMLElement).dataset.multiPourSchedule || "");
    const shared = `${path}?cs_calc=${slug}&cs_wasteMode=4&cs_pours=${encodeURIComponent(schedule)}`;
    await page.goto(shared);
    const restored = page.locator(`[data-calculator-slug="${slug}"]`);
    await expect(restored.locator(".concrete-waste-multipour [data-mp-row]")).toHaveCount(2);
    await expect(restored.locator(".concrete-waste-multipour [data-mp-row]").first().locator("[data-mp-kind]")).toHaveValue("known");
    await expect(restored.locator(".concrete-waste-multipour [data-mp-row]").nth(1).locator("[data-mp-kind]")).toHaveValue("round");
  });

  test("supplier costs include short-load, delivery, fuel, tax, pump and pour duration", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await root.locator(`#${slug}-wasteMode`).selectOption("1");
    await root.locator(`#${slug}-volume`).fill("5");
    await root.locator(`#${slug}-volume-unit`).selectOption("yd3");
    await root.locator(`#${slug}-wastePercent`).fill("0");

    const supplier = root.locator("details").filter({ hasText: "Supplier & order settings" });
    await supplier.locator("summary").click();
    await root.locator(`#${slug}-truckCapacity`).fill("10");
    await root.locator(`#${slug}-shortLoadThreshold`).fill("6");
    await root.locator(`#${slug}-pourRate`).fill("2.5");

    const costs = root.locator("details").filter({ hasText: "Cost & project extras" });
    await costs.locator("summary").click();
    await root.locator(`#${slug}-price`).fill("200");
    await root.locator(`#${slug}-deliveryFeePerTruck`).fill("50");
    await root.locator(`#${slug}-fuelSurcharge`).fill("20");
    await root.locator(`#${slug}-shortLoadFeeMethod`).selectOption("0");
    await root.locator(`#${slug}-shortLoadFlatFee`).fill("100");
    await root.locator(`#${slug}-pumpPlacement`).fill("300");
    await root.locator(`#${slug}-salesTax`).fill("10");
    await root.locator(`#${slug}-taxBasis`).selectOption("0");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("Full ready-mix truck loads");
    await expect(root).toContainText("Final partial load");
    await expect(root).toContainText("Total truck visits");
    await expect(root).toContainText("Estimated placement duration");
    await expect(root).toContainText("2 hours");
    await expect(root).toContainText("Short-load charge");
    await expect(root).toContainText("100 USD");
    await expect(root).toContainText("Estimated ready-mix supply / placement total");
    await expect(root).toContainText("1,570 USD");
  });

  test("truck planning uses supplier-rounded volume and distinguishes full from partial loads", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    const diagram = root.locator("[data-project-diagram]");

    await root.locator(`#${slug}-wasteMode`).selectOption("1");
    await root.locator(`#${slug}-volume`).fill("18");
    await root.locator(`#${slug}-wastePercent`).fill("10");

    const supplier = root.locator("details").filter({ hasText: "Supplier & order settings" });
    await supplier.locator("summary").click();
    await root.locator(`#${slug}-orderIncrement`).fill("0.25");
    await root.locator(`#${slug}-truckCapacity`).fill("9");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("20 yd³");
    await expect(root).toContainText("2 loads");
    await expect(root).toContainText("Final partial load");
    await expect(root).toContainText("2 yd³");
    await expect(root).toContainText("3 loads");
    await expect(root).toContainText("Final truck utilization");
    await expect(diagram.locator("[data-waste-truck-plan]")).toContainText("3 truck loads");
  });

  test("direct PDF download and print-save-PDF workflows are both available", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    const downloadPromise = page.waitForEvent("download");
    await root.getByRole("button", { name: "Download concrete order plan PDF" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("calculatorst-concrete-waste-order-plan.pdf");

    await page.evaluate(() => {
      window.print = () => document.body.setAttribute("data-print-invoked", "yes");
    });
    const printButton = root.getByRole("button", { name: "Print or save calculation as PDF" });
    await printButton.click();
    await expect(page.locator("body")).toHaveAttribute("data-print-invoked", "yes");
  });

  test("zero supplier increment skips rounding without invalid output", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await root.locator(`#${slug}-wasteMode`).selectOption("1");
    await root.locator(`#${slug}-volume`).fill("2");
    await root.locator(`#${slug}-volume-unit`).selectOption("yd3");
    await root.locator(`#${slug}-wastePercent`).fill("5");
    const supplier = root.locator("details").filter({ hasText: "Supplier & order settings" });
    await supplier.locator("summary").click();
    await root.locator(`#${slug}-orderIncrement`).fill("0");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("2.1 yd³");
    await expect(root).toContainText("Extra caused by supplier increment");
    await expect(root).toContainText("0 yd³");
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });
});
