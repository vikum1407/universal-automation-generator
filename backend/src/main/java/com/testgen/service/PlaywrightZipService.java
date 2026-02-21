package com.testgen.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.testgen.controller.GenerateController.GenerateRequest;
import com.testgen.model.LanguageType;
import com.testgen.template.TemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.HashMap;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class PlaywrightZipService {

    @Autowired
    private TemplateService templateService;

    public void generatePlaywrightProject(GenerateRequest req, ZipOutputStream zos) throws Exception {

        boolean isTS = req.getLanguageType() == LanguageType.TYPESCRIPT;

        String folder = "playwright";
        String language = isTS ? "typescript" : "javascript";

        // ---------------------------
        // 1. Test file
        // ---------------------------
        String testFileName = isTS
                ? "tests/" + req.getTestName() + ".spec.ts"
                : "tests/" + req.getTestName() + ".spec.js";

        addToZip(zos, testFileName,
                templateService.renderTemplate(folder, language, toMap(req)));

        // ---------------------------
        // 2. API Helper
        // ---------------------------
        addToZip(zos,
                isTS ? "helpers/apiHelper.ts" : "helpers/apiHelper.js",
                templateService.renderTemplate(folder, language + "/apiHelper", toMap(req)));

        // ---------------------------
        // 3. Config files
        // ---------------------------
        addToZip(zos, "config/dev.json",
                templateService.renderTemplate(folder, language + "/config", toMap(req)));

        addToZip(zos, "config/qa.json",
                templateService.renderTemplate(folder, language + "/config", toMap(req)));

        addToZip(zos, "config/prod.json",
                templateService.renderTemplate(folder, language + "/config", toMap(req)));

        // ---------------------------
        // 4. package.json
        // ---------------------------
        addToZip(zos, "package.json", generatePackageJson(isTS));

        // ---------------------------
        // 5. Playwright config
        // ---------------------------
        if (isTS) {
            addToZip(zos, "playwright.config.ts", generatePlaywrightConfigTs());
        } else {
            addToZip(zos, "playwright.config.js", generatePlaywrightConfigJs());
        }
    }

    private void addToZip(ZipOutputStream zos, String path, String content) throws Exception {
        zos.putNextEntry(new ZipEntry(path));
        zos.write(content.getBytes(StandardCharsets.UTF_8));
        zos.closeEntry();
    }

    private Map<String, Object> toMap(GenerateRequest req) {
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> map = mapper.convertValue(req, Map.class);

        map.put("baseUrl", req.getUrl());
        map.put("authToken", "");
        map.put("headers", req.getHeaders());
        map.put("environment", req.getEnvironment());
        map.put("testName", req.getTestName());

        return map;
    }

    private String generatePackageJson(boolean isTS) {
        return isTS
                ? """
                  {
                    "name": "generated-playwright-framework",
                    "version": "1.0.0",
                    "private": true,
                    "devDependencies": {
                      "@playwright/test": "^1.40.0",
                      "typescript": "^5.0.0"
                    },
                    "scripts": {
                      "test": "npx playwright test",
                      "open": "npx playwright test --ui"
                    }
                  }
                  """
                : """
                  {
                    "name": "generated-playwright-framework",
                    "version": "1.0.0",
                    "private": true,
                    "devDependencies": {
                      "@playwright/test": "^1.40.0"
                    },
                    "scripts": {
                      "test": "npx playwright test",
                      "open": "npx playwright test --ui"
                    }
                  }
                  """;
    }

    private String generatePlaywrightConfigJs() {
        return """
               const { defineConfig } = require('@playwright/test');

               module.exports = defineConfig({
                 testDir: './tests',
                 use: {
                   baseURL: '',
                 }
               });
               """;
    }

    private String generatePlaywrightConfigTs() {
        return """
               import { defineConfig } from '@playwright/test';

               export default defineConfig({
                 testDir: './tests',
                 use: {
                   baseURL: '',
                 }
               });
               """;
    }
}
