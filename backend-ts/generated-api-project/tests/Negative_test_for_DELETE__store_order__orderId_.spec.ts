
import { test, expect } from '@playwright/test';

test('f43ecc16-e058-4a7a-8ef4-2517e1aaf86e: Negative test for DELETE /store/order/{orderId}', async ({ request }) => {
  const response = await request.delete('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
