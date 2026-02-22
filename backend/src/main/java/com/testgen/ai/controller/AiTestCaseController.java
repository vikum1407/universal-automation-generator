package com.testgen.ai.controller;

import com.testgen.ai.model.AiTestCase;
import com.testgen.ai.model.AiTestCaseRequest;
import com.testgen.ai.service.AiTestCaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/test-cases")
@CrossOrigin
public class AiTestCaseController {

    @Autowired
    private AiTestCaseService aiTestCaseService;

    @PostMapping("/generate")
    public List<AiTestCase> generate(@RequestBody AiTestCaseRequest request) throws Exception {
        return aiTestCaseService.generateTestCases(request);
    }
}
