
import { test, expect } from '@playwright/test';

test('abe96388-a79b-4ea0-86a9-8e99e4f17800: Negative test for GET /store/order/{orderId}', async ({ request }) => {
  const response = await request.get('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
