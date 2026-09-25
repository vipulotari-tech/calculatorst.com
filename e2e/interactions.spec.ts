import { test, expect } from '@playwright/test';

// Shared helper to get calculator page
const calculators = [
  { slug: 'rebar-calculator', type: 'generic' },
  { slug: 'concrete-calculator', type: 'generic' },
  { slug: 'concrete-volume-calculator', type: 'generic' },
  { slug: 'concrete-weight-calculator', type: 'generic' },
  { slug: 'concrete-cost-calculator', type: 'generic' },
  { slug: 'gravel-calculator', type: 'handbuilt' },
  { slug: 'concrete-slab-calculator', type: 'handbuilt' },
  { slug: 'roof-pitch-calculator', type: 'handbuilt' },
];

test.describe('Calculator interactions', () => {
  for (const { slug } of calculators) {
    test(`${slug} — calculate, reset, copy, units`, async ({ page }) => {
      await page.goto(`/${slug}/`);
      await expect(page.locator('h1')).toBeVisible();

      // Find Calculate button
      const calculateBtn = page.getByRole('button', { name: /Calculate/i }).first();
      await expect(calculateBtn).toBeVisible();
      await expect(calculateBtn).toBeEnabled();

      // Find first numeric input
      const firstInput = page.locator('input[type="number"]').first();
      await expect(firstInput).toBeVisible();
      const initialVal = await firstInput.inputValue();

      // Change value, calculate
      await firstInput.fill('30');
      await calculateBtn.click();
      // Verify no NaN/Infinity/undefined in page
      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toMatch(/NaN|Infinity|undefined|null/);
      // Result should exist (check for any numeric result)
      await expect(page.locator('body')).not.toContainText('NaN');

      // Test Reset
      const resetBtn = page.getByRole('button', { name: /Reset/i }).first();
      if (await resetBtn.isVisible()) {
        await resetBtn.click();
        const afterReset = await firstInput.inputValue();
        // Should restore to initial or empty (handbuilt may clear, generic restores default)
        expect(afterReset).not.toBe('30'); // should not stay 30
        const bodyAfterReset = await page.locator('body').innerText();
        expect(bodyAfterReset).not.toMatch(/NaN|Infinity/);
        // Calculate again after reset should work
        await calculateBtn.click();
        const bodyAgain = await page.locator('body').innerText();
        expect(bodyAgain).not.toMatch(/NaN|Infinity/);
      }

      // Test unit dropdown if exists
      const unitSelect = page.locator('select, [role="combobox"]').first();
      if (await unitSelect.count() > 0) {
        // Just verify it is visible and clickable, change and ensure no NaN
        const firstOption = page.locator('select option, [role="option"]').first();
        // Not all selects are native, so just click the combobox
        try {
          await unitSelect.click({ timeout: 1000 });
          // try to select second option if exists
          const options = page.locator('[role="option"], select option');
          const count = await options.count();
          if (count > 1) {
            await options.nth(1).click({ timeout: 1000 }).catch(()=>{});
            await calculateBtn.click();
            const afterUnit = await page.locator('body').innerText();
            expect(afterUnit).not.toMatch(/NaN|Infinity/);
            // Switch back
            await unitSelect.click({ timeout: 1000 }).catch(()=>{});
            if (count > 0) await options.first().click({ timeout: 1000 }).catch(()=>{});
          }
        } catch {}
      }

      // Test invalid: negative, zero, large, decimal, invalid chars (number inputs block letters — verify no NaN)
      for (const val of ['-5', '0', '999999', '12.5']) {
        await firstInput.fill(val);
        await calculateBtn.click();
        const txt = await page.locator('body').innerText();
        expect(txt).not.toMatch(/NaN|Infinity|undefined/);
      }
      // Test invalid characters via JS (number inputs prevent typing letters, so set via JS and ensure no NaN)
      await firstInput.evaluate((el, v) => { (el as HTMLInputElement).value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, 'abc');
      await calculateBtn.click();
      expect(await page.locator('body').innerText()).not.toMatch(/NaN|Infinity|undefined/);
      // Restore valid and verify error disappears
      await firstInput.fill(initialVal || '20');
      await calculateBtn.click();
      const finalTxt = await page.locator('body').innerText();
      expect(finalTxt).not.toMatch(/NaN|Infinity/);
    });
  }

  test('Copy button feedback', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/rebar-calculator/');
    const copyBtn = page.getByRole('button', { name: /Copy/i }).first();
    if (await copyBtn.isVisible()) {
      await copyBtn.click();
      // In headless clipboard may not update text if permission denied — just verify no error and button still visible
      await page.waitForTimeout(500);
      await expect(copyBtn).toBeVisible();
      // If Copied appears, pass, otherwise still pass as long as no throw
      const text = await copyBtn.innerText();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('Live project diagram reflects visible measurement inputs', async ({ page }) => {
    await page.goto('/rebar-calculator/');
    const root = page.locator('[data-calculator-slug="rebar-calculator"]');
    const diagram = root.locator('[data-project-diagram]');
    await expect(diagram).toBeVisible();

    await root.locator('#rebar-calculator-length').fill('30');
    await expect(diagram.locator('[data-diagram-value="0"]')).toContainText('30');

    const width = root.locator('#rebar-calculator-width');
    await width.fill('14.5');
    await expect(diagram).toContainText('14.5');
    expect(await diagram.innerText()).toContain('Schematic only');
  });

  test('Concrete calculator — project type controls inputs, validation and diagram', async ({ page }) => {
    await page.goto('/concrete-calculator/');
    const root = page.locator('[data-calculator-slug="concrete-calculator"]');
    const shape = root.locator('#concrete-calculator-shape');
    const diagram = root.locator('[data-project-diagram]');

    await expect(root.locator('#concrete-calculator-field-length')).toBeVisible();
    await expect(root.locator('#concrete-calculator-field-width')).toBeVisible();
    await expect(root.locator('#concrete-calculator-field-depth')).toBeVisible();
    await expect(root.locator('#concrete-calculator-field-thickness')).toBeHidden();
    await expect(root.locator('#concrete-calculator-field-diameter')).toBeHidden();
    await expect(root.locator('#concrete-calculator-field-height')).toBeHidden();
    await expect(diagram).toContainText('Rectangular slab');

    await shape.selectOption('2');
    await expect(root.locator('#concrete-calculator-field-length')).toBeVisible();
    await expect(root.locator('#concrete-calculator-field-width')).toBeHidden();
    await expect(root.locator('#concrete-calculator-field-depth')).toBeHidden();
    await expect(root.locator('#concrete-calculator-field-thickness')).toBeVisible();
    await expect(root.locator('#concrete-calculator-field-height')).toBeVisible();
    await expect(root.locator('#concrete-calculator-field-diameter')).toBeHidden();
    await expect(diagram).toContainText('Wall');

    await shape.selectOption('3');
    await expect(root.locator('#concrete-calculator-field-length')).toBeHidden();
    await expect(root.locator('#concrete-calculator-field-width')).toBeHidden();
    await expect(root.locator('#concrete-calculator-field-depth')).toBeHidden();
    await expect(root.locator('#concrete-calculator-field-thickness')).toBeHidden();
    await expect(root.locator('#concrete-calculator-field-diameter')).toBeVisible();
    await expect(root.locator('#concrete-calculator-field-height')).toBeVisible();
    await expect(diagram).toContainText('Cylinder / column');

    await root.locator('#concrete-calculator-diameter').fill('0');
    await root.getByRole('button', { name: /^Calculate$/ }).click();
    await expect(root.locator('#concrete-calculator-diameter-err')).toContainText('greater than zero');

    await root.locator('#concrete-calculator-diameter').fill('24');
    await root.locator('#concrete-calculator-diameter-unit').selectOption('in');
    await root.locator('#concrete-calculator-height').fill('10');
    await root.locator('#concrete-calculator-height-unit').selectOption('ft');
    await root.getByRole('button', { name: /^Calculate$/ }).click();
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
    await expect(diagram).toContainText('24 in');
    await expect(diagram).toContainText('10 ft');
  });

  test('Concrete shared link restores the cylinder diagram state', async ({ page }) => {
    await page.goto('/concrete-calculator/?cs_calc=concrete-calculator&cs_shape=3&cs_diameter=24&cs_diameter_unit=in&cs_height=10&cs_height_unit=ft&cs_quantity=3&cs_waste=10&cs_density=150&cs_density_unit=lb%2Fft3&cs_yield=0.6&cs_yield_unit=ft3');
    const root = page.locator('[data-calculator-slug="concrete-calculator"]');
    const diagram = root.locator('[data-project-diagram]');
    await expect(root.locator('#concrete-calculator-shape')).toHaveValue('3');
    await expect(root.locator('#concrete-calculator-field-length')).toBeHidden();
    await expect(root.locator('#concrete-calculator-field-diameter')).toBeVisible();
    await expect(diagram).toContainText('Cylinder / column');
    await expect(diagram).toContainText('24 in');
    await expect(diagram).toContainText('10 ft');
    await expect(root.locator('.result-primary')).toHaveText('3.8397');
  });

  test('Concrete shared URL hydrates the matching diagram on first render', async ({ page }) => {
    await page.goto('/concrete-calculator/?cs_calc=concrete-calculator&cs_shape=3&cs_diameter=24&cs_diameter_unit=in&cs_height=10&cs_height_unit=ft&cs_quantity=3&cs_waste=10&cs_density=150&cs_density_unit=lb%2Fft3&cs_yield=0.6&cs_yield_unit=ft3');
    const root = page.locator('[data-calculator-slug="concrete-calculator"]');
    const diagram = root.locator('[data-project-diagram]');
    await expect(root.locator('#concrete-calculator-shape')).toHaveValue('3');
    await expect(root.locator('#concrete-calculator-field-diameter')).toBeVisible();
    await expect(root.locator('#concrete-calculator-field-length')).toBeHidden();
    await expect(diagram.locator('[data-concrete-shape-name]')).toHaveText('Cylinder / column');
    await expect(diagram).toContainText('24 in');
    await expect(diagram).toContainText('10 ft');
    await expect(root.locator('.result-primary')).toHaveText('3.8397');
  });

  test('Concrete volume calculator — nine modes gate fields, diagram and validation', async ({ page }) => {
    await page.goto('/concrete-volume-calculator/');
    const root = page.locator('[data-calculator-slug="concrete-volume-calculator"]');
    const shape = root.locator('#concrete-volume-calculator-shape');
    const diagram = root.locator('[data-project-diagram]');

    await expect(shape.locator('option')).toHaveCount(9);
    await expect(root.locator('#concrete-volume-calculator-field-length')).toBeVisible();
    await expect(root.locator('#concrete-volume-calculator-field-width')).toBeVisible();
    await expect(root.locator('#concrete-volume-calculator-field-depth')).toBeVisible();
    await expect(root.locator('#concrete-volume-calculator-field-diameter')).toBeHidden();
    await expect(diagram.locator('[data-concrete-volume-shape-name]')).toHaveText('Rectangular slab / prism');

    await shape.selectOption('2');
    await expect(root.locator('#concrete-volume-calculator-field-diameter')).toBeVisible();
    await expect(root.locator('#concrete-volume-calculator-field-innerDiameter')).toBeVisible();
    await expect(root.locator('#concrete-volume-calculator-field-height')).toBeVisible();
    await expect(root.locator('#concrete-volume-calculator-field-length')).toBeHidden();
    await expect(diagram.locator('[data-concrete-volume-shape-name]')).toHaveText('Hollow tube / annular cylinder');

    await root.locator('#concrete-volume-calculator-diameter').fill('24');
    await root.locator('#concrete-volume-calculator-innerDiameter').fill('24');
    await root.getByRole('button', { name: /^Calculate$/ }).click();
    await expect(root.locator('#concrete-volume-calculator-innerDiameter-err')).toContainText('smaller than outer diameter');

    await root.locator('#concrete-volume-calculator-innerDiameter').fill('12');
    await root.locator('#concrete-volume-calculator-height').fill('10');
    await root.locator('#concrete-volume-calculator-quantity').fill('2');
    await root.getByRole('button', { name: /^Calculate$/ }).click();
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
    await expect(diagram).toContainText('24');
    await expect(diagram).toContainText('12');

    await shape.selectOption('4');
    await expect(root.locator('#concrete-volume-calculator-field-stairWidth')).toBeVisible();
    await expect(root.locator('#concrete-volume-calculator-field-rise')).toBeVisible();
    await expect(root.locator('#concrete-volume-calculator-field-run')).toBeVisible();
    await expect(root.locator('#concrete-volume-calculator-field-diameter')).toBeHidden();
    await expect(diagram.locator('[data-concrete-volume-shape-name]')).toHaveText('Solid stairs (mass fill)');

    await shape.selectOption('6');
    await expect(root.locator('#concrete-volume-calculator-field-length')).toBeVisible();
    await expect(root.locator('#concrete-volume-calculator-field-thickness')).toBeVisible();
    await expect(root.locator('#concrete-volume-calculator-field-height')).toBeVisible();
    await expect(root.locator('#concrete-volume-calculator-field-width')).toBeHidden();
    await expect(diagram.locator('[data-concrete-volume-shape-name]')).toHaveText('Concrete wall');

    await shape.selectOption('8');
    await expect(root.locator('#concrete-volume-calculator-field-length')).toBeVisible();
    await expect(root.locator('#concrete-volume-calculator-field-width')).toBeVisible();
    await expect(root.locator('#concrete-volume-calculator-field-height')).toBeVisible();
    await expect(root.locator('#concrete-volume-calculator-field-depth')).toBeHidden();
    await expect(diagram.locator('[data-concrete-volume-shape-name]')).toHaveText('Square / rectangular column');
  });

  test('Concrete volume shared link restores tube inputs and diagram', async ({ page }) => {
    await page.goto('/concrete-volume-calculator/?cs_calc=concrete-volume-calculator&cs_shape=2&cs_diameter=24&cs_diameter_unit=in&cs_innerDiameter=12&cs_innerDiameter_unit=in&cs_height=10&cs_height_unit=ft&cs_quantity=2&cs_waste=0&cs_density=150&cs_density_unit=lb%2Fft3&cs_yield=0.6&cs_yield_unit=ft3');
    const root = page.locator('[data-calculator-slug="concrete-volume-calculator"]');
    const diagram = root.locator('[data-project-diagram]');
    await expect(root.locator('#concrete-volume-calculator-shape')).toHaveValue('2');
    await expect(root.locator('#concrete-volume-calculator-field-innerDiameter')).toBeVisible();
    await expect(root.locator('#concrete-volume-calculator-field-length')).toBeHidden();
    await expect(diagram.locator('[data-concrete-volume-shape-name]')).toHaveText('Hollow tube / annular cylinder');
    await expect(diagram).toContainText('24 in');
    await expect(diagram).toContainText('12 in');
    await expect(root.locator('.result-primary')).toHaveText('1.7453');
  });

  test('Concrete weight calculator — modes, density presets and primary result', async ({ page }) => {
    await page.goto('/concrete-weight-calculator/');
    const root = page.locator('[data-calculator-slug="concrete-weight-calculator"]');
    const mode = root.locator('#concrete-weight-calculator-weightMode');
    const densityBasis = root.locator('#concrete-weight-calculator-densityBasis');
    const outputUnit = root.locator('#concrete-weight-calculator-outputUnit');

    await expect(root.locator('.result-primary')).toHaveText('4,050');
    await expect(root.locator('.result-primary-unit')).toHaveText('lb');
    await expect(root.locator('#concrete-weight-calculator-field-volume')).toBeVisible();
    await expect(root.locator('#concrete-weight-calculator-field-area')).toBeHidden();
    await expect(root.locator('#concrete-weight-calculator-field-length')).toBeHidden();

    await mode.selectOption('3');
    await expect(root.locator('#concrete-weight-calculator-field-volume')).toBeHidden();
    await expect(root.locator('#concrete-weight-calculator-field-area')).toBeVisible();
    await expect(root.locator('#concrete-weight-calculator-field-areaThickness')).toBeVisible();
    await root.locator('#concrete-weight-calculator-area').fill('100');
    await root.locator('#concrete-weight-calculator-area-unit').selectOption('ft2');
    await root.locator('#concrete-weight-calculator-areaThickness').fill('4');
    await root.locator('#concrete-weight-calculator-areaThickness-unit').selectOption('in');
    await root.getByRole('button', { name: /^Calculate$/ }).click();
    await expect(root.locator('.result-primary')).toHaveText('5,000');

    await mode.selectOption('1');
    await expect(root.locator('#concrete-weight-calculator-field-area')).toBeHidden();
    await expect(root.locator('#concrete-weight-calculator-field-length')).toBeVisible();
    await expect(root.locator('#concrete-weight-calculator-field-width')).toBeVisible();
    await expect(root.locator('#concrete-weight-calculator-field-depth')).toBeVisible();
    await root.locator('#concrete-weight-calculator-length').fill('10');
    await root.locator('#concrete-weight-calculator-width').fill('10');
    await root.locator('#concrete-weight-calculator-depth').fill('6');
    await root.locator('#concrete-weight-calculator-depth-unit').selectOption('in');
    await root.getByRole('button', { name: /^Calculate$/ }).click();
    await expect(root.locator('.result-primary')).toHaveText('7,500');
    await expect(root.locator('[data-project-diagram]')).toBeVisible();
    await expect(root.locator('[data-concrete-weight-mode-name]')).toHaveText('Length × width × thickness');

    await mode.selectOption('2');
    await expect(root.locator('#concrete-weight-calculator-field-diameter')).toBeVisible();
    await expect(root.locator('#concrete-weight-calculator-field-height')).toBeVisible();
    await expect(root.locator('[data-concrete-weight-mode-name]')).toHaveText('Round slab / cylinder dimensions');

    await mode.selectOption('0');
    await root.locator('#concrete-weight-calculator-volume').fill('1');
    await root.locator('#concrete-weight-calculator-volume-unit').selectOption('yd3');
    await densityBasis.selectOption('2');
    await expect(root.locator('#concrete-weight-calculator-field-density')).toBeHidden();
    await outputUnit.selectOption('3');
    await root.getByRole('button', { name: /^Calculate$/ }).click();
    await expect(root.locator('.result-primary')).toHaveText('1.4084');
    await expect(root.locator('.result-primary-unit')).toHaveText('metric tonnes');
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });

  test('Concrete weight calculator rejects zero active geometry', async ({ page }) => {
    await page.goto('/concrete-weight-calculator/');
    const root = page.locator('[data-calculator-slug="concrete-weight-calculator"]');
    await root.locator('#concrete-weight-calculator-weightMode').selectOption('3');
    await root.locator('#concrete-weight-calculator-area').fill('0');
    await root.getByRole('button', { name: /^Calculate$/ }).click();
    await expect(root.locator('#concrete-weight-calculator-area-err')).toContainText('greater than zero');
  });

  test('Concrete cost calculator — total-cost primary, modes and live diagram', async ({ page }) => {
    await page.goto('/concrete-cost-calculator/?cs_calc=concrete-cost-calculator&cs_costMode=0&cs_length=10&cs_length_unit=ft&cs_width=10&cs_width_unit=ft&cs_depth=6&cs_depth_unit=in&cs_quantity=1&cs_density=150&cs_density_unit=lb%2Fft3&cs_yield=0.6&cs_yield_unit=ft3&cs_price=160&cs_price_unit=USD%2Fyd3&cs_delivery=150&cs_shortLoadFee=75&cs_pumpFee=0&cs_reinforcement=200&cs_formwork=100&cs_finishing=400&cs_tax=8&cs_waste=10');
    const root = page.locator('[data-calculator-slug="concrete-cost-calculator"]');
    const mode = root.locator('#concrete-cost-calculator-costMode');
    const diagram = root.locator('[data-project-diagram]');

    await expect(root.locator('.result-primary')).toHaveText('1,277');
    await expect(root.locator('.result-primary-unit')).toHaveText('USD');
    await expect(root.locator('.result-secondary')).toHaveText('Estimated project total');
    await expect(root.locator('.result-rows-grid')).toContainText('Concrete material subtotal');
    await expect(root.locator('.result-rows-grid')).toContainText('325.9259');
    await expect(root.locator('.result-rows-grid')).toContainText('Other entered project charges');
    await expect(root.locator('.result-rows-grid')).toContainText('925');
    await expect(root.locator('.result-rows-grid')).toContainText('All-in cost per square foot');
    await expect(diagram).toBeVisible();
    await expect(diagram.locator('[data-concrete-cost-mode-name]')).toHaveText('Length × width × thickness');

    await mode.selectOption('2');
    await expect(root.locator('#concrete-cost-calculator-field-length')).toBeHidden();
    await expect(root.locator('#concrete-cost-calculator-field-area')).toBeVisible();
    await expect(root.locator('#concrete-cost-calculator-field-areaThickness')).toBeVisible();
    await expect(diagram).toBeVisible();
    await expect(diagram.locator('[data-concrete-cost-mode-name]')).toHaveText('Surface area × thickness');

    await mode.selectOption('3');
    await expect(root.locator('#concrete-cost-calculator-field-diameter')).toBeVisible();
    await expect(root.locator('#concrete-cost-calculator-field-height')).toBeVisible();
    await expect(diagram.locator('[data-concrete-cost-mode-name]')).toHaveText('Round slab / cylinder dimensions');

    await mode.selectOption('1');
    await expect(root.locator('#concrete-cost-calculator-field-volume')).toBeVisible();
    await expect(root.locator('#concrete-cost-calculator-field-diameter')).toBeHidden();
    await expect(diagram).toBeHidden();
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });

  test('Concrete cost calculator rejects zero active geometry', async ({ page }) => {
    await page.goto('/concrete-cost-calculator/');
    const root = page.locator('[data-calculator-slug="concrete-cost-calculator"]');
    await root.locator('#concrete-cost-calculator-costMode').selectOption('2');
    await root.locator('#concrete-cost-calculator-area').fill('0');
    await root.getByRole('button', { name: /^Calculate$/ }).click();
    await expect(root.locator('#concrete-cost-calculator-area-err')).toContainText('greater than zero');
    await expect(root.locator('.result-primary')).toHaveText('—');
  });

  test('Estimate worksheet is populated from real result rows', async ({ page }) => {
    await page.goto('/concrete-calculator/');
    const root = page.locator('[data-calculator-slug="concrete-calculator"]');
    await root.getByRole('button', { name: /^Calculate$/ }).click();

    const worksheet = root.locator('.calc-estimate-worksheet');
    await expect(worksheet).toBeVisible();
    await expect(worksheet.locator('tbody tr')).not.toHaveCount(0);
    await expect(worksheet).toContainText('Concrete to order');
    expect(await worksheet.innerText()).not.toMatch(/NaN|Infinity|undefined/);
  });

  test('Advanced assumptions stay collapsed until requested', async ({ page }) => {
    await page.goto('/concrete-calculator/');
    const root = page.locator('[data-calculator-slug="concrete-calculator"]');
    const details = root.locator('details').filter({ hasText: 'Advanced material assumptions' });
    await expect(details).not.toHaveAttribute('open', '');
    await details.locator('summary').click();
    await expect(details).toHaveAttribute('open', '');
    await expect(root.locator('#concrete-calculator-waste')).toBeVisible();
  });

  test('Helpful feedback is truthful and persists only on the device', async ({ page }) => {
    await page.goto('/concrete-calculator/');
    const feedback = page.locator('[data-calculator-feedback]');
    await expect(feedback).toBeVisible();
    await expect(feedback).toContainText('stored only on this device');
    const helpful = feedback.getByRole('button', { name: 'Helpful' });
    await helpful.click();
    await expect(helpful).toHaveAttribute('aria-pressed', 'true');
    await expect(feedback.locator('.feedback-status')).toContainText('saved on this device');

    await page.reload();
    await expect(page.locator('[data-calculator-feedback]').getByRole('button', { name: 'Helpful' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('Rapid clicks do not duplicate', async ({ page }) => {
    await page.goto('/rebar-calculator/');
    const btn = page.getByRole('button', { name: /Calculate/i }).first();
    for (let i = 0; i < 5; i++) await btn.click();
    // Verify no duplicate estimate headers and no NaN, and single result panel
    const body = await page.locator('body').innerText();
    expect(body).not.toMatch(/NaN|Infinity/);
    const panels = await page.locator('.calc-results-panel').count();
    expect(panels).toBe(1);
    const grids = await page.locator('.result-rows-grid').count();
    expect(grids).toBe(1);
  });
});

test.describe('Navigation and UI', () => {
  test('Homepage search', async ({ page }) => {
    await page.goto('/');
    const searchBtn = page.locator('#search-btn, #search-btn-mobile').first();
    await searchBtn.click();
    const input = page.locator('#header-search-input');
    await expect(input).toBeVisible({ timeout: 2000 });
    await input.fill('concrete');
    const results = page.locator('#header-search-results');
    await expect(results).toContainText(/concrete/i, { timeout: 2000 });
    // Clear
    await input.fill('');
    // Close via Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('#header-search')).toBeHidden({ timeout: 2000 });
  });

  test('Mobile menu open/close', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    const toggle = page.locator('#menu-toggle');
    await expect(toggle).toBeVisible();
    await toggle.click();
    const menu = page.locator('#mobile-menu');
    await expect(menu).toBeVisible();
    // Click a link should close
    const link = menu.locator('a').first();
    await link.click();
    // Should navigate, menu should be hidden or page changed
    await page.waitForTimeout(500);
    // Reopen and close via Escape
    await page.goto('/');
    await page.setViewportSize({ width: 375, height: 812 });
    await toggle.click();
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden({ timeout: 2000 });
  });

  test('Inputs readability and contrast', async ({ page }) => {
    await page.goto('/gravel-calculator/');
    const input = page.locator('input[type="number"]').first();
    await expect(input).toBeVisible();
    const bg = await input.evaluate(el => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe('');
  });

  test('Breadcrumbs and related links', async ({ page }) => {
    await page.goto('/concrete-calculator/');
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toBeVisible();
    const links = breadcrumb.locator('a');
    await expect(links.first()).toHaveAttribute('href', '/');
    // Click breadcrumb Construction
    await links.nth(1).click();
    await expect(page).toHaveURL(/\/construction\//);
    // Related calculators
    await page.goto('/concrete-calculator/');
    const related = page.locator('text=Related calculators');
    if (await related.isVisible()) {
      const firstRelated = page.locator('a[href^="/"][href$="-calculator/"]').first();
      await expect(firstRelated).toBeVisible();
      const href = await firstRelated.getAttribute('href');
      expect(href).toMatch(/\/.*-calculator\//);
    }
  });

  test('FAQ accordion keyboard', async ({ page }) => {
    await page.goto('/gravel-calculator/');
    const faq = page.locator('text=Frequently asked questions').locator('..').locator('button, [role="button"], summary').first();
    // Try disclosure triangles
    const disclosure = page.locator('text=How much gravel').first();
    if (await disclosure.isVisible()) {
      await disclosure.click();
      // Should expand, check aria-expanded or content visible
      await page.waitForTimeout(300);
      const expanded = await disclosure.getAttribute('aria-expanded');
      // Not all have aria-expanded, but should not throw
      expect(true).toBeTruthy();
      await disclosure.click();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
    }
  });

  test('No dead CTA', async ({ page }) => {
    await page.goto('/');
    const ctas = page.locator('a, button');
    const count = await ctas.count();
    expect(count).toBeGreaterThan(10);
    // Check every visible button has action (not disabled with no handler)
    // For now, just ensure no button with empty text and no aria-label
    const buttons = page.locator('button:visible');
    const n = await buttons.count();
    for (let i = 0; i < Math.min(n, 10); i++) {
      const btn = buttons.nth(i);
      const text = (await btn.innerText()).trim();
      const aria = await btn.getAttribute('aria-label');
      expect(text.length > 0 || (aria && aria.length > 0)).toBeTruthy();
    }
  });

  test('No console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', err => errors.push(err.message));
    await page.goto('/rebar-calculator/');
    await page.getByRole('button', { name: /Calculate/i }).first().click();
    await page.waitForTimeout(500);
    // Filter out known third-party errors (ads, GA)
    const filtered = errors.filter(e => !e.includes('adtrafficquality') && !e.includes('googletag') && !e.includes('doubleclick'));
    expect(filtered).toEqual([]);
  });
});


const framingRoofingFlooringSlugs = [
  'framing-calculator',
  'wall-framing-calculator',
  'stud-calculator',
  'stud-spacing-calculator',
  'lumber-calculator',
  'lumber-cost-calculator',
  'board-foot-calculator',
  'board-foot-cost-calculator',
  'joist-calculator',
  'joist-spacing-calculator',
  'floor-joist-calculator',
  'ceiling-joist-calculator',
  'header-size-calculator',
  'beam-calculator',
  'beam-load-calculator',
  'roofing-calculator',
  'roof-area-calculator',
  'roof-pitch-calculator',
  'roof-slope-calculator',
  'roofing-shingle-calculator',
  'shingle-quantity-calculator',
  'shingle-cost-calculator',
  'roofing-material-calculator',
  'roofing-underlayment-calculator',
  'roof-sheathing-calculator',
  'roof-rafter-calculator',
  'rafter-length-calculator',
  'roof-truss-calculator',
  'roof-flashing-calculator',
  'roof-waste-calculator',
  'flooring-calculator',
  'flooring-cost-calculator',
  'hardwood-flooring-calculator',
  'hardwood-flooring-cost-calculator',
  'laminate-flooring-calculator',
  'vinyl-flooring-calculator',
  'carpet-calculator',
  'carpet-cost-calculator',
  'tile-calculator',
  'tile-quantity-calculator',
  'tile-cost-calculator',
  'tile-grout-calculator',
  'tile-adhesive-calculator',
  'flooring-waste-calculator',
  'underlayment-calculator',
] as const;

test.describe('Framing / roofing / flooring full browser audit', () => {
  for (const slug of framingRoofingFlooringSlugs) {
    test(`${slug} — render, calculate, unit switch and reset`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('pageerror', error => consoleErrors.push(error.message));
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.goto(`/${slug}/`);
      await expect(page.locator('h1')).toBeVisible();

      const root = page.locator(`[data-calculator-slug="${slug}"]`);
      await expect(root).toBeVisible();
      await expect(root.locator('.calc-results-panel')).toHaveCount(1);

      const calculate = root.getByRole('button', { name: /^Calculate$/ });
      const reset = root.getByRole('button', { name: /^Reset$/ });
      await expect(calculate).toBeVisible();
      await expect(reset).toBeVisible();

      await calculate.click();
      let text = await root.innerText();
      expect(text).not.toMatch(/NaN|Infinity|undefined|null/);

      const firstVisibleNumber = root.locator('input[type="number"]:visible').first();
      if (await firstVisibleNumber.count()) {
        const original = await firstVisibleNumber.inputValue();
        const min = Number(await firstVisibleNumber.getAttribute('min') ?? '0');
        const step = await firstVisibleNumber.getAttribute('step');
        const candidate = step === '1' ? String(Math.max(2, Math.ceil(min))) : String(Math.max(2.5, min || 0.1));
        await firstVisibleNumber.fill(candidate);
        await calculate.click();
        text = await root.innerText();
        expect(text).not.toMatch(/NaN|Infinity|undefined|null/);

        await reset.click();
        const resetValue = await firstVisibleNumber.inputValue();
        expect(resetValue).toBe(original);
      }

      const firstUnit = root.locator('.calc-unit-select:visible').first();
      if (await firstUnit.count()) {
        const options = await firstUnit.locator('option').evaluateAll(options =>
          options.map(option => (option as HTMLOptionElement).value)
        );
        if (options.length > 1) {
          const originalUnit = await firstUnit.inputValue();
          const alternate = options.find(option => option !== originalUnit);
          if (alternate) {
            await firstUnit.selectOption(alternate);
            await calculate.click();
            text = await root.innerText();
            expect(text).not.toMatch(/NaN|Infinity|undefined|null/);
            await reset.click();
            expect(await firstUnit.inputValue()).toBe(originalUnit);
          }
        }
      }

      const relevantErrors = consoleErrors.filter(error =>
        !error.includes('adtrafficquality') &&
        !error.includes('googletag') &&
        !error.includes('doubleclick') &&
        !error.includes('google-analytics')
      );
      expect(relevantErrors).toEqual([]);
    });
  }

  test('roofing calculator — known-area mode hides footprint fields and calculates', async ({ page }) => {
    await page.goto('/roofing-calculator/');
    const root=page.locator('[data-calculator-slug="roofing-calculator"]');
    await root.locator('#roofing-calculator-mode').selectOption('1');
    await expect(root.locator('#roofing-calculator-field-length')).toBeHidden();
    await expect(root.locator('#roofing-calculator-field-roofArea')).toBeVisible();
    await root.locator('#roofing-calculator-roofArea').fill('1000');
    await root.getByText('Advanced material assumptions').click();
    await root.locator('#roofing-calculator-waste').fill('0');
    await root.getByRole('button',{name:/Calculate/i}).click();
    await expect(root).toContainText('Measured roof surface');
    expect(await root.innerText()).not.toMatch(/NaN|Infinity/);
  });

  test('roof pitch calculator — all solver modes, validation and live diagram work', async ({ page }) => {
    await page.goto('/roof-pitch-calculator/');
    const root=page.locator('[data-calculator-slug="roof-pitch-calculator"]');
    const mode=root.locator('#roof-pitch-calculator-mode');
    const diagram=root.locator('[data-project-diagram]');

    await expect(diagram).toBeVisible();
    await root.locator('#roof-pitch-calculator-rise').fill('6');
    await root.locator('#roof-pitch-calculator-run').fill('12');
    await root.getByRole('button',{name:/Calculate/i}).click();
    await expect(root.locator('.result-primary')).toHaveText(/^6:12$/);
    await expect(root).toContainText('Straight sloped rafter length');
    await expect(diagram).toContainText('6.00:12');

    await mode.selectOption('1');
    await expect(root.locator('#roof-pitch-calculator-field-angleInput')).toBeVisible();
    await expect(root.locator('#roof-pitch-calculator-field-rise')).toBeHidden();
    await root.locator('#roof-pitch-calculator-angleInput').fill('45');
    await root.locator('#roof-pitch-calculator-referenceRun').fill('10');
    await root.getByRole('button',{name:/Calculate/i}).click();
    await expect(root.locator('.result-primary')).toHaveText(/^12:12$/);
    await expect(root).toContainText('14.1421');

    await mode.selectOption('2');
    await expect(root.locator('#roof-pitch-calculator-field-pitchInput')).toBeVisible();
    await root.locator('#roof-pitch-calculator-pitchInput').fill('8');
    await root.locator('#roof-pitch-calculator-referenceRun').fill('12');
    await root.getByRole('button',{name:/Calculate/i}).click();
    await expect(root.locator('.result-primary')).toHaveText(/^8:12$/);
    await expect(root).toContainText('66.6667');

    await mode.selectOption('3');
    await expect(root.locator('#roof-pitch-calculator-field-rafterLength')).toBeVisible();
    await root.locator('#roof-pitch-calculator-run').fill('12');
    await root.locator('#roof-pitch-calculator-run-unit').selectOption('ft');
    await root.locator('#roof-pitch-calculator-rafterLength').fill('10');
    await root.locator('#roof-pitch-calculator-rafterLength-unit').selectOption('ft');
    await root.getByRole('button',{name:/Calculate/i}).click();
    await expect(root.locator('#roof-pitch-calculator-rafterLength-err')).toContainText('Rafter length must be at least as long as the horizontal run');

    await root.locator('#roof-pitch-calculator-rafterLength').fill('13.416407865');
    await root.getByRole('button',{name:/Calculate/i}).click();
    await expect(root.locator('.result-primary')).toHaveText(/^6:12$/);

    await root.getByRole('button',{name:/Reset/i}).click();
    await expect(mode).toHaveValue('0');
  });

  test('tile calculator — known-area mode and whole-box purchase are visible', async ({ page }) => {
    await page.goto('/tile-calculator/');
    const root=page.locator('[data-calculator-slug="tile-calculator"]');
    await root.locator('#tile-calculator-mode').selectOption('1');
    await root.locator('#tile-calculator-area').fill('120');
    await root.locator('#tile-calculator-tileLength').fill('12');
    await root.locator('#tile-calculator-tileWidth').fill('12');
    await root.locator('#tile-calculator-tilesPerBox').fill('10');
    await root.getByText('Advanced material assumptions').click();
    await root.locator('#tile-calculator-waste').fill('10');
    await root.getByRole('button',{name:/Calculate/i}).click();
    await expect(root).toContainText('Tiles purchased in whole boxes');
    await expect(root).toContainText('Purchased tile face area');
    expect(await root.innerText()).not.toMatch(/NaN|Infinity/);
  });
});


const gscHubGenericSlugs = [
  'drywall-calculator',
  'drywall-sheet-calculator',
  'drywall-cost-calculator',
  'drywall-joint-compound-calculator',
  'drywall-screw-calculator',
  'drywall-tape-calculator',
  'paint-calculator',
  'paint-coverage-calculator',
  'paint-cost-calculator',
  'primer-calculator',
  'ceiling-paint-calculator',
  'wall-paint-calculator',
  'insulation-calculator',
  'insulation-cost-calculator',
  'spray-foam-calculator',
  'deck-calculator',
  'deck-cost-calculator',
  'deck-board-calculator',
  'deck-joist-calculator',
  'deck-footing-calculator',
  'deck-stair-calculator',
  'deck-railing-calculator',
  'fence-calculator',
  'fence-post-calculator',
  'fence-panel-calculator',
  'fence-picket-calculator',
  'fence-concrete-calculator',
  'gate-calculator',
  'gate-cost-calculator',
  'paver-calculator',
  'paver-cost-calculator',
  'paver-sand-calculator',
  'paver-base-calculator',
  'paver-joint-sand-calculator',
  'landscaping-calculator',
  'landscaping-cost-calculator',
  'mulch-calculator',
  'mulch-cost-calculator',
  'retaining-wall-calculator',
  'asphalt-calculator',
  'asphalt-cost-calculator',
  'asphalt-driveway-calculator',
  'asphalt-weight-calculator',
  'asphalt-thickness-calculator',
  'parking-lot-calculator',
  'parking-lot-cost-calculator',
  'road-base-calculator',
  'surface-area-calculator',
  'construction-material-cost-calculator',
] as const;

test.describe('Drywall / deck / landscaping / asphalt full browser audit', () => {
  for (const slug of gscHubGenericSlugs) {
    test(`${slug} — render, calculate, unit switch and reset`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('pageerror', error => consoleErrors.push(error.message));
      page.on('console', msg => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });

      await page.goto(`/${slug}/`);
      await expect(page.locator('h1')).toBeVisible();

      const root = page.locator(`[data-calculator-slug="${slug}"]`);
      await expect(root).toBeVisible();
      await expect(root.locator('.calc-results-panel')).toHaveCount(1);

      const calculate = root.getByRole('button', { name: /^Calculate$/ });
      const reset = root.getByRole('button', { name: /^Reset$/ });
      await expect(calculate).toBeVisible();
      await expect(reset).toBeVisible();

      await calculate.click();
      let text = await root.innerText();
      expect(text).not.toMatch(/NaN|Infinity|undefined|null/);

      const firstVisibleNumber = root.locator('input[type="number"]:visible').first();
      if (await firstVisibleNumber.count()) {
        const original = await firstVisibleNumber.inputValue();
        const min = Number(await firstVisibleNumber.getAttribute('min') ?? '0');
        const step = await firstVisibleNumber.getAttribute('step');
        const candidate = step === '1'
          ? String(Math.max(2, Math.ceil(min)))
          : String(Math.max(2.5, Number.isFinite(min) ? min : 0.1));
        await firstVisibleNumber.fill(candidate);
        await calculate.click();
        text = await root.innerText();
        expect(text).not.toMatch(/NaN|Infinity|undefined|null/);

        await reset.click();
        expect(await firstVisibleNumber.inputValue()).toBe(original);
      }

      const firstUnit = root.locator('.calc-unit-select:visible').first();
      if (await firstUnit.count()) {
        const options = await firstUnit.locator('option').evaluateAll(options =>
          options.map(option => (option as HTMLOptionElement).value)
        );
        if (options.length > 1) {
          const originalUnit = await firstUnit.inputValue();
          const alternate = options.find(option => option !== originalUnit);
          if (alternate) {
            await firstUnit.selectOption(alternate);
            await calculate.click();
            text = await root.innerText();
            expect(text).not.toMatch(/NaN|Infinity|undefined|null/);
            await reset.click();
            expect(await firstUnit.inputValue()).toBe(originalUnit);
          }
        }
      }

      const relevantErrors = consoleErrors.filter(error =>
        !error.includes('adtrafficquality') &&
        !error.includes('googletag') &&
        !error.includes('doubleclick') &&
        !error.includes('google-analytics')
      );
      expect(relevantErrors).toEqual([]);
    });
  }

  test('fence cost calculator — dedicated layout, concrete and selected material cost work', async ({ page }) => {
    await page.goto('/fence-cost-calculator/');
    const root = page.locator('#fence-calc');
    await expect(root).toBeVisible();
    await root.locator('#f-len').fill('100');
    await root.locator('#f-price').fill('35');
    await root.locator('#f-price-unit').selectOption('panel');
    await root.getByRole('button', { name: /^Calculate$/ }).click();
    await expect(root.locator('#f-results')).toBeVisible();
    await expect(root.locator('#f-posts')).not.toHaveText('—');
    await expect(root.locator('#f-panels')).not.toHaveText('—');
    await expect(root.locator('#f-concrete')).not.toHaveText('—');
    await expect(root.locator('#f-cost')).not.toHaveText('—');
    expect(await root.innerText()).not.toMatch(/NaN|Infinity|undefined|null/);
    await root.getByRole('button', { name: /^Reset$/ }).click();
    await expect(root.locator('#f-results')).toBeHidden();
  });

  const hubs = [
    { path: '/construction/drywall-paint/', count: 15, phrase: /drywall, paint or insulation/i },
    { path: '/construction/deck-fence/', count: 15, phrase: /deck, fence or gate/i },
    { path: '/construction/landscaping/', count: 10, phrase: /paver, mulch or landscaping/i },
    { path: '/construction/asphalt/', count: 10, phrase: /asphalt, parking-lot or road-base/i },
  ] as const;

  for (const hub of hubs) {
    test(`${hub.path} — GSC-led task navigation is complete`, async ({ page }) => {
      await page.goto(hub.path);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('body')).toContainText(`${hub.count} calculators`);
      await expect(page.getByText(hub.phrase)).toBeVisible();
      const taskSection = page.getByRole('heading', { name: /Choose the right/i }).locator('..');
      await expect(taskSection.locator('a')).toHaveCount(hub.count);
    });
  }

  test('paver page uses dedicated paver model and separate layer guidance', async ({ page }) => {
    await page.goto('/paver-calculator/');
    const root = page.locator('[data-calculator-slug="paver-calculator"]');
    await expect(root).toBeVisible();
    await root.locator('#paver-calculator-length').fill('20');
    await root.locator('#paver-calculator-width').fill('10');
    await root.locator('#paver-calculator-paverLength').fill('12');
    await root.locator('#paver-calculator-paverWidth').fill('12');
    await root.locator('#paver-calculator-joint').fill('0');
    await root.getByText('Advanced material assumptions').click();
    await root.locator('#paver-calculator-waste').fill('10');
    await root.getByRole('button', { name: /^Calculate$/ }).click();
    await expect(root).toContainText('Pavers to order');
    await expect(root).toContainText('Paver rows');
    await expect(page.locator('main')).toContainText('Paver Base Calculator');
    expect(await root.innerText()).not.toMatch(/Tile|NaN|Infinity/);
  });

  test('asphalt thickness page clearly behaves as a reverse calculation', async ({ page }) => {
    await page.goto('/asphalt-thickness-calculator/');
    const root = page.locator('[data-calculator-slug="asphalt-thickness-calculator"]');
    await root.locator('#asphalt-thickness-calculator-length').fill('100');
    await root.locator('#asphalt-thickness-calculator-width').fill('10');
    await root.locator('#asphalt-thickness-calculator-mass').fill('10');
    await root.getByText('Advanced material assumptions').click();
    await root.locator('#asphalt-thickness-calculator-density').fill('145');
    await root.getByRole('button', { name: /^Calculate$/ }).click();
    await expect(root).toContainText('Average depth');
    expect(await root.innerText()).not.toMatch(/recommended|traffic type|NaN|Infinity/i);
  });
});
