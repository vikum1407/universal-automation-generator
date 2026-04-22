import { test } from '@playwright/test';
import { HeatmapPage } from './pages/HeatmapPage';

test('Heatmap page loads', async ({ page }) => {
  const heatmap = new HeatmapPage(page);

  await heatmap.open();
  await heatmap.assertLoaded();
});
