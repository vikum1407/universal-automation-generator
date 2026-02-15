import { test } from '@playwright/test';

test('Generated API Test', async () => {

  const url = "${metadata.url}";
  const method = "${metadata.method}";

  console.log("Testing API: " + url);
  console.log("Method: " + method);

});
