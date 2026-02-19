import { apiClient } from "../support/apiClient";
import config from "../config/${environment}.json";

describe("${testName}", () => {

  it("runs the API test", () => {

    const url: string = config.baseUrl + "${url}";
    const method: string = "${method}";
    const expectedStatus: number = ${expectedStatus};
    const expectedJson: any = ${expectedResponseJson};

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

    // AUTHENTICATION LOGIC
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
      const basicAuth = btoa("${basicUsername}:${basicPassword}");
      headers["Authorization"] = `Basic ${basicAuth}`;
    <#elseif authType == "CUSTOM_HEADER">
      headers["${customHeaderName}"] = "${customHeaderValue}";
    </#if>

    // Query params
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

    apiClient
      .request(method, url, headers, queryParams, requestBody)
      .then((response) => {
        expect(response.status).to.eq(expectedStatus);
        expect(JSON.stringify(response.body)).to.contain(
          JSON.stringify(expectedJson).replace(/[{}]/g, "")
        );
      });

  });

});
