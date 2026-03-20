
import { test, expect } from '@playwright/test';

test('8e508a02-aa29-43a6-81aa-77fd63b19c0b: Negative test for POST /user', async ({ request }) => {
  const response = await request.post('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
