
import { test, expect } from '@playwright/test';

test('cc882906-53c6-4a99-a720-55dccddccd6e: Positive test for GET /user/logout', async ({ request }) => {
  const response = await request.get('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
