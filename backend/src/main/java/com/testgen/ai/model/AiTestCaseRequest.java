package com.testgen.ai.model;

public class AiTestCaseRequest {

    private String input;          // user story / requirement / endpoint description
    private String context;        // optional: project/domain context
    private String sourceType;     // "TEXT", "SWAGGER", "POSTMAN", etc. (for later)

    public String getInput() {
        return input;
    }

    public void setInput(String input) {
        this.input = input;
    }

    public String getContext() {
        return context;
    }

    public void setContext(String context) {
        this.context = context;
    }

    public String getSourceType() {
        return sourceType;
    }

    public void setSourceType(String sourceType) {
        this.sourceType = sourceType;
    }
}
