
import { test, expect } from '@playwright/test';

test('52ed7c58-29c7-4672-8948-21f02ef3f0cd: Negative test for GET /user/logout', async ({ request }) => {
  const response = await request.get('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
