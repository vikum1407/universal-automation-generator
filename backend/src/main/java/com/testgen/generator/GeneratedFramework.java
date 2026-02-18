package com.testgen.generator;

import lombok.Data;

@Data
public class GeneratedFramework {

    private String testFileName;
    private String testContent;

    private String clientFileName;
    private String clientContent;

    private String responseFileName;
    private String responseContent;

    private String environment;
}
