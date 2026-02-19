package com.testgen.service;

import com.testgen.model.GenerateRequest;
import com.testgen.model.GenerateResponse;
import com.testgen.template.TemplateService;
import freemarker.template.TemplateException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
public class CodeGenerationService {

    private final TemplateService templateService;

    public CodeGenerationService(TemplateService templateService) {
        this.templateService = templateService;
    }

    public GenerateResponse generateCode(GenerateRequest request) throws IOException, TemplateException {

        Map<String, Object> model = new HashMap<>();
        model.put("url", request.getUrl());
        model.put("method", request.getMethod());
        model.put("requestJson", request.getRequestJson());
        model.put("responseJson", request.getResponseJson());

        String code = templateService.renderTemplate(
                request.getFrameworkType().name().toLowerCase(),
                request.getLanguageType().name().toLowerCase(),
                model
        );

        return new GenerateResponse(code);
    }
}
