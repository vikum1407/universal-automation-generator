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

        // Authentication mapping
        metadata.setAuthType(request.getAuthType());
        metadata.setApiKeyName(request.getApiKeyName());
        metadata.setApiKeyValue(request.getApiKeyValue());
        metadata.setApiKeyQueryName(request.getApiKeyQueryName());
        metadata.setApiKeyQueryValue(request.getApiKeyQueryValue());
        metadata.setBasicUsername(request.getBasicUsername());
        metadata.setBasicPassword(request.getBasicPassword());
        metadata.setCustomHeaderName(request.getCustomHeaderName());
        metadata.setCustomHeaderValue(request.getCustomHeaderValue());

        String environment = request.getEnvironment() != null ? request.getEnvironment() : "dev";
        metadata.setEnvironment(environment);

        GeneratedFramework framework = frameworkGenerator.generate(
                metadata,
                request.getFrameworkType(),
                request.getLanguageType()
        );

        framework.setEnvironment(environment);

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

        // Authentication mapping
        metadata.setAuthType(request.getAuthType());
        metadata.setApiKeyName(request.getApiKeyName());
        metadata.setApiKeyValue(request.getApiKeyValue());
        metadata.setApiKeyQueryName(request.getApiKeyQueryName());
        metadata.setApiKeyQueryValue(request.getApiKeyQueryValue());
        metadata.setBasicUsername(request.getBasicUsername());
        metadata.setBasicPassword(request.getBasicPassword());
        metadata.setCustomHeaderName(request.getCustomHeaderName());
        metadata.setCustomHeaderValue(request.getCustomHeaderValue());

        String environment = request.getEnvironment() != null ? request.getEnvironment() : "dev";
        metadata.setEnvironment(environment);

        GeneratedFramework framework = frameworkGenerator.generate(
                metadata,
                request.getFrameworkType(),
                request.getLanguageType()
        );

        framework.setEnvironment(environment);

        Map<String, String> files = new java.util.HashMap<>();
        String base = "src/test/java/";

        files.put(base + "tests/" + framework.getTestFileName(), framework.getTestContent());

        if (framework.getClientContent() != null) {
            files.put(base + "client/" + framework.getClientFileName(), framework.getClientContent());
        }

        if (framework.getResponseContent() != null) {
            files.put(base + "client/" + framework.getResponseFileName(), framework.getResponseContent());
        }

        files.put(base + "config/Config.java", generateConfigClass());
        files.put(base + "config/ConfigLoader.java", generateConfigLoaderClass());

        files.put("config/dev.json", generateDevConfig());
        files.put("config/qa.json", generateQaConfig());
        files.put("config/prod.json", generateProdConfig());

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
                    <dependency>
                        <groupId>com.fasterxml.jackson.core</groupId>
                        <artifactId>jackson-databind</artifactId>
                        <version>2.17.0</version>
                    </dependency>

                    <dependency>
                        <groupId>org.junit.jupiter</groupId>
                        <artifactId>junit-jupiter</artifactId>
                        <version>5.10.0</version>
                        <scope>test</scope>
                    </dependency>
                </dependencies>

                <build>
                    <plugins>
                        <plugin>
                            <groupId>org.apache.maven.plugins</groupId>
                            <artifactId>maven-surefire-plugin</artifactId>
                            <version>3.1.2</version>
                            <configuration>
                                <useModulePath>false</useModulePath>
                            </configuration>
                        </plugin>
                    </plugins>
                </build>

            </project>
            """;
    }

    private String generateConfigClass() {
        return """
            package config;

            import java.util.Map;

            public class Config {

                private String baseUrl;
                private String authToken;
                private Map<String, String> headers;

                public String getBaseUrl() { return baseUrl; }
                public String getAuthToken() { return authToken; }
                public Map<String, String> getHeaders() { return headers; }
            }
            """;
    }

    private String generateConfigLoaderClass() {
        return """
            package config;

            import com.fasterxml.jackson.databind.ObjectMapper;
            import java.io.File;
            import java.io.IOException;

            public class ConfigLoader {

                private static final ObjectMapper mapper = new ObjectMapper();

                public static Config load(String env) {
                    try {
                        File file = new File("config/" + env + ".json");
                        return mapper.readValue(file, Config.class);
                    } catch (IOException e) {
                        throw new RuntimeException("Failed to load environment config: " + env, e);
                    }
                }
            }
            """;
    }

    private String generateDevConfig() {
        return """
            {
              "baseUrl": "https://dev-api.example.com",
              "authToken": "",
              "headers": {}
            }
            """;
    }

    private String generateQaConfig() {
        return """
            {
              "baseUrl": "https://qa-api.example.com",
              "authToken": "",
              "headers": {}
            }
            """;
    }

    private String generateProdConfig() {
        return """
            {
              "baseUrl": "https://api.example.com",
              "authToken": "",
              "headers": {}
            }
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
        private String environment;

        // Authentication fields
        private String authType;

        private String apiKeyName;
        private String apiKeyValue;

        private String apiKeyQueryName;
        private String apiKeyQueryValue;

        private String basicUsername;
        private String basicPassword;

        private String customHeaderName;
        private String customHeaderValue;
    }

    @Data
    public static class GeneratedResponse {
        private ApiMetadata metadata;
        private String generatedCode;
    }
}
