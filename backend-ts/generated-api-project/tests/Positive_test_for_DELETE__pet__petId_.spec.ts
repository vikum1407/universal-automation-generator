
import { test, expect } from '@playwright/test';

test('fa5785ea-69f5-4fdd-aa1b-52c8e6ee482f: Positive test for DELETE /pet/{petId}', async ({ request }) => {
  const response = await request.delete('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
