
import { test, expect } from '@playwright/test';

test('08622bff-4557-4d8c-99ff-c7374d32b4bf: Negative test for DELETE /pet/{petId}', async ({ request }) => {
  const response = await request.delete('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
