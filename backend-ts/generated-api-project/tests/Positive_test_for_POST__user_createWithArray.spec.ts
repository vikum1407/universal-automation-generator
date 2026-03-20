
import { test, expect } from '@playwright/test';

test('3db8b54e-ef9e-4444-b2db-0df8d2f0aac8: Positive test for POST /user/createWithArray', async ({ request }) => {
  const response = await request.post('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
