package com.testgen.generator;

import com.testgen.model.ApiMetadata;
import com.testgen.model.LanguageType;
import com.testgen.template.TemplateService;
import freemarker.template.TemplateException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SeleniumGenerator {

    private final TemplateService templateService;

    public GeneratedFramework generate(ApiMetadata metadata, LanguageType language)
            throws TemplateException, IOException {

        GeneratedFramework result = new GeneratedFramework();

        Map<String, Object> model = new HashMap<>();
        model.put("metadata", metadata);
        model.put("url", metadata.getUrl());
        model.put("method", metadata.getMethod());
        model.put("headers", metadata.getHeaders());
        model.put("queryParams", metadata.getQueryParams());
        model.put("requestJson", metadata.getRequestJson());
        model.put("expectedStatus", metadata.getExpectedStatus());
        model.put("expectedResponseJson", metadata.getExpectedResponseJson());
        model.put("environment", metadata.getEnvironment());
        model.put("testName", metadata.getTestName());
        model.put("authType", metadata.getAuthType());

        model.put("apiKeyName", metadata.getApiKeyName());
        model.put("apiKeyValue", metadata.getApiKeyValue());
        model.put("apiKeyQueryName", metadata.getApiKeyQueryName());
        model.put("apiKeyQueryValue", metadata.getApiKeyQueryValue());

        model.put("basicUsername", metadata.getBasicUsername());
        model.put("basicPassword", metadata.getBasicPassword());

        model.put("customHeaderName", metadata.getCustomHeaderName());
        model.put("customHeaderValue", metadata.getCustomHeaderValue());

        // Test template → templates/selenium/<language>/test.ftl
        String testContent = templateService.renderTemplate(
                "selenium",
                language.name().toLowerCase(),
                model
        );

        // ApiClient → templates/selenium/java/ApiClient.ftl
        String clientContent = templateService.renderTemplate(
                "selenium",
                "java/ApiClient",
                model
        );

        // ApiResponse → templates/selenium/java/ApiResponse.ftl
        String responseContent = templateService.renderTemplate(
                "selenium",
                "java/ApiResponse",
                model
        );

        result.setTestFileName(metadata.getTestName() + ".java");
        result.setTestContent(testContent);

        result.setClientFileName("ApiClient.java");
        result.setClientContent(clientContent);

        result.setResponseFileName("ApiResponse.java");
        result.setResponseContent(responseContent);

        return result;
    }
}
