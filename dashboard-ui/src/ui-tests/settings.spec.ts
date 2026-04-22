import { test } from '@playwright/test';
import { SettingsPage } from './pages/SettingsPage';

test('Settings page shows all feature blocks', async ({ page }) => {
  const settings = new SettingsPage(page);

  await settings.open('46207b9e-d174-4edd-a178-1c82107db1aa');
  await settings.assertSettingsVisible();
});
