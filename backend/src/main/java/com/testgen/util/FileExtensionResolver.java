package com.testgen.util;

import com.testgen.model.FrameworkType;
import com.testgen.model.LanguageType;

public class FileExtensionResolver {

    public static String resolve(FrameworkType framework, LanguageType language) {

        return switch (framework) {

            case SELENIUM -> ".java";

            case CYPRESS -> switch (language) {
                case JAVASCRIPT -> ".js";
                case TYPESCRIPT -> ".ts";
                default -> ".js";
            };

            case PLAYWRIGHT -> switch (language) {
                case JAVASCRIPT -> ".js";
                case TYPESCRIPT -> ".ts";
                default -> ".js";
            };
        };
    }
}