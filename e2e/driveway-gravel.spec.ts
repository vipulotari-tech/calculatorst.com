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

  test('driveway build dropdown stays full-width and usable at 360px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/driveway-gravel-calculator/');
    const field = page.locator('#d-build-field');
    const build = page.locator('#d-build');
    const help = page.locator('#d-build-help');

    await expect(field).toBeVisible();
    await expect(build).toBeVisible();
    await expect(build).toHaveValue('two');

    const fieldBox = await field.boundingBox();
    const buildBox = await build.boundingBox();
    const helpBox = await help.boundingBox();

    expect(fieldBox).not.toBeNull();
    expect(buildBox).not.toBeNull();
    expect(helpBox).not.toBeNull();

    // A collapsed 80–120px select technically does not overflow, so require
    // a genuinely usable mobile width as well.
    expect(buildBox!.width).toBeGreaterThan(250);
    expect(helpBox!.width).toBeGreaterThan(250);
    expect(Math.abs(buildBox!.width - fieldBox!.width)).toBeLessThan(2);
    expect(buildBox!.x).toBeGreaterThanOrEqual(0);
    expect(buildBox!.x + buildBox!.width).toBeLessThanOrEqual(360);

    await build.selectOption('three');
    await expect(build).toHaveValue('three');
    await expect(page.locator('#d-layer-subbase')).toBeVisible();
  });
  test('L-shape and multi-section footprints calculate real combined area and update the live preview', async ({ page }) => {
    await page.goto('/driveway-gravel-calculator/');
    const root = page.locator('#driveway-calc');

    await root.locator('#d-layout').selectOption('lshape');
    await expect(root.locator('#d-lshape-fields')).toBeVisible();
    await root.locator('#d-len').fill('50');
    await root.locator('#d-wid').fill('20');
    await root.locator('#d-cut-len').fill('10');
    await root.locator('#d-cut-wid').fill('5');
    await root.locator('#d-build').selectOption('surface');
    await root.locator('#d-surface-depth').fill('3');
    await root.locator('#d-surface-waste').fill('0');
    await expect(root.locator('#d-preview-footprint')).toContainText('L-shape');

    await root.getByRole('button', { name: 'Calculate driveway gravel' }).click();
    await expect(root.locator('#d-area')).toHaveText('950');

    await root.locator('#d-layout').selectOption('multi');
    await expect(root.locator('#d-multi-fields')).toBeVisible();
    await root.locator('#d-s2-len').fill('10');
    await root.locator('#d-s2-wid').fill('10');
    await root.locator('#d-s3-len').fill('20');
    await root.locator('#d-s3-wid').fill('5');
    await root.getByRole('button', { name: 'Calculate driveway gravel' }).click();
    await expect(root.locator('#d-area')).toHaveText('1,200');
    await expect(root.locator('#d-preview-footprint')).toContainText('Multiple sections');
  });

  test('supplier rounding, metric results and bagged surface mode remain distinct', async ({ page }) => {
    await page.goto('/driveway-gravel-calculator/');
    const root = page.locator('#driveway-calc');

    await root.locator('#d-build').selectOption('surface');
    await root.locator('#d-len').fill('100');
    await root.locator('#d-wid').fill('10');
    await root.locator('#d-surface-depth').fill('3');
    await root.locator('#d-surface-waste').fill('0');
    await root.locator('#d-surface-increment').fill('2');
    await root.locator('#d-surface-minimum').fill('15');
    await root.getByRole('button', { name: 'Calculate driveway gravel' }).click();

    await expect(root.locator('#d-total-tons')).toHaveText('15');
    await expect(root.locator('#d-rounding-overage')).not.toHaveText('0');
    await expect(root.locator('#d-layer-results')).toContainText('supplier rounding');

    await root.locator('#d-output-system').selectOption('metric');
    await expect(root.locator('#d-primary-weight-unit')).toHaveText('tonnes');
    await expect(root.locator('#d-primary-volume-unit')).toHaveText('m³');
    await expect(root.locator('#d-th-installed')).toHaveText('INSTALLED m³');

    await root.locator('#d-output-system').selectOption('us');
    await root.locator('#d-len').fill('10');
    await root.locator('#d-wid').fill('10');
    await root.locator('#d-surface-depth').fill('1');
    await root.locator('#d-surface-increment').fill('0');
    await root.locator('#d-surface-minimum').fill('0');
    await root.locator('#d-surface-supply').selectOption('bags');
    await expect(root.locator('#d-surface-bag-weight-field')).toBeVisible();
    await root.locator('#d-surface-bag-weight').fill('50');
    await root.locator('#d-surface-bag-price').fill('6');
    await root.getByRole('button', { name: 'Calculate driveway gravel' }).click();

    await expect(root.locator('#d-loads')).toHaveText('0');
    await expect(root.locator('#d-layer-results')).toContainText('18 bags');
    await expect(root.locator('#d-bom-results')).toContainText('18 × 50 lb bags');
  });

  test('geotextile and edging flow into the supplier BOM', async ({ page }) => {
    await page.goto('/driveway-gravel-calculator/');
    const root = page.locator('#driveway-calc');

    await root.locator('#d-build').selectOption('surface');
    await root.locator('#d-len').fill('50');
    await root.locator('#d-wid').fill('12');
    await root.locator('#d-geo-enabled').check();
    await root.locator('#d-geo-overlap').fill('10');
    await root.locator('#d-geo-roll-width').fill('12');
    await root.locator('#d-geo-roll-length').fill('50');
    await root.locator('#d-geo-price').fill('100');
    await root.locator('#d-edging-mode').selectOption('sides');
    await root.locator('#d-edging-price').fill('5');

    await root.getByRole('button', { name: 'Calculate driveway gravel' }).click();

    await expect(root.locator('#d-geo-result-card')).toBeVisible();
    await expect(root.locator('#d-geo-result')).toContainText('660');
    await expect(root.locator('#d-geo-result')).toContainText('2 rolls');
    await expect(root.locator('#d-edging-result-card')).toBeVisible();
    await expect(root.locator('#d-edging-result')).toContainText('100');
    await expect(root.locator('#d-bom-results')).toContainText('Geotextile fabric');
    await expect(root.locator('#d-bom-results')).toContainText('Driveway edging');
  });

  test('share link restores project state and report/BOM downloads are available', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/driveway-gravel-calculator/');
    const root = page.locator('#driveway-calc');

    await root.locator('#d-len').fill('77');
    await root.locator('#d-layout').selectOption('lshape');
    await root.locator('#d-cut-len').fill('7');
    await root.locator('#d-cut-wid').fill('4');
    await root.getByRole('button', { name: 'Calculate driveway gravel' }).click();

    await root.locator('#d-share').click();
    const shared = await page.evaluate(() => navigator.clipboard.readText());
    expect(shared).toContain('dg=');

    await page.goto(shared);
    await expect(page.locator('#d-len')).toHaveValue('77');
    await expect(page.locator('#d-layout')).toHaveValue('lshape');
    await expect(page.locator('#d-cut-len')).toHaveValue('7');

    await page.getByRole('button', { name: 'Calculate driveway gravel' }).click();
    const reportPromise = page.waitForEvent('download');
    await page.locator('#d-download-report').click();
    const report = await reportPromise;
    expect(report.suggestedFilename()).toBe('driveway-gravel-order-plan.txt');

    const bomPromise = page.waitForEvent('download');
    await page.locator('#d-download-bom').click();
    const bom = await bomPromise;
    expect(bom.suggestedFilename()).toBe('driveway-gravel-bom.csv');
  });

});
