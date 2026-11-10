import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});

test.describe('MedFlow — Mobile Experience & Responsive Navigation', () => {
  test('mobile header renders hamburger trigger and hides desktop navigation', async ({ page }) => {
    await page.goto('/overview');
    await expect(page.locator('.overview-title')).toBeVisible();

    const hamburger = page.getByRole('button', { name: 'Open navigation menu' });
    await expect(hamburger).toBeVisible();

    const desktopNav = page.locator('nav.app-nav');
    await expect(desktopNav).toBeHidden();
  });

  test('mobile navigation drawer navigates across all core routes and closes on link click', async ({
    page,
  }) => {
    await page.goto('/overview');

    // Open drawer and navigate to Procedures
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const drawer = page.locator('.mobile-nav-dialog[open]');
    await expect(drawer).toBeVisible();

    await drawer.getByRole('link', { name: 'Procedure Worklist' }).click();
    await expect(page).toHaveURL(/.*procedures/);
    await expect(page.locator('.mobile-nav-dialog')).toBeHidden();

    // Open drawer and navigate to Instruments
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await expect(drawer).toBeVisible();
    await drawer.getByRole('link', { name: 'Sterile Instruments' }).click();
    await expect(page).toHaveURL(/.*instruments/);
    await expect(page.locator('.mobile-nav-dialog')).toBeHidden();

    // Open drawer and navigate to Schedule
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await expect(drawer).toBeVisible();
    await drawer.getByRole('link', { name: 'OR Daily Schedule' }).click();
    await expect(page).toHaveURL(/.*schedule/);
    await expect(page.locator('.mobile-nav-dialog')).toBeHidden();

    // Open drawer and navigate to Activity
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await expect(drawer).toBeVisible();
    await drawer.getByRole('link', { name: 'Clinical Activity Log' }).click();
    await expect(page).toHaveURL(/.*activity/);
    await expect(page.locator('.mobile-nav-dialog')).toBeHidden();
  });

  test('mobile drawer triggers command palette search', async ({ page }) => {
    await page.goto('/overview');
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const drawer = page.locator('.mobile-nav-dialog[open]');
    await expect(drawer).toBeVisible();

    await drawer.getByRole('button', { name: 'Search or jump to route' }).click();
    const palette = page.getByRole('dialog', { name: 'Command palette' });
    await expect(palette).toBeVisible();

    await palette.getByRole('combobox').fill('schedule');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/.*schedule/);
  });

  test('mobile drawer closes with Escape key and close button', async ({ page }) => {
    await page.goto('/overview');
    const menuBtn = page.getByRole('button', { name: 'Open navigation menu' });

    // Open and close via button
    await menuBtn.click();
    await expect(page.locator('.mobile-nav-dialog[open]')).toBeVisible();
    await page.getByRole('button', { name: 'Close navigation menu' }).click();
    await expect(page.locator('.mobile-nav-dialog')).toBeHidden();

    // Open and close via Escape
    await menuBtn.click();
    await expect(page.locator('.mobile-nav-dialog[open]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.mobile-nav-dialog')).toBeHidden();
  });

  test('no horizontal document overflow occurs across pages on mobile', async ({ page }) => {
    const routes = ['/overview', '/procedures', '/instruments', '/schedule', '/activity'];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const hasDocOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(
        hasDocOverflow,
        `Expected route "${route}" not to have horizontal document overflow (window: ${390}px)`,
      ).toBe(false);
    }
  });

  test('overview recent procedures table fits within card without internal horizontal overflow on mobile', async ({
    page,
  }) => {
    await page.goto('/overview');
    await page.waitForSelector('.recent-table');

    const isInternalScrollable = await page.evaluate(() => {
      const container = document.querySelector('.recent-card-content');
      return container ? container.scrollWidth > container.clientWidth : false;
    });

    expect(isInternalScrollable).toBe(false);
  });

  test('mobile navigation drawer passes axe-core accessibility audit', async ({ page }) => {
    await page.goto('/overview');
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await page.locator('.mobile-nav-dialog[open]').waitFor();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
