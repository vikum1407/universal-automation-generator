package com.testgen.model;

import lombok.Data;
import java.util.List;

@Data
public class ApiMetadata {
    private String url;
    private String method;
    private List<RequestField> requestFields;
    private List<ResponseField> responseFields;
}
