package com.testgen.parser;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.testgen.model.RequestField;
import com.testgen.model.ResponseField;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

@Service
public class JsonParserService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<RequestField> parseRequestJson(String json) {
        List<RequestField> fields = new ArrayList<>();

        try {
            JsonNode root = objectMapper.readTree(json);
            Iterator<String> fieldNames = root.fieldNames();

            while (fieldNames.hasNext()) {
                String name = fieldNames.next();
                JsonNode value = root.get(name);

                RequestField field = new RequestField();
                field.setName(name);
                field.setType(value.getNodeType().toString());
                field.setRequired(true); // default for now

                fields.add(field);
            }

        } catch (Exception e) {
            throw new RuntimeException("Invalid request JSON", e);
        }

        return fields;
    }

    public List<ResponseField> parseResponseJson(String json) {
        List<ResponseField> fields = new ArrayList<>();

        try {
            JsonNode root = objectMapper.readTree(json);
            Iterator<String> fieldNames = root.fieldNames();

            while (fieldNames.hasNext()) {
                String name = fieldNames.next();
                JsonNode value = root.get(name);

                ResponseField field = new ResponseField();
                field.setName(name);
                field.setType(value.getNodeType().toString());

                fields.add(field);
            }

        } catch (Exception e) {
            throw new RuntimeException("Invalid response JSON", e);
        }

        return fields;
    }
}
