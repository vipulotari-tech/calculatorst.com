import { expect, test } from '@playwright/test';

test.describe('Driveway Gravel Calculator', () => {
  test('driveway build dropdown controls the correct layers and clears stale results', async ({ page }) => {
    await page.goto('/driveway-gravel-calculator/');
    const root = page.locator('#driveway-calc');
    const build = root.locator('#d-build');

    await expect(build.locator('option')).toHaveCount(3);
    await expect(build).toHaveValue('two');
    await expect(root.locator('#d-build-help')).toContainText('Two-layer build');
    await expect(root.locator('#d-layer-subbase')).toBeHidden();
    await expect(root.locator('#d-layer-base')).toBeVisible();
    await expect(root.locator('#d-layer-surface')).toBeVisible();
    await expect(root.locator('#d-base-index')).toHaveText('Layer 1');
    await expect(root.locator('#d-surface-index')).toHaveText('Layer 2');
    await expect(root.locator('#d-base-allowance-summary')).toContainText('0% compaction allowance');
    await expect(root.locator('#d-base-allowance-summary')).toContainText('10% waste');

    await build.selectOption('surface');
    await expect(root.locator('#d-build-help')).toContainText('Surface refresh');
    await expect(root.locator('#d-layer-subbase')).toBeHidden();
    await expect(root.locator('#d-layer-base')).toBeHidden();
    await expect(root.locator('#d-layer-surface')).toBeVisible();
    await expect(root.locator('#d-surface-index')).toHaveText('Layer 1');

    await build.selectOption('three');
    await expect(root.locator('#d-build-help')).toContainText('Three-layer build');
    await expect(root.locator('#d-layer-subbase')).toBeVisible();
    await expect(root.locator('#d-layer-base')).toBeVisible();
    await expect(root.locator('#d-layer-surface')).toBeVisible();
    await expect(root.locator('#d-subbase-index')).toHaveText('Layer 1');
    await expect(root.locator('#d-base-index')).toHaveText('Layer 2');
    await expect(root.locator('#d-surface-index')).toHaveText('Layer 3');

    await root.getByRole('button', { name: 'Calculate driveway gravel' }).click();
    await expect(root.locator('#d-results')).toBeVisible();
    await expect(root.locator('#d-layer-results tr')).toHaveCount(3);
    expect(await root.locator('#d-results').innerText()).not.toMatch(/NaN|Infinity|undefined/);

    await build.selectOption('surface');
    await expect(root.locator('#d-results')).toBeHidden();
    await expect(root.locator('#d-recalc-note')).toBeVisible();
    await expect(root.locator('#d-recalc-note')).toContainText('Calculate again');
  });

  test('density presets cannot be accidentally reinterpreted with the wrong unit', async ({ page }) => {
    await page.goto('/driveway-gravel-calculator/');
    const root = page.locator('#driveway-calc');
    const material = root.locator('#d-base-material');
    const density = root.locator('#d-base-density');
    const densityUnit = root.locator('#d-base-density-unit');

    await expect(material).toHaveValue('1.50');
    await expect(density).toHaveValue('1.50');
    await expect(density).toHaveAttribute('readonly', '');
    await expect(densityUnit).toBeDisabled();
    await expect(densityUnit).toHaveValue('ton/yd3');

    await material.selectOption('custom');
    await expect(density).not.toHaveAttribute('readonly', '');
    await expect(densityUnit).toBeEnabled();
    await density.fill('100');
    await densityUnit.selectOption('lb/ft3');

    await material.selectOption('1.60');
    await expect(density).toHaveValue('1.60');
    await expect(density).toHaveAttribute('readonly', '');
    await expect(densityUnit).toBeDisabled();
    await expect(densityUnit).toHaveValue('ton/yd3');
  });

  test('separate material layers use separate truck-load rounding', async ({ page }) => {
    await page.goto('/driveway-gravel-calculator/');
    const root = page.locator('#driveway-calc');
    await root.locator('#d-build').selectOption('two');
    await root.locator('#d-len').fill('50');
    await root.locator('#d-wid').fill('12');
    await root.locator('#d-base-depth').fill('4');
    await root.locator('#d-surface-depth').fill('2');
    await root.locator('#d-truck-capacity').fill('20');

    await root.getByRole('button', { name: 'Calculate driveway gravel' }).click();

    await expect(root.locator('#d-total-tons')).toHaveText('17.93');
    await expect(root.locator('#d-loads')).toHaveText('2');
    await expect(root.locator('#d-layer-results tr')).toHaveCount(2);
    await expect(root.locator('#d-layer-results')).toContainText('1');
  });

  test('driveway build dropdown fits a 360px mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/driveway-gravel-calculator/');
    const build = page.locator('#d-build');
    await expect(build).toBeVisible();
    const box = await build.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(360);
    await build.selectOption('three');
    await expect(page.locator('#d-layer-subbase')).toBeVisible();
  });
});
