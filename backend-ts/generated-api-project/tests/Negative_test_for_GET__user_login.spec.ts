
import { test, expect } from '@playwright/test';

test('88a954bb-a6da-4382-b0eb-c9584b0264bc: Negative test for GET /user/login', async ({ request }) => {
  const response = await request.get('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
