package com.testgen.generator;

import com.testgen.model.ApiMetadata;
import com.testgen.model.FrameworkType;
import com.testgen.model.LanguageType;
import freemarker.template.TemplateException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class FrameworkGenerator {

    private final SeleniumGenerator seleniumGenerator;
    private final CypressGenerator cypressGenerator;
    private final PlaywrightGenerator playwrightGenerator;

    public GeneratedFramework generate(ApiMetadata metadata, FrameworkType framework, LanguageType language)
            throws TemplateException, IOException {

        GeneratedFramework generated = switch (framework) {
            case SELENIUM -> seleniumGenerator.generate(metadata, language);
            case CYPRESS -> cypressGenerator.generate(metadata, language);
            case PLAYWRIGHT -> playwrightGenerator.generate(metadata, language);
        };

        generated.setEnvironment(metadata.getEnvironment());

        return generated;
    }
}
