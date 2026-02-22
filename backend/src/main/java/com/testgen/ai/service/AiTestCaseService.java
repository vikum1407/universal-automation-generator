package com.testgen.ai.service;

import com.testgen.ai.model.AiTestCase;
import com.testgen.ai.model.AiTestCaseRequest;

import java.util.List;

public interface AiTestCaseService {

    List<AiTestCase> generateTestCases(AiTestCaseRequest request) throws Exception;
}
