
import { test, expect } from '@playwright/test';

test('880095cf-487d-4133-96b7-c82c860c9f88: Negative test for GET /pet/findByTags', async ({ request }) => {
  const response = await request.get('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
