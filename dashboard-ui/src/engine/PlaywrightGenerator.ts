import type {
  UniversalTestModel,
  UniversalTestCase,
  UniversalTestStep,
} from "@/engine/UniversalTestModelBuilder";

export interface GeneratedTestFile {
  testId: string;
  fileName: string;
  content: string;
}

/**
 * Generates Playwright test files from the universal model.
 */
export function generatePlaywrightTests(
  model: UniversalTestModel
): GeneratedTestFile[] {
  return model.tests.map((test) => {
    const fileName = `${sanitize(test.id)}.spec.ts`;
    const content = generateTestContent(test);
    return { testId: test.id, fileName, content };
  });
}

function generateTestContent(test: UniversalTestCase): string {
  const header = generateHeader(test);
  const body = generateBody(test.steps);
  const footer = generateFooter(test);

  return [header, body, footer].join("\n\n");
}

function generateHeader(test: UniversalTestCase): string {
  return `import { test, expect } from "@playwright/test";

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
test("${escapeQuotes(test.title)}", async ({ page }) => {`;
}

function generateBody(steps: UniversalTestStep[]): string {
  if (!steps.length) {
    return `  // No steps available yet — awaiting DOM/flow capture
  // TODO: Populate steps from captured flows
  await page.goto("TODO: add URL");`;
  }

  return steps
    .map((step) => {
      const selector = step.selector
        ? `await page.locator("${escapeQuotes(step.selector)}")`
        : "// TODO: selector missing";

      const action = step.description
        ? `// ${step.description}`
        : "// TODO: add description";

      const assertion = step.assertion
        ? `await expect(${selector}).toHaveText("${escapeQuotes(
            step.assertion
          )}");`
        : "";

      return `  ${action}
  ${selector}.click();
  ${assertion}`;
    })
    .join("\n\n");
}

function generateFooter(test: UniversalTestCase): string {
  const healingComments = test.healingSignals
    .map(
      (h) =>
        `// Healing suggestion for ${h.testId}: ${h.suggestedFix} (confidence ${(h.confidence * 100).toFixed(1)}%)`
    )
    .join("\n");

  return `${healingComments}

});`;
}

function sanitize(id: string): string {
  return id.replace(/[^a-zA-Z0-9-_]/g, "_");
}

function escapeQuotes(str: string): string {
  return str.replace(/"/g, '\\"');
}
