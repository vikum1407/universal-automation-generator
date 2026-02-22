package com.testgen.ai.service.impl;

import com.testgen.ai.model.AiTestCase;
import com.testgen.ai.model.AiTestCaseRequest;
import com.testgen.ai.service.AiTestCaseService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
/*
@Service
public class AiTestCaseServiceStub implements AiTestCaseService {

    @Override
    public List<AiTestCase> generateTestCases(AiTestCaseRequest request) {

        AiTestCase positive = new AiTestCase();
        positive.setTitle("Valid login with correct credentials");
        positive.setDescription("User logs in successfully with valid username and password.");
        positive.setType("functional");
        positive.setSteps(List.of(
                "Navigate to login page",
                "Enter valid username",
                "Enter valid password",
                "Click on Login button"
        ));
        positive.setExpected("User is redirected to the dashboard.");
        positive.setData(Map.of(
                "username", "valid_user",
                "password", "ValidPassword123"
        ));
        positive.setTags(List.of("login", "happy-path"));
        positive.setPriority("P1");

        AiTestCase negative = new AiTestCase();
        negative.setTitle("Login fails with invalid password");
        negative.setDescription("User cannot log in with an incorrect password.");
        negative.setType("negative");
        negative.setSteps(List.of(
                "Navigate to login page",
                "Enter valid username",
                "Enter invalid password",
                "Click on Login button"
        ));
        negative.setExpected("Error message is shown: 'Invalid username or password'.");
        negative.setData(Map.of(
                "username", "valid_user",
                "password", "WrongPassword"
        ));
        negative.setTags(List.of("login", "negative"));
        negative.setPriority("P1");

        return List.of(positive, negative);
    }
}*/
