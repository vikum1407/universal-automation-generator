package com.testgen.controller;

import com.testgen.generator.FrameworkGenerator;
import com.testgen.generator.GeneratedFramework;
import com.testgen.model.ApiMetadata;
import com.testgen.model.FrameworkType;
import com.testgen.model.LanguageType;
import com.testgen.packager.ZipService;
import com.testgen.util.NameSanitizer;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import freemarker.template.TemplateException;
import java.io.IOException;
import java.util.Map;

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

        GeneratedFramework framework = frameworkGenerator.generate(
                metadata,
                request.getFrameworkType(),
                request.getLanguageType()
        );

        GeneratedResponse response = new GeneratedResponse();
        response.setMetadata(metadata);
        response.setGeneratedCode(framework.getTestContent());

        return response;
    }

    @PostMapping("/zip")
    public ResponseEntity<byte[]> generateZip(@RequestBody GenerateRequest request)
            throws TemplateException, IOException {

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

        GeneratedFramework framework = frameworkGenerator.generate(
                metadata,
                request.getFrameworkType(),
                request.getLanguageType()
        );

        Map<String, String> files = new java.util.HashMap<>();
        String base = "src/test/java/";

        files.put(base + "tests/" + framework.getTestFileName(), framework.getTestContent());

        if (framework.getClientContent() != null) {
            files.put(base + "client/" + framework.getClientFileName(), framework.getClientContent());
        }

        if (framework.getResponseContent() != null) {
            files.put(base + "client/" + framework.getResponseFileName(), framework.getResponseContent());
        }

        files.put("pom.xml", generatePomXml());

        byte[] zipBytes = zipService.createZip(files);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=generated-framework.zip")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(zipBytes);
    }

    private String generatePomXml() {
        return """
            <project xmlns="http://maven.apache.org/POM/4.0.0"
                     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                     xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
                     http://maven.apache.org/xsd/maven-4.0.0.xsd">
                <modelVersion>4.0.0</modelVersion>

                <groupId>com.generated</groupId>
                <artifactId>automation-framework</artifactId>
                <version>1.0-SNAPSHOT</version>

                <properties>
                    <maven.compiler.source>21</maven.compiler.source>
                    <maven.compiler.target>21</maven.compiler.target>
                </properties>

                <dependencies>
                </dependencies>

            </project>
            """;
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
