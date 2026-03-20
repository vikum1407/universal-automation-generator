import type {
  UniversalTestModel,
  UniversalTestCase,
  UniversalTestStep,
} from "@/engine/UniversalTestModelBuilder";
import type { GeneratedSeleniumFile } from "./SeleniumTypes";

export function generateSeleniumTests(
  model: UniversalTestModel
): GeneratedSeleniumFile[] {
  return model.tests.map((test) => {
    const fileName = `${sanitize(test.id)}Test.java`;
    const content = generateSeleniumContent(test);
    return { testId: test.id, fileName, content };
  });
}

function generateSeleniumContent(test: UniversalTestCase): string {
  const header = generateHeader(test);
  const body = generateBody(test.steps);
  const footer = generateFooter(test);

  return [header, body, footer].join("\n\n");
}

function generateHeader(test: UniversalTestCase): string {
  return `import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class ${sanitize(test.id)}Test {

    private WebDriver driver;

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
    public void ${sanitize(test.id)}() throws Exception {`;
}

function generateBody(steps: UniversalTestStep[]): string {
  if (!steps.length) {
    return `        // No steps available yet — awaiting DOM/flow capture
        // TODO: Populate steps from captured flows
        driver.get("TODO: add URL");`;
  }

  return steps
    .map((step) => {
      const selector = step.selector
        ? `driver.findElement(By.cssSelector("${escape(step.selector)}"))`
        : `// TODO: selector missing`;

      const action = step.description
        ? `// ${step.description}`
        : `// TODO: add description`;

      const assertion = step.assertion
        ? `        // TODO: add assertion for: ${escape(step.assertion)}`
        : "";

      return `        ${action}
        ${selector}.click();
        ${assertion}`;
    })
    .join("\n\n");
}

function generateFooter(test: UniversalTestCase): string {
  const healingComments = test.healingSignals
    .map(
      (h) =>
        `        // Healing suggestion: ${h.suggestedFix} (confidence ${(h.confidence * 100).toFixed(1)}%)`
    )
    .join("\n");

  return `\n${healingComments}
    }
}`;
}

function sanitize(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, "_");
}

function escape(str: string): string {
  return str.replace(/"/g, '\\"');
}
