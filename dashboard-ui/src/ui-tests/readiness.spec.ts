import { test } from '@playwright/test';
import { ReadinessPage } from './pages/ReadinessPage';

test('Readiness page loads', async ({ page }) => {
  const readiness = new ReadinessPage(page);

  await readiness.open();
  await readiness.assertLoaded();
});
