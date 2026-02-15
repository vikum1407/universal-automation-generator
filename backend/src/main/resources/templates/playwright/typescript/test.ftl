import { test } from '@playwright/test';

test('Generated API Test', async () => {

  const url: string = "${metadata.url}";
  const method: string = "${metadata.method}";

  console.log("Testing API: " + url);
  console.log("Method: " + method);

});
