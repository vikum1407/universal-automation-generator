package tests;

import client.ApiClient;
import client.ApiResponse;
import config.Config;
import config.ConfigLoader;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.Map;
import java.util.HashMap;

public class ${metadata.testName} {

    @Test
    public void runTest() throws Exception {

        Config config = ConfigLoader.load("${environment}");
        ApiClient client = new ApiClient(config.getBaseUrl());

        Map<String, String> headers = new HashMap<>();

        // Config-level headers
        if (config.getHeaders() != null) {
            headers.putAll(config.getHeaders());
        }

        // Metadata headers
        <#if metadata.headers?has_content>
            <#list metadata.headers?keys as key>
                headers.put("${key}", "${metadata.headers[key]}");
            </#list>
        </#if>

        // AUTHENTICATION LOGIC
        <#if metadata.authType == "BEARER">
            if (config.getAuthToken() != null && !config.getAuthToken().isEmpty()) {
                headers.put("Authorization", "Bearer " + config.getAuthToken());
            }
        <#elseif metadata.authType == "API_KEY_HEADER">
            headers.put("${metadata.apiKeyName}", "${metadata.apiKeyValue}");
        <#elseif metadata.authType == "API_KEY_QUERY">
            // handled in query params
        <#elseif metadata.authType == "BASIC">
            String basicAuth = java.util.Base64.getEncoder()
                .encodeToString(("${metadata.basicUsername}:${metadata.basicPassword}").getBytes());
            headers.put("Authorization", "Basic " + basicAuth);
        <#elseif metadata.authType == "CUSTOM_HEADER">
            headers.put("${metadata.customHeaderName}", "${metadata.customHeaderValue}");
        </#if>

        // Query params
        Map<String, String> queryParams = new HashMap<>();

        <#if metadata.queryParams?has_content>
            <#list metadata.queryParams?keys as key>
                queryParams.put("${key}", "${metadata.queryParams[key]}");
            </#list>
        </#if>

        <#if metadata.authType == "API_KEY_QUERY">
            queryParams.put("${metadata.apiKeyQueryName}", "${metadata.apiKeyQueryValue}");
        </#if>

        // Request body
        String requestBody =
            <#if metadata.requestJson?has_content>
                """${metadata.requestJson}""";
            <#else>
                "";
            </#if>;

        ApiResponse response;

        switch ("${metadata.method}") {
            case "GET" -> response = client.get("${metadata.url}", headers, queryParams);
            case "POST" -> response = client.post("${metadata.url}", headers, queryParams, requestBody);
            case "PUT" -> response = client.put("${metadata.url}", headers, queryParams, requestBody);
            case "DELETE" -> response = client.delete("${metadata.url}", headers, queryParams);
            case "PATCH" -> response = client.patch("${metadata.url}", headers, queryParams, requestBody);
            default -> throw new IllegalArgumentException("Unsupported method: ${metadata.method}");
        }

        assertEquals(${metadata.expectedStatus}, response.getStatus(), "Unexpected status code");

        <#if metadata.expectedResponseJson?has_content>
        String expectedJson = """${metadata.expectedResponseJson}""";
        assertTrue(
            response.getBody().contains(expectedJson.substring(1, expectedJson.length() - 1)),
            "Response body does not contain expected JSON"
        );
        </#if>
    }
}
