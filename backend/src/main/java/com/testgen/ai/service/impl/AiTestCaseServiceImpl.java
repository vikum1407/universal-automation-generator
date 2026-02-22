package com.testgen.ai.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.testgen.ai.model.AiTestCase;
import com.testgen.ai.model.AiTestCaseRequest;
import com.testgen.ai.service.AiClient;
import com.testgen.ai.service.AiTestCaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AiTestCaseServiceImpl implements AiTestCaseService {

    @Autowired
    private AiClient aiClient;

    private static final ObjectMapper mapper = new ObjectMapper();

    @Override
    public List<AiTestCase> generateTestCases(AiTestCaseRequest request) throws Exception {

        String prompt = buildPrompt(request);

        String aiResponse = aiClient.generate(prompt);

        return mapper.readValue(aiResponse, new TypeReference<List<AiTestCase>>() {});
    }

    private String buildPrompt(AiTestCaseRequest req) {

        return """
            You are an expert QA engineer.
            Generate detailed test cases for the following requirement:
            
            INPUT:
            %s
            
            Output ONLY valid JSON array using this structure:
            
            [
              {
                "title": "",
                "description": "",
                "type": "",
                "steps": [],
                "expected": "",
                "data": {},
                "tags": [],
                "priority": ""
              }
            ]
            
            Do NOT include explanations.
            Do NOT include markdown.
            Do NOT include text outside the JSON.
            """.formatted(req.getInput());

    }

    /**
     * OpenAI Integration
     * @param req
     * @return

    private String buildPrompt(AiTestCaseRequest req) {

    return """
    You are an expert QA engineer.
    Generate detailed test cases for the following requirement:

    INPUT:
    %s

    Output ONLY valid JSON array using this structure:

    [
    {
    "title": "",
    "description": "",
    "type": "",
    "steps": [],
    "expected": "",
    "data": {},
    "tags": [],
    "priority": ""
    }
    ]

    Generate:
    - Positive test cases
    - Negative test cases
    - Boundary test cases
    - Security test cases
    - Error handling test cases
    - Business logic scenarios
    """.formatted(req.getInput());
    }
     */

}
