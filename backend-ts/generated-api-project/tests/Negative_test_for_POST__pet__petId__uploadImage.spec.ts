
import { test, expect } from '@playwright/test';

test('8ec48f23-f407-4e76-b5ea-e42ae1623b45: Negative test for POST /pet/{petId}/uploadImage', async ({ request }) => {
  const response = await request.post('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
