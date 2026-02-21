import { test, expect, APIRequestContext } from '@playwright/test';
import config from "../config/${environment}.json";

test('${testName}', async ({ request }) => {

  const url: string = config.baseUrl + "${url}";
  const method: string = "${method}";
  const expectedStatus: number = ${expectedStatus};
  const expectedJson: any = ${expectedResponseJson};

  // ---------------------------
  // Build headers
  // ---------------------------
  let headers: Record<string, string> = {};

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
    // no authentication
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
  let queryParams: Record<string, string> = {};

  <#if authType == "API_KEY_QUERY">
    queryParams["${apiKeyQueryName}"] = "${apiKeyQueryValue}";
  </#if>

  <#if queryParams??>
    <#list queryParams?keys as key>
      queryParams["${key}"] = "${queryParams[key]}";
    </#list>
  </#if>

  const requestBody: any = ${requestJson};

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
