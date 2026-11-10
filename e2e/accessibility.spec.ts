import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('MedFlow — Automated WCAG Accessibility Audits', () => {
  test('Overview page should pass accessibility scan', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.overview-title');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Procedure Worklist page should pass accessibility scan', async ({ page }) => {
    await page.goto('/procedures');
    await page.waitForSelector('.page-title');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Operating Room Schedule should pass accessibility scan', async ({ page }) => {
    await page.goto('/schedule');
    await page.waitForSelector('.page-title');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Instruments Tracking page should pass accessibility scan', async ({ page }) => {
    await page.goto('/instruments');
    await page.waitForSelector('.page-title');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Instrument detail page should pass accessibility scan', async ({ page }) => {
    await page.goto('/instruments/ins-001');
    await page.waitForSelector('.header-card .title');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Activity log should pass accessibility scan', async ({ page }) => {
    await page.goto('/activity');
    await page.waitForSelector('.page-title');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Overview charts should pass accessibility scan once rendered', async ({ page }) => {
    await page.goto('/overview');
    await page.locator('app-bar-chart').first().scrollIntoViewIfNeeded();
    await expect(page.locator('app-bar-chart rect.bar').first()).toBeAttached();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Command palette should pass accessibility scan', async ({ page }) => {
    await page.goto('/overview');
    await page.waitForSelector('.overview-title');
    await page.keyboard.press('Control+K');
    await page.getByRole('dialog', { name: 'Command palette' }).waitFor();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('App info drawer should pass accessibility scan', async ({ page }) => {
    await page.goto('/overview');
    await page.waitForSelector('.overview-title');
    await page.getByRole('button', { name: 'About MedFlow Application' }).click();
    await page.locator('.app-info-dialog[open]').waitFor();

    const hasHorizontalOverflow = await page.evaluate(() => {
      const el = document.querySelector('.drawer-container');
      return el ? el.scrollWidth > el.clientWidth : false;
    });
    expect(hasHorizontalOverflow).toBe(false);

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

