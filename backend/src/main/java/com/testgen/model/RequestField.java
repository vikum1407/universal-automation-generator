package com.testgen.model;

import lombok.Data;

@Data
public class RequestField {
    private String name;
    private String type;
    private boolean required;
}
