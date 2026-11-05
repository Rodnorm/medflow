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
});

