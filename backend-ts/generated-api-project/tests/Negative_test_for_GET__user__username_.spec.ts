
import { test, expect } from '@playwright/test';

test('9d83d835-13d9-4a1a-ad59-36d0ef775366: Negative test for GET /user/{username}', async ({ request }) => {
  const response = await request.get('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
