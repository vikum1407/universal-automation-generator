import { test } from '@playwright/test';
import { RequirementsPage } from './pages/RequirementsPage';

test('Requirements page loads and shows at least one requirement', async ({ page }) => {
  const requirements = new RequirementsPage(page);

  await requirements.open();
  await requirements.assertLoaded();
});
