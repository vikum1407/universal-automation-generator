import type {
  UniversalTestModel,
  UniversalTestCase,
} from "@/engine/UniversalTestModelBuilder";
import type { GeneratedRestAssuredFile } from "./RestAssuredTypes";

export function generateRestAssuredTests(
  model: UniversalTestModel
): GeneratedRestAssuredFile[] {
  return model.tests.map((test) => {
    const fileName = `${sanitize(test.id)}Test.java`;
    const content = generateRestAssuredContent(test);
    return { testId: test.id, fileName, content };
  });
}

function generateRestAssuredContent(test: UniversalTestCase): string {
  const header = generateHeader(test);
  const body = generateBody(test);
  const footer = generateFooter(test);

  return [header, body, footer].join("\n\n");
}

function generateHeader(test: UniversalTestCase): string {
  return `import io.restassured.RestAssured;
import io.restassured.response.Response;
import org.junit.jupiter.api.Test;
import static org.hamcrest.Matchers.*;

public class ${sanitize(test.id)}Test {

    /**
     * Test ID: ${test.id}
     * Title: ${test.title}
     * Linked Requirements: ${test.linkedRequirements.join(", ") || "None"}
     * Status: ${test.status}
     * Pass Rate: ${(test.passRate * 100).toFixed(1)}%
     * Recent Failures: ${test.recentFailures}
     * Flakiness Score: ${test.flakinessScore}
     * Healing Signals: ${test.healingSignals.length}
     */
    @Test
    public void ${sanitize(test.id)}() {`;
}

function generateBody(test: UniversalTestCase): string {
  return `        // TODO: Replace with actual endpoint from snapshot
        Response response = RestAssured
            .given()
                .header("Content-Type", "application/json")
            .when()
                .get("TODO: /api/endpoint")
            .then()
                .statusCode(200)
                // TODO: Add JSON assertions from universal model
                .extract().response();`;
}

function generateFooter(test: UniversalTestCase): string {
  const healingComments = test.healingSignals
    .map(
      (h) =>
        `    // Healing suggestion: ${h.suggestedFix} (confidence ${(h.confidence * 100).toFixed(1)}%)`
    )
    .join("\n");

  return `\n${healingComments}\n    }\n}`;
}

function sanitize(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, "_");
}
