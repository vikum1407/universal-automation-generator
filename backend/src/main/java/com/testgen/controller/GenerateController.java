package com.testgen.controller;

import com.testgen.generator.FrameworkGenerator;
import com.testgen.model.ApiMetadata;
import com.testgen.model.FrameworkType;
import com.testgen.model.LanguageType;
import com.testgen.packager.ZipService;
import com.testgen.util.FileExtensionResolver;
import com.testgen.util.NameSanitizer;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import freemarker.template.TemplateException;
import java.io.IOException;

@RestController
@RequestMapping("/api/generate")
@RequiredArgsConstructor
public class GenerateController {

    private final FrameworkGenerator frameworkGenerator;
    private final ZipService zipService;

    @PostMapping
    public GeneratedResponse generate(@RequestBody GenerateRequest request) throws TemplateException, IOException {

        ApiMetadata metadata = new ApiMetadata();
        metadata.setUrl(request.getUrl());
        metadata.setMethod(request.getMethod());
        metadata.setHeaders(request.getHeaders());
        metadata.setQueryParams(request.getQueryParams());
        metadata.setRequestJson(request.getRequestJson());
        metadata.setResponseJson(request.getResponseJson());
        metadata.setExpectedStatus(request.getExpectedStatus());
        metadata.setExpectedResponseJson(request.getExpectedResponseJson());
        metadata.setTestName(NameSanitizer.sanitize(request.getTestName()));

        String generatedCode = frameworkGenerator.generate(
                metadata,
                request.getFrameworkType(),
                request.getLanguageType()
        );

        GeneratedResponse response = new GeneratedResponse();
        response.setMetadata(metadata);
        response.setGeneratedCode(generatedCode);

        return response;
    }

    @PostMapping("/zip")
    public ResponseEntity<byte[]> generateZip(@RequestBody GenerateRequest request) throws TemplateException, IOException {

        ApiMetadata metadata = new ApiMetadata();
        metadata.setUrl(request.getUrl());
        metadata.setMethod(request.getMethod());
        metadata.setHeaders(request.getHeaders());
        metadata.setQueryParams(request.getQueryParams());
        metadata.setRequestJson(request.getRequestJson());
        metadata.setResponseJson(request.getResponseJson());
        metadata.setExpectedStatus(request.getExpectedStatus());
        metadata.setExpectedResponseJson(request.getExpectedResponseJson());
        metadata.setTestName(NameSanitizer.sanitize(request.getTestName()));

        String generatedCode = frameworkGenerator.generate(
                metadata,
                request.getFrameworkType(),
                request.getLanguageType()
        );

        // Dynamic file name based on sanitized test name
        String extension = FileExtensionResolver.resolve(
                request.getFrameworkType(),
                request.getLanguageType()
        );

        String fileName = metadata.getTestName() + extension;

        byte[] zipBytes = zipService.createZip(fileName, generatedCode);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=generated-framework.zip")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(zipBytes);
    }

    @Data
    public static class GenerateRequest {
        private String url;
        private String method;
        private String requestJson;
        private String responseJson;

        private java.util.Map<String, String> headers;
        private java.util.Map<String, String> queryParams;

        private int expectedStatus;
        private String expectedResponseJson;

        private FrameworkType frameworkType;
        private LanguageType languageType;

        private String testName;
    }

    @Data
    public static class GeneratedResponse {
        private ApiMetadata metadata;
        private String generatedCode;
    }
}
