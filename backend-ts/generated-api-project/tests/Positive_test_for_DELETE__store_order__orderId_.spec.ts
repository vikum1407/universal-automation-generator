
import { test, expect } from '@playwright/test';

test('bd592f3d-6bb5-42f3-8b1c-916783a0e844: Positive test for DELETE /store/order/{orderId}', async ({ request }) => {
  const response = await request.delete('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
