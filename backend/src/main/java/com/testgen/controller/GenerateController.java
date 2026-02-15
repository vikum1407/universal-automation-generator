package com.testgen.controller;

import com.testgen.model.ApiMetadata;
import com.testgen.model.FrameworkType;
import com.testgen.model.LanguageType;
import com.testgen.parser.JsonParserService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/generate")
@RequiredArgsConstructor
public class GenerateController {

    private final JsonParserService jsonParserService;

    @PostMapping
    public ApiMetadata generate(@RequestBody GenerateRequest request) {

        ApiMetadata metadata = new ApiMetadata();
        metadata.setUrl(request.getUrl());
        metadata.setMethod(request.getMethod());
        metadata.setRequestFields(jsonParserService.parseRequestJson(request.getRequestJson()));
        metadata.setResponseFields(jsonParserService.parseResponseJson(request.getResponseJson()));

        return metadata;
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
}
