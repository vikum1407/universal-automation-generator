
import { test, expect } from '@playwright/test';

test('05350d74-0870-4a75-b18d-5233e1e590aa: Negative test for POST /user/createWithArray', async ({ request }) => {
  const response = await request.post('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
