
import { test, expect } from '@playwright/test';

test('726490c5-8703-41c8-835b-27baa3c94ca3: Positive test for PUT /pet', async ({ request }) => {
  const response = await request.put('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
