import { test, expect } from '@playwright/test';

test.describe('MedFlow — Operational Dashboard Main Journey', () => {
  test('should complete the full operational flow across Overview, Procedures, and Status Dialog', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*overview/);

    await expect(page.locator('.overview-title')).toContainText('Operations Overview');
    await expect(page.locator('.demo-badge')).toContainText('SYNTHETIC DATA');

    const metricCards = page.locator('app-metric-card');
    await expect(metricCards).toHaveCount(5);

    await page.getByRole('link', { name: 'Procedures' }).click();
    await expect(page).toHaveURL(/.*procedures/);
    await expect(page.locator('.page-title')).toContainText('Procedure Worklist');

    const searchInput = page.getByPlaceholder('e.g. PRC-2026 or Laparoscopy');
    await searchInput.fill('PRC-2026-001');

    await expect(page).toHaveURL(/.*search=PRC-2026-001/);

    const rows = page.locator('table.procedures-table tbody tr');
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText('Diagnostic Laparoscopy');

    await page.getByRole('button', { name: 'Manage' }).click();

    const dialog = page.locator('app-procedure-detail-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('h2')).toContainText('PRC-2026-001');

    const advanceButton = dialog.getByRole('button', { name: /Advance to in-progress/i });
    await expect(advanceButton).toBeVisible();
    await advanceButton.click();

    await expect(dialog).not.toBeVisible();

    await searchInput.clear();

    await page.getByRole('link', { name: 'Instruments' }).click();
    await expect(page).toHaveURL(/.*instruments/);
    await expect(page.locator('.page-title')).toContainText('Instrument Tracking');

    const instrumentRows = page.locator('table.instruments-table tbody tr');
    await expect(instrumentRows.first()).toBeVisible();

    await page.getByRole('link', { name: 'Overview' }).click();
    await expect(page).toHaveURL(/.*overview/);
    await expect(page.locator('.overview-title')).toBeVisible();
  });
});
