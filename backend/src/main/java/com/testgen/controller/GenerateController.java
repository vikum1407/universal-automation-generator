package com.testgen.controller;

import com.testgen.generator.FrameworkGenerator;
import com.testgen.model.ApiMetadata;
import com.testgen.model.FrameworkType;
import com.testgen.model.LanguageType;
import com.testgen.packager.ZipService;
import com.testgen.parser.JsonParserService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/generate")
@RequiredArgsConstructor
public class GenerateController {

    private final JsonParserService jsonParserService;
    private final FrameworkGenerator frameworkGenerator;
    private final ZipService zipService;

    @PostMapping
    public GeneratedResponse generate(@RequestBody GenerateRequest request) {

        ApiMetadata metadata = new ApiMetadata();
        metadata.setUrl(request.getUrl());
        metadata.setMethod(request.getMethod());
        metadata.setRequestFields(jsonParserService.parseRequestJson(request.getRequestJson()));
        metadata.setResponseFields(jsonParserService.parseResponseJson(request.getResponseJson()));

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
    public ResponseEntity<byte[]> generateZip(@RequestBody GenerateRequest request) {

        ApiMetadata metadata = new ApiMetadata();
        metadata.setUrl(request.getUrl());
        metadata.setMethod(request.getMethod());
        metadata.setRequestFields(jsonParserService.parseRequestJson(request.getRequestJson()));
        metadata.setResponseFields(jsonParserService.parseResponseJson(request.getResponseJson()));

        String generatedCode = frameworkGenerator.generate(
                metadata,
                request.getFrameworkType(),
                request.getLanguageType()
        );

        byte[] zipBytes = zipService.createZip("GeneratedTest.java", generatedCode);

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
        private FrameworkType frameworkType;
        private LanguageType languageType;
    }

    @Data
    public static class GeneratedResponse {
        private ApiMetadata metadata;
        private String generatedCode;
    }
}
