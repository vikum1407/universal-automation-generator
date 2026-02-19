package com.testgen.model;

import lombok.Data;

import java.util.Map;

@Data
public class GenerateRequest {

    private String url;
    private String method;
    private String requestJson;
    private String responseJson;

    private Map<String, String> headers;
    private Map<String, String> queryParams;

    private int expectedStatus;
    private String expectedResponseJson;

    private FrameworkType frameworkType;
    private LanguageType languageType;

    private String testName;
    private String environment;

    // ⭐ Authentication fields
    private String authType; // NONE, BEARER, API_KEY_HEADER, API_KEY_QUERY, BASIC, CUSTOM_HEADER

    // API Key (header)
    private String apiKeyName;
    private String apiKeyValue;

    // API Key (query)
    private String apiKeyQueryName;
    private String apiKeyQueryValue;

    // Basic Auth
    private String basicUsername;
    private String basicPassword;

    // Custom header
    private String customHeaderName;
    private String customHeaderValue;
}

