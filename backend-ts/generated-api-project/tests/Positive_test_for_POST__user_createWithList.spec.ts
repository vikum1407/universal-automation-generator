
import { test, expect } from '@playwright/test';

test('4228837e-7451-4005-9a26-e649c41aac2f: Positive test for POST /user/createWithList', async ({ request }) => {
  const response = await request.post('undefined', {
    data: undefined
  });

  expect(response.status()).toBe(undefined);

  const json = await response.json().catch(() => null);
  expect(json).not.toBeNull();
});
