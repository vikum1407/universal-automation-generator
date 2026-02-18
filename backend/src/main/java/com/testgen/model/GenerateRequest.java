package com.testgen.model;

import lombok.Data;

@Data
public class GenerateRequest {
    private String url;
    private String method;
    private String requestJson;
    private String responseJson;
    private String frameworkType;
    private String languageType;
    private String environment;
}
