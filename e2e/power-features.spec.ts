import { test, expect, Page } from '@playwright/test';

async function pauseLiveFeed(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Live feed active/i }).click();
  await expect(page.getByRole('button', { name: /Live feed paused/i })).toBeVisible();
}

test.describe('MedFlow — Power features', () => {
  test('command palette navigates with the keyboard', async ({ page }) => {
    await page.goto('/overview');
    await expect(page.locator('.overview-title')).toBeVisible();

    await page.keyboard.press('Control+K');
    const palette = page.getByRole('dialog', { name: 'Command palette' });
    await expect(palette).toBeVisible();

    const field = palette.getByRole('combobox');
    await expect(field).toBeFocused();
    await field.fill('schedule');
    await expect(palette.getByRole('option').first()).toContainText('Schedule');
    await page.keyboard.press('Enter');

    await expect(palette).toBeHidden();
    await expect(page).toHaveURL(/.*schedule/);
    await expect(page.locator('.page-title')).toContainText('Operating Room Schedule');
  });

  test('command palette finds a procedure by code', async ({ page }) => {
    await page.goto('/overview');
    await page.getByRole('button', { name: 'Open command palette' }).click();
    const palette = page.getByRole('dialog', { name: 'Command palette' });
    await palette.getByRole('combobox').fill('PRC-2026-003');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/.*procedures\/prc-003/);
  });

  test('overview renders capacity and throughput charts with accessible data', async ({ page }) => {
    await page.goto('/overview');
    const charts = page.locator('app-bar-chart');
    await charts.first().scrollIntoViewIfNeeded();
    await expect(charts).toHaveCount(2);
    await expect(charts.first().locator('rect.bar')).toHaveCount(10);
    await expect(charts.nth(1).locator('rect.bar')).toHaveCount(24);
    await expect(charts.first().locator('table.sr-only tbody tr')).toHaveCount(10);
  });

  test('instrument detail page shows a set and applies a transition', async ({ page }) => {
    await page.goto('/instruments');
    await page.locator('table.instruments-table .code-link').first().click();
    await expect(page).toHaveURL(/.*instruments\/ins-\d+/);
    await expect(page.locator('.header-card .title')).toBeVisible();

    await page.goto('/instruments/ins-001');
    const header = page.locator('.header-card');
    await expect(header).toContainText('INS-LAP-01');
    await expect(header.locator('app-status-badge')).toContainText('AVAILABLE');

    await page.getByRole('button', { name: 'Mark as reserved' }).click();
    await expect(header.locator('app-status-badge')).toContainText('RESERVED');
  });

  test('worklist supports bulk start with confirmation', async ({ page }) => {
    await page.goto('/procedures?status=planned');
    await pauseLiveFeed(page);

    const rangeLabel = page.locator('.mat-mdc-paginator-range-label');
    const totalBefore = Number((await rangeLabel.innerText()).match(/of (\d+)/)?.[1]);
    expect(totalBefore).toBeGreaterThan(2);

    const checkboxes = page.getByRole('checkbox', { name: /^Select PRC/ });
    await checkboxes.nth(0).check();
    await checkboxes.nth(1).check();

    const bulkBar = page.getByRole('region', { name: 'Bulk actions' });
    await expect(bulkBar).toContainText('2 selected');
    await bulkBar.getByRole('button', { name: /^Start \(2\)/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Start 2 procedures?');
    await dialog.getByRole('button', { name: 'Start 2' }).click();

    await expect(bulkBar).toBeHidden();
    await expect(rangeLabel).toContainText(`of ${totalBefore - 2}`);
  });

  test('worklist columns, density and saved views', async ({ page }) => {
    await page.goto('/procedures');
    await expect(page.locator('th', { hasText: 'Theater' })).toBeVisible();

    await page.getByRole('button', { name: 'Choose visible columns' }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Theater' }).click();
    await page.keyboard.press('Escape');
    await expect(page.locator('th', { hasText: 'Theater' })).toHaveCount(0);

    await page.getByRole('radio', { name: 'Compact density' }).click();
    await expect(page.locator('.table-container')).toHaveClass(/density-compact/);

    await page.getByRole('combobox', { name: 'Status' }).click();
    await page.getByRole('option', { name: 'Planned' }).click();
    await page.getByRole('button', { name: 'Save current filters' }).click();
    await page.getByLabel('View name').fill('Planned cases');
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    await page.getByRole('button', { name: 'Clear filters' }).first().click();
    await page.getByRole('button', { name: 'Planned cases', exact: true }).click();
    await expect(page).toHaveURL(/status=planned/);

    await page.reload();
    await expect(page.getByRole('button', { name: 'Planned cases', exact: true })).toBeVisible();
    await expect(page.locator('th', { hasText: 'Theater' })).toHaveCount(0);
    await expect(page.locator('.table-container')).toHaveClass(/density-compact/);
  });

  test('schedule block can be rescheduled from the keyboard and appears in the activity log', async ({
    page,
  }) => {
    await page.goto('/schedule');
    await pauseLiveFeed(page);

    const block = page.locator('button.schedule-block[aria-label^="PRC-2026-001,"]');
    await expect(block).toBeVisible();
    const before = await block.locator('.block-time').innerText();

    await block.focus();
    await page.keyboard.press('Shift+ArrowRight');

    await expect(block.locator('.block-time')).not.toHaveText(before);
    await expect(page.locator('p.sr-only[aria-live="polite"]')).toContainText('PRC-2026-001 moved to OR-1');

    await page.locator('nav.app-nav').getByRole('link', { name: /Activity/i }).click();
    await expect(page).toHaveURL(/.*activity/);
    const latest = page.locator('.feed-item').first();
    await expect(latest).toContainText('Procedure Rescheduled');
    await expect(latest).toContainText('PRC-2026-001');
  });

  test('api simulation panel surfaces recoverable errors', async ({ page }) => {
    await page.goto('/overview');
    await expect(page.locator('.overview-title')).toBeVisible();

    await page.getByRole('button', { name: 'API simulation controls' }).click();
    const failureSwitch = page.getByRole('switch', { name: 'Force API failures' });
    await failureSwitch.click();
    await expect(failureSwitch).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('Escape');
    await expect(page.locator('.simulation-menu-panel')).toBeHidden();

    await page.locator('nav.app-nav').getByRole('link', { name: /Procedures/i }).click();
    await expect(page.getByRole('alert')).toContainText('Simulated network failure');

    await page.getByRole('button', { name: 'API simulation controls' }).click();
    const releaseSwitch = page.getByRole('switch', { name: 'Force API failures' });
    await releaseSwitch.click();
    await expect(releaseSwitch).toHaveAttribute('aria-checked', 'false');
    await page.keyboard.press('Escape');
    await expect(page.locator('.simulation-menu-panel')).toBeHidden();

    await page.getByRole('button', { name: 'Retry' }).click();
    await expect(page.locator('table.procedures-table tbody tr').first()).toBeVisible();
  });
});
