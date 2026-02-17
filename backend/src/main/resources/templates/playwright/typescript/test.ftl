import { test, expect } from '@playwright/test';

test('Generated API Test', async ({ request }) => {

  const response = await request.${metadata.method?lower_case}("${metadata.url}", {
    headers: ${headers?json_string},
    params: ${queryParams?json_string},
    data: ${requestJson?json_string}
  });

  expect(response.status()).toBe(${expectedStatus});
  console.log(await response.text());
});
