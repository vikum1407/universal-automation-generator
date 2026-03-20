
import { test, expect } from '@playwright/test';

test('a2392003-7a2b-4aec-a5c6-57b84c156966: Positive test for DELETE /user/{username}', async ({ request }) => {
  const response = await request.delete('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
