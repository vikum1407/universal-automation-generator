import { test } from '@playwright/test';
import { StoryPage } from './pages/StoryPage';

test('Story page loads', async ({ page }) => {
  const story = new StoryPage(page);

  await story.open();
  await story.assertLoaded();
});
