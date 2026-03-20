
import { test, expect } from '@playwright/test';

test('451e6469-d99c-47a5-87ca-4ed904f33aff: Negative test for POST /user/createWithList', async ({ request }) => {
  const response = await request.post('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
