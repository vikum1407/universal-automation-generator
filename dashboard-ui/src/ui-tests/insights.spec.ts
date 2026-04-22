import { test } from '@playwright/test';
import { InsightsPage } from './pages/InsightsPage';

test('Insights page loads and shows metrics + highlights', async ({ page }) => {
  const insights = new InsightsPage(page);

  await insights.open();
  await insights.assertLoaded();
  await insights.assertMetricsVisible();
  await insights.assertHighlightsVisible();
});
