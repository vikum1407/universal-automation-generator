package com.testgen.generator;

import com.testgen.model.ApiMetadata;
import com.testgen.model.FrameworkType;
import com.testgen.model.LanguageType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FrameworkGenerator {

    private final SeleniumGenerator seleniumGenerator;
    private final CypressGenerator cypressGenerator;
    private final PlaywrightGenerator playwrightGenerator;

    public String generate(ApiMetadata metadata, FrameworkType framework, LanguageType language) {

        return switch (framework) {
            case SELENIUM -> seleniumGenerator.generate(metadata, language);
            case CYPRESS -> cypressGenerator.generate(metadata, language);
            case PLAYWRIGHT -> playwrightGenerator.generate(metadata, language);
        };
    }
}
