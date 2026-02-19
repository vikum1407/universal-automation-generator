package com.testgen.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.testgen.controller.GenerateController.GenerateRequest;
import com.testgen.model.LanguageType;
import com.testgen.template.TemplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
public class CypressZipService {

    @Autowired
    private TemplateService templateService;

    public void generateCypressProject(GenerateRequest req, ZipOutputStream zos) throws Exception {

        boolean isTS = req.getLanguageType() == LanguageType.TYPESCRIPT;

        // ---------------------------
        // 1. Generate test file
        // ---------------------------
        String testFolder = isTS ? "cypress/typescript" : "cypress/javascript";
        String testTemplateName = "test";

        String testFileName = isTS
                ? "cypress/e2e/" + req.getTestName() + ".cy.ts"
                : "cypress/e2e/" + req.getTestName() + ".cy.js";

        addToZip(zos, testFileName,
                templateService.renderTemplate(testFolder, testTemplateName, toMap(req)));

        // ---------------------------
        // 2. Generate API Client
        // ---------------------------
        String apiClientTemplateName = "apiClient";

        String apiClientFileName = isTS
                ? "cypress/support/apiClient.ts"
                : "cypress/support/apiClient.js";

        addToZip(zos, apiClientFileName,
                templateService.renderTemplate(testFolder, apiClientTemplateName, toMap(req)));

        // ---------------------------
        // 3. Generate config files (dev/qa/prod)
        // ---------------------------
        String configFolder = isTS ? "cypress/typescript" : "cypress/javascript";
        String configTemplateName = "config";

        addToZip(zos, "cypress/config/dev.json",
                templateService.renderTemplate(configFolder, configTemplateName, toMap(req)));

        addToZip(zos, "cypress/config/qa.json",
                templateService.renderTemplate(configFolder, configTemplateName, toMap(req)));

        addToZip(zos, "cypress/config/prod.json",
                templateService.renderTemplate(configFolder, configTemplateName, toMap(req)));

        // ---------------------------
        // 4. package.json
        // ---------------------------
        addToZip(zos, "package.json", generatePackageJson(isTS));

        // ---------------------------
        // 5. Cypress config (JS or TS)
        // ---------------------------
        if (isTS) {
            addToZip(zos, "cypress.config.ts", generateCypressConfigTs());
        } else {
            addToZip(zos, "cypress.config.js", generateCypressConfigJs());
        }
    }

    private void addToZip(ZipOutputStream zos, String path, String content) throws Exception {
        zos.putNextEntry(new ZipEntry(path));
        zos.write(content.getBytes(StandardCharsets.UTF_8));
        zos.closeEntry();
    }

    private Map<String, Object> toMap(GenerateRequest req) {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.convertValue(req, Map.class);
    }

    private String generatePackageJson(boolean isTS) {
        return isTS
                ? """
                  {
                    "name": "generated-cypress-framework",
                    "version": "1.0.0",
                    "private": true,
                    "devDependencies": {
                      "cypress": "^13.0.0",
                      "typescript": "^5.0.0"
                    },
                    "scripts": {
                      "test": "cypress run",
                      "open": "cypress open"
                    }
                  }
                  """
                : """
                  {
                    "name": "generated-cypress-framework",
                    "version": "1.0.0",
                    "private": true,
                    "devDependencies": {
                      "cypress": "^13.0.0"
                    },
                    "scripts": {
                      "test": "cypress run",
                      "open": "cypress open"
                    }
                  }
                  """;
    }

    private String generateCypressConfigJs() {
        return """
               const { defineConfig } = require("cypress");

               module.exports = defineConfig({
                 e2e: {
                   baseUrl: "",
                   specPattern: "cypress/e2e/**/*.cy.{js,ts}",
                   supportFile: false
                 }
               });
               """;
    }

    private String generateCypressConfigTs() {
        return """
               import { defineConfig } from "cypress";

               export default defineConfig({
                 e2e: {
                   baseUrl: "",
                   specPattern: "cypress/e2e/**/*.cy.{js,ts}",
                   supportFile: false
                 }
               });
               """;
    }
}
