import { test } from '@playwright/test';
import { TrendsPage } from './pages/TrendsPage';

test('Trends page loads', async ({ page }) => {
  const trends = new TrendsPage(page);

  await trends.open();
  await trends.assertLoaded();
});
