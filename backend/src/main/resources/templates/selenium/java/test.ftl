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

        // Load environment config (default: dev)
        Config config = ConfigLoader.load("dev");

        ApiClient client = new ApiClient(config.getBaseUrl());

        // Merge config headers + metadata headers + auth token
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

        // Authorization header (Bearer token)
        if (config.getAuthToken() != null && !config.getAuthToken().isEmpty()) {
            headers.put("Authorization", "Bearer " + config.getAuthToken());
        }

        // Query params
        Map<String, String> queryParams = <#if metadata.queryParams?has_content>
            Map.of(
                <#list metadata.queryParams?keys as key>
                    "${key}", "${metadata.queryParams[key]}"<#if key_has_next>,</#if>
                </#list>
            );
        <#else>
            Map.of();
        </#if>

        // Request body
        String requestBody = <#if metadata.requestJson?has_content>
            """${metadata.requestJson}""";
        <#else>
            "";
        </#if>;

        ApiResponse response;

        // Execute request
        switch ("${metadata.method}") {
            case "GET" -> response = client.get("${metadata.url}", headers, queryParams);
            case "POST" -> response = client.post("${metadata.url}", headers, queryParams, requestBody);
            case "PUT" -> response = client.put("${metadata.url}", headers, queryParams, requestBody);
            case "DELETE" -> response = client.delete("${metadata.url}", headers, queryParams);
            case "PATCH" -> response = client.patch("${metadata.url}", headers, queryParams, requestBody);
            default -> throw new IllegalArgumentException("Unsupported method: ${metadata.method}");
        }

        // Validate status code
        assertEquals(${metadata.expectedStatus}, response.getStatus(), "Unexpected status code");

        // Validate response body (basic contains check)
        <#if metadata.expectedResponseJson?has_content>
        String expectedJson = """${metadata.expectedResponseJson}""";
        assertTrue(
            response.getBody().contains(expectedJson.substring(1, expectedJson.length() - 1)),
            "Response body does not contain expected JSON"
        );
        </#if>
    }
}
