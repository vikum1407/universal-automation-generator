
import { test, expect } from '@playwright/test';

test('2a6f1d86-9cae-4fd1-b0fc-a2e357bff783: Negative test for POST /store/order', async ({ request }) => {
  const response = await request.post('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
