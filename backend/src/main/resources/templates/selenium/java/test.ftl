package tests;

import client.ApiClient;
import client.ApiResponse;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.Map;

public class ${metadata.testName} {

    @Test
    public void runTest() throws Exception {

        // Base URL extracted from full URL
        String baseUrl = "${metadata.url?replace(metadata.url?substring(metadata.url?last_index_of('/')), '')}";
        String path = "${metadata.url?substring(metadata.url?last_index_of('/'))}";

        ApiClient client = new ApiClient(baseUrl);

        Map<String, String> headers = <#if metadata.headers?has_content>
            Map.of(
                <#list metadata.headers?keys as key>
                    "${key}", "${metadata.headers[key]}"<#if key_has_next>,</#if>
                </#list>
            );
        <#else>
            Map.of();
        </#if>

        Map<String, String> queryParams = <#if metadata.queryParams?has_content>
            Map.of(
                <#list metadata.queryParams?keys as key>
                    "${key}", "${metadata.queryParams[key]}"<#if key_has_next>,</#if>
                </#list>
            );
        <#else>
            Map.of();
        </#if>

        String requestBody = <#if metadata.requestJson?has_content>
            """${metadata.requestJson}""";
        <#else>
            "";
        </#if>

        ApiResponse response;

        switch ("${metadata.method}") {
            case "GET" -> response = client.get(path, headers, queryParams);
            case "POST" -> response = client.post(path, headers, queryParams, requestBody);
            case "PUT" -> response = client.put(path, headers, queryParams, requestBody);
            case "DELETE" -> response = client.delete(path, headers, queryParams);
            case "PATCH" -> response = client.patch(path, headers, queryParams, requestBody);
            default -> throw new IllegalArgumentException("Unsupported method: ${metadata.method}");
        }

        assertEquals(${metadata.expectedStatus}, response.getStatus(), "Unexpected status code");

        <#if metadata.expectedResponseJson?has_content>
        String expectedJson = """${metadata.expectedResponseJson}""";
        assertTrue(response.getBody().contains(expectedJson.substring(1, expectedJson.length() - 1)),
                "Response body does not contain expected JSON");
        </#if>
    }
}
