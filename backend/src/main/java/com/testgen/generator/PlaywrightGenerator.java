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
public class PlaywrightGenerator {

    private final TemplateService templateService;

    public GeneratedFramework generate(ApiMetadata metadata, LanguageType language)
            throws TemplateException, IOException {

        Map<String, Object> model = new HashMap<>();
        model.put("metadata", metadata);
        model.put("url", metadata.getUrl());
        model.put("method", metadata.getMethod());
        model.put("headers", metadata.getHeaders());
        model.put("queryParams", metadata.getQueryParams());
        model.put("requestJson", metadata.getRequestJson());
        model.put("expectedStatus", metadata.getExpectedStatus());
        model.put("expectedResponseJson", metadata.getExpectedResponseJson());

        // Generate test file
        String testContent = templateService.renderTemplate(
                "playwright",
                language.name().toLowerCase(),
                model
        );

        GeneratedFramework result = new GeneratedFramework();
        result.setTestFileName(metadata.getTestName() + (language == LanguageType.TYPESCRIPT ? ".ts" : ".js"));
        result.setTestContent(testContent);

        // Playwright does NOT need ApiClient or ApiResponse
        result.setClientFileName(null);
        result.setClientContent(null);
        result.setResponseFileName(null);
        result.setResponseContent(null);

        return result;
    }
}
