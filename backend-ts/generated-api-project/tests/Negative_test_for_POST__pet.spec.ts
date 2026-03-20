
import { test, expect } from '@playwright/test';

test('80119b96-5d88-4344-9fb0-0788a9b44517: Negative test for POST /pet', async ({ request }) => {
  const response = await request.post('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
