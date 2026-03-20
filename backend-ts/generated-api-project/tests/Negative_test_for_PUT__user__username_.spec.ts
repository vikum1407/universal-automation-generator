
import { test, expect } from '@playwright/test';

test('ca3042b0-d2d6-4eea-b022-fb078f61ca47: Negative test for PUT /user/{username}', async ({ request }) => {
  const response = await request.put('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
