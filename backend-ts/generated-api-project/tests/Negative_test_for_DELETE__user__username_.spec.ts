
import { test, expect } from '@playwright/test';

test('4a7baaf7-8b03-4470-b820-4bd8df03da43: Negative test for DELETE /user/{username}', async ({ request }) => {
  const response = await request.delete('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
