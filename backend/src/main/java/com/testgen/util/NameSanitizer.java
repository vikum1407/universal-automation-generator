package com.testgen.util;

public class NameSanitizer {

    public static String sanitize(String input) {
        if (input == null || input.isBlank()) {
            return "GeneratedTest";
        }

        // Replace non-alphanumeric with spaces
        String cleaned = input.replaceAll("[^A-Za-z0-9]", " ").trim();

        // Collapse multiple spaces
        cleaned = cleaned.replaceAll("\\s+", " ");

        // Convert to PascalCase
        String[] parts = cleaned.split(" ");
        StringBuilder sb = new StringBuilder();
        for (String p : parts) {
            sb.append(Character.toUpperCase(p.charAt(0)))
                    .append(p.substring(1).toLowerCase());
        }

        String result = sb.toString();

        // Ensure starts with a letter
        if (!Character.isLetter(result.charAt(0))) {
            result = "Test" + result;
        }

        return result;
    }
}
