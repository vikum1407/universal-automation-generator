package com.testgen.model;

import lombok.Data;
import java.util.Map;

@Data
public class ApiMetadata {

    private String url;
    private String method;

    private Map<String, String> headers;
    private Map<String, String> queryParams;

    private String requestJson;
    private String responseJson;

    private int expectedStatus;
    private String expectedResponseJson;

    private String testName;
}
