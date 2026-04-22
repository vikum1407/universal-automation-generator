import { test } from '@playwright/test';
import { ExecutionPage } from './pages/ExecutionPage';

test('Sidebar navigation: Timeline / Trends / Insights', async ({ page }) => {
  const execution = new ExecutionPage(page);

  await execution.open();

  await execution.sidebar.timeline();
  await execution.assertTimelineLoaded();

  await execution.sidebar.trends();
  await execution.assertTrendsLoaded();

  await execution.sidebar.insights();
  await execution.assertInsightsLoaded();
});
