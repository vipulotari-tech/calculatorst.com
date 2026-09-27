import { expect, test } from "@playwright/test";

const slug = "concrete-waste-calculator";
const path = `/${slug}/`;

test.describe("Concrete Waste Calculator", () => {
  test("dimension mode separates allowance, rounding and supplier minimum", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    const diagram = root.locator("[data-project-diagram]");

    await expect(diagram).toHaveAttribute("data-kind", "concreteWaste");
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
    await root.locator(`#${slug}-truckCapacity`).fill("10");

    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("Waste-adjusted required volume");
    await expect(root).toContainText("4.0741 yd³");
    await expect(root).toContainText("Supplier-rounded requirement");
    await expect(root).toContainText("4.25 yd³");
    await expect(root).toContainText("Extra caused by supplier minimum");
    await expect(root).toContainText("Planned / billable ready-mix order");
    await expect(root).toContainText("5 yd³");
    await expect(root).toContainText("Total planned order above net volume");
    await expect(diagram.locator("[data-waste-order-label]")).toContainText("Planned 5.000 yd³");
    await expect(diagram.locator("[data-waste-minimum-label]")).toContainText("Minimum +0.750 yd³");
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
    await root.locator(`#${slug}-supplierMinimum`).fill("0");
    await root.locator(`#${slug}-customBagYield`).fill("0.5");

    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("2.7 yd³");
    await expect(root).toContainText("2.75 yd³");
    await expect(root).toContainText("50-lb bags");
    await expect(root).toContainText("195 bags");
    await expect(root).toContainText("Bags at custom mixed yield");
    await expect(root).toContainText("146 bags");
    await expect(root).toContainText("Effective overage after supplier rules");
    await expect(diagram.locator("[data-waste-source]")).toHaveText("Known net concrete volume");
  });

  test("round pier and wall modes switch geometry and calculate independently", async ({ page }) => {
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
    await root.locator(`#${slug}-sectionLength-unit`).selectOption("ft");
    await root.locator(`#${slug}-sectionHeight`).fill("2");
    await root.locator(`#${slug}-sectionHeight-unit`).selectOption("ft");
    await root.locator(`#${slug}-sectionThickness`).fill("8");
    await root.locator(`#${slug}-sectionThickness-unit`).selectOption("in");
    await root.locator(`#${slug}-sectionQuantity`).fill("1");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();
    await expect(root).toContainText("Wall / footing cross-section area");
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });

  test("multi-pour schedule combines mixed geometry exactly and restores from a shared URL", async ({ page }) => {
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
    await first.locator("[data-mp-qty]").fill("1");

    await panel.getByRole("button", { name: "+ Add pour" }).click();
    const second = panel.locator("[data-mp-row]").nth(1);
    await second.locator("[data-mp-kind]").selectOption("round");
    await second.locator("[data-mp-round] [data-mp-a]").fill("12");
    await second.locator("[data-mp-round] [data-mp-a-unit]").selectOption("in");
    await second.locator("[data-mp-round] [data-mp-b]").fill("3");
    await second.locator("[data-mp-round] [data-mp-b-unit]").selectOption("ft");
    await second.locator("[data-mp-qty]").fill("2");

    await expect(panel.locator(".multi-pour-total")).toContainText("1.6745 yd³");
    await root.locator(`#${slug}-wastePercent`).fill("10");

    const supplier = root.locator("details").filter({ hasText: "Supplier & order settings" });
    await supplier.locator("summary").click();
    await root.locator(`#${slug}-orderIncrement`).fill("0.25");
    await root.locator(`#${slug}-supplierMinimum`).fill("3");

    await root.getByRole("button", { name: "Calculate", exact: true }).click();
    await expect(root).toContainText("Combined pour rows");
    await expect(root).toContainText("2 pours");
    await expect(root).toContainText("Planned / billable ready-mix order");
    await expect(root).toContainText("3 yd³");
    await expect(diagram.locator("[data-waste-source]")).toHaveText("Combined multi-pour schedule");
    await expect(diagram.locator('[data-waste-geometry="4"]')).toBeVisible();

    const schedule = await root.evaluate((el) => (el as HTMLElement).dataset.multiPourSchedule || "");
    const shared = `${path}?cs_calc=${slug}&cs_wasteMode=4&cs_pours=${encodeURIComponent(schedule)}`;
    await page.goto(shared);
    const restored = page.locator(`[data-calculator-slug="${slug}"]`);
    await expect(restored.locator(".concrete-waste-multipour [data-mp-row]")).toHaveCount(2);
    await expect(restored.locator(".concrete-waste-multipour [data-mp-row]").first().locator("[data-mp-kind]")).toHaveValue("known");
    await expect(restored.locator(".concrete-waste-multipour [data-mp-row]").nth(1).locator("[data-mp-kind]")).toHaveValue("round");
    await expect(restored.locator(".multi-pour-total")).toContainText("1.6745 yd³");
  });

  test("supplier estimate adds delivery, short-load, pump, tax and placement duration", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await root.locator(`#${slug}-wasteMode`).selectOption("1");
    await root.locator(`#${slug}-volume`).fill("5");
    await root.locator(`#${slug}-volume-unit`).selectOption("yd3");
    await root.locator(`#${slug}-wastePercent`).fill("0");

    const supplier = root.locator("details").filter({ hasText: "Supplier & order settings" });
    await supplier.locator("summary").click();
    await root.locator(`#${slug}-orderIncrement`).fill("0.25");
    await root.locator(`#${slug}-supplierMinimum`).fill("0");
    await root.locator(`#${slug}-truckCapacity`).fill("10");
    await root.locator(`#${slug}-shortLoadThreshold`).fill("6");
    await root.locator(`#${slug}-pourRate`).fill("2.5");

    const costs = root.locator("details").filter({ hasText: "Cost & project extras" });
    await costs.locator("summary").click();
    await root.locator(`#${slug}-price`).fill("200");
    await root.locator(`#${slug}-deliveryCharge`).fill("70");
    await root.locator(`#${slug}-deliveryChargeMode`).selectOption("0");
    await root.locator(`#${slug}-shortLoadFee`).fill("100");
    await root.locator(`#${slug}-shortLoadFeeMode`).selectOption("0");
    await root.locator(`#${slug}-pumpPlacement`).fill("300");
    await root.locator(`#${slug}-salesTax`).fill("10");
    await root.locator(`#${slug}-taxScope`).selectOption("0");

    await root.getByRole("button", { name: "Calculate", exact: true }).click();

    await expect(root).toContainText("Full truck loads");
    await expect(root).toContainText("Final partial load");
    await expect(root).toContainText("Total truck visits");
    await expect(root).toContainText("Estimated placement duration");
    await expect(root).toContainText("2 hours");
    await expect(root).toContainText("Short-load charge");
    await expect(root).toContainText("Delivery / fuel cost");
    await expect(root).toContainText("Pump / placement allowance");
    await expect(root).toContainText("Estimated sales tax");
    await expect(root).toContainText("Estimated supply / placement total");
    await expect(root).toContainText("1,570");
  });

  test("truck planning distinguishes full and partial loads and exact multiples", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);
    const diagram = root.locator("[data-project-diagram]");

    await root.locator(`#${slug}-wasteMode`).selectOption("1");
    await root.locator(`#${slug}-volume`).fill("18");
    await root.locator(`#${slug}-volume-unit`).selectOption("yd3");
    await root.locator(`#${slug}-wastePercent`).fill("10");
    const supplier = root.locator("details").filter({ hasText: "Supplier & order settings" });
    await supplier.locator("summary").click();
    await root.locator(`#${slug}-orderIncrement`).fill("0.25");
    await root.locator(`#${slug}-truckCapacity`).fill("9");

    await root.getByRole("button", { name: "Calculate", exact: true }).click();
    await expect(root).toContainText("20 yd³");
    await expect(root).toContainText("Full truck loads");
    await expect(root).toContainText("2 loads");
    await expect(root).toContainText("Final partial load");
    await expect(root).toContainText("2 yd³");
    await expect(root).toContainText("Total truck visits");
    await expect(root).toContainText("3 visits");
    await expect(root).toContainText("Final delivery utilization");
    await expect(diagram.locator("[data-waste-truck-plan]")).toContainText("3 truck visits");

    await root.locator(`#${slug}-volume`).fill("20");
    await root.locator(`#${slug}-wastePercent`).fill("0");
    await root.locator(`#${slug}-orderIncrement`).fill("0");
    await root.locator(`#${slug}-truckCapacity`).fill("10");
    await root.getByRole("button", { name: "Calculate", exact: true }).click();
    await expect(root).toContainText("Final partial load");
    await expect(root).toContainText("0 yd³");
    await expect(root).toContainText("Final delivery quantity");
    await expect(root).toContainText("10 yd³");
    await expect(root).toContainText("100 %");
  });

  test("metric supplier settings and metric ready-mix price remain consistent", async ({ page }) => {
    await page.goto(path);
    const root = page.locator(`[data-calculator-slug="${slug}"]`);

    await root.locator(`#${slug}-wasteMode`).selectOption("1");
    await root.locator(`#${slug}-volume`).fill("2");
    await root.locator(`#${slug}-volume-unit`).selectOption("m3");
    await root.locator(`#${slug}-wastePercent`).fill("0");

    const supplier = root.locator("details").filter({ hasText: "Supplier & order settings" });
    await supplier.locator("summary").click();
    await root.locator(`#${slug}-orderIncrement`).fill("0.25");
    await root.locator(`#${slug}-orderIncrement-unit`).selectOption("m3");
    await root.locator(`#${slug}-truckCapacity`).fill("8");
    await root.locator(`#${slug}-truckCapacity-unit`).selectOption("m3");
    await root.locator(`#${slug}-pourRate`).fill("4");
    await root.locator(`#${slug}-pourRate-unit`).selectOption("m3/h");

    const costs = root.locator("details").filter({ hasText: "Cost & project extras" });
    await costs.locator("summary").click();
    await root.locator(`#${slug}-price`).fill("150");
    await root.locator(`#${slug}-price-unit`).selectOption("USD/m3");

    await root.getByRole("button", { name: "Calculate", exact: true }).click();
    await expect(root).toContainText("Estimated placement duration");
    await expect(root).toContainText("0.5 hours");
    await expect(root).toContainText("Planned ready-mix material cost");
    await expect(root).toContainText("300");
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
    await root.getByRole("button", { name: "Print or save calculation as PDF" }).click();
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
    await expect(root).toContainText("Extra caused by supplier increment rounding");
    await expect(root).toContainText("0 yd³");
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });
});
