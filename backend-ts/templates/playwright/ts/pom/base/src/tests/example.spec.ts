import { test, expect } from '../fixtures';

test.describe('Home page', () => {

  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/.+/);
  });

  test('should have visible content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

});
