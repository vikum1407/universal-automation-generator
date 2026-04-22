import { test } from '@playwright/test';
import { TimelinePage } from './pages/TimelinePage';

test('Timeline page loads and shows journey list', async ({ page }) => {
  const timeline = new TimelinePage(page);

  await timeline.open();
  await timeline.assertLoaded();
  await timeline.assertJourneyListVisible();
});

test('Timeline → open first journey → run details visible', async ({ page }) => {
  const timeline = new TimelinePage(page);

  await timeline.open();
  await timeline.assertJourneyListVisible();
  await timeline.clickFirstJourney();
  await timeline.assertRunDetailsVisible();
});
