package com.testgen.template;

import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.StringWriter;
import java.util.Map;

@Service
public class TemplateService {

    private final Configuration freemarkerConfig;

    public TemplateService(Configuration freemarkerConfig) {
        this.freemarkerConfig = freemarkerConfig;
    }

    public String renderTemplate(String frameworkType,
                                 String languageType,
                                 Map<String, Object> model) throws IOException, TemplateException {

        String templatePath = String.format("%s/%s/test.ftl",
                frameworkType.toLowerCase(),
                languageType.toLowerCase());

        Template template = freemarkerConfig.getTemplate(templatePath);

        try (StringWriter writer = new StringWriter()) {
            template.process(model, writer);
            return writer.toString();
        }
    }
}
