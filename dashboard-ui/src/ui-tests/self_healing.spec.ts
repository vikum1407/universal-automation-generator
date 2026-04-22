import { test } from '@playwright/test';
import { SelfHealingPage } from './pages/SelfHealingPage';

test('Self-Healing page loads and shows suggestions', async ({ page }) => {
  const selfHealing = new SelfHealingPage(page);

  await selfHealing.open();
  await selfHealing.assertLoaded();
});
