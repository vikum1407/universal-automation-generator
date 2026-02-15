package com.testgen.template;

import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import freemarker.template.Version;
import org.springframework.stereotype.Service;

import java.io.StringWriter;
import java.io.IOException;
import java.util.Map;

@Service
public class TemplateService {

    private final Configuration configuration;

    public TemplateService() {
        configuration = new Configuration(new Version("2.3.32"));
        configuration.setClassForTemplateLoading(this.getClass(), "/templates");
        configuration.setDefaultEncoding("UTF-8");
    }

    public String renderTemplate(String templateName, Map<String, Object> dataModel) {
        try {
            Template template = configuration.getTemplate(templateName);
            StringWriter writer = new StringWriter();
            template.process(dataModel, writer);
            return writer.toString();
        } catch (IOException | TemplateException e) {
            throw new RuntimeException("Error rendering template: " + templateName, e);
        }
    }
}
