import { test, expect } from '@playwright/test';
import config from "../config/${environment}.json";

test('${testName}', async ({ request }) => {

  const url = config.baseUrl + "${url}";
  const method = "${method}";
  const expectedStatus = ${expectedStatus};
  const expectedJson = ${expectedResponseJson};

  // ---------------------------
  // Build headers
  // ---------------------------
  let headers = {};

  // Config-level headers
  if (config.headers) {
    headers = { ...headers, ...config.headers };
  }

  // Metadata headers
  <#if headers??>
    <#list headers?keys as key>
      headers["${key}"] = "${headers[key]}";
    </#list>
  </#if>

  // ---------------------------
  // Authentication
  // ---------------------------
  <#if authType == "NONE">
    // No authentication
  <#elseif authType == "BEARER">
    if (config.authToken) {
      headers["Authorization"] = `Bearer ${config.authToken}`;
    }
  <#elseif authType == "API_KEY_HEADER">
    headers["${apiKeyName}"] = "${apiKeyValue}";
  <#elseif authType == "API_KEY_QUERY">
    // handled in query params
  <#elseif authType == "BASIC">
    const basicAuth = Buffer.from("${basicUsername}:${basicPassword}").toString("base64");
    headers["Authorization"] = `Basic ${basicAuth}`;
  <#elseif authType == "CUSTOM_HEADER">
    headers["${customHeaderName}"] = "${customHeaderValue}";
  </#if>

  // ---------------------------
  // Build query params
  // ---------------------------
  let queryParams = {};

  <#if authType == "API_KEY_QUERY">
    queryParams["${apiKeyQueryName}"] = "${apiKeyQueryValue}";
  </#if>

  <#if queryParams??>
    <#list queryParams?keys as key>
      queryParams["${key}"] = "${queryParams[key]}";
    </#list>
  </#if>

  const requestBody = ${requestJson};

  // ---------------------------
  // Execute request
  // ---------------------------
  const response = await request[method.toLowerCase()](url, {
    headers,
    params: queryParams,
    data: requestBody
  });

  // ---------------------------
  // Assertions
  // ---------------------------
  expect(response.status()).toBe(expectedStatus);

  const responseText = await response.text();
  expect(responseText).toContain(
    JSON.stringify(expectedJson).replace(/[{}]/g, "")
  );

});
