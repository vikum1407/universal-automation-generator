
import { test, expect } from '@playwright/test';

test('0cfc007f-7b04-4b19-939c-4878660bb967: Positive test for GET /store/order/{orderId}', async ({ request }) => {
  const response = await request.get('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
