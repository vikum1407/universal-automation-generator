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

    public String generate(ApiMetadata metadata, LanguageType language) throws TemplateException, IOException {

        Map<String, Object> model = new HashMap<>();
        model.put("metadata", metadata);

        return templateService.renderTemplate("selenium/test.ftl",
                language.name().toLowerCase(),
                model);
    }
}
