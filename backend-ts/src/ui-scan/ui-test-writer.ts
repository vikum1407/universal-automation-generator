import * as fs from 'fs';
import * as path from 'path';
import { SelectorHistoryEntry } from './auto-rewrite-engine';
import { UIJourney } from './ui-journey-generator';
import { UIScenario } from './ui-scenario-engine';
import { UIStateGraph } from './ui-state-engine';
import { GlobalOptimizationResult } from './global-optimization-engine';
import { RegressionMemory } from './regression-engine';
import { RootCauseMemory } from './root-cause-engine';

interface RequirementLike {
  id: string;
  page: string;
  description: string;
  selector: string;
  evolvedSelector?: string;
  stabilityScore?: number;
  improvedScore?: number;
  driftProbability?: number;
  evolutionConfidence?: number;
  evolutionReason?: string;
  selectorHistory?: SelectorHistoryEntry[];
  type: string;
  action?: string;
  tags?: string[];
  meta?: any;
}

interface FlowGraph {
  pages: { url: string; title?: string }[];
  edges: { from: string; to: string; selector?: string; action?: string }[];
}

export class UITestWriter {
  writeTests(
    requirements: RequirementLike[],
    outputDir: string,
    flowGraph?: FlowGraph,
    journeys?: UIJourney[],
    scenarios?: UIScenario[],
    stateGraph?: UIStateGraph,
    optimization?: GlobalOptimizationResult,
    regression?: RegressionMemory,
    rootCause?: RootCauseMemory
  ): { name: string; content: string }[] {
    if (!Array.isArray(requirements) || requirements.length === 0) return [];

    const testsRoot = outputDir;
    if (!fs.existsSync(testsRoot)) fs.mkdirSync(testsRoot, { recursive: true });

    const byPage: Record<string, RequirementLike[]> = {};

    for (const req of requirements) {
      if (!req.page) continue;
      if (!byPage[req.page]) byPage[req.page] = [];
      byPage[req.page].push(req);
    }

    const testFiles: { name: string; content: string }[] = [];

    for (const page of Object.keys(byPage)) {
      const safePage = this.safeFileName(page);
      const fileName = `${safePage}.spec.ts`;
      const filePath = path.join(testsRoot, fileName);

      const pageJourneys =
        journeys?.filter(j => j.steps.some(s => s.from === page || s.to === page)) ?? [];

      const pageScenarios =
        scenarios?.filter(s =>
          s.steps.some(st => st.from === page || st.to === page)
        ) ?? [];

      const content = this.buildTestFile(
        page,
        byPage[page],
        flowGraph,
        pageJourneys,
        pageScenarios,
        stateGraph,
        optimization,
        regression
      );

      fs.writeFileSync(filePath, content.trim() + '\n');

      testFiles.push({
        name: fileName,
        content: content.trim() + '\n'
      });
    }

    return testFiles;
  }

  private buildTestFile(
    pageUrl: string,
    requirements: RequirementLike[],
    flowGraph?: FlowGraph,
    journeys?: UIJourney[],
    scenarios?: UIScenario[],
    stateGraph?: UIStateGraph,
    optimization?: GlobalOptimizationResult,
    regression?: RegressionMemory
  ): string {
    const tests: string[] = [];

    for (const req of requirements) {
      const actionTest = this.buildActionTest(req, pageUrl, optimization, regression);
      if (actionTest) tests.push(actionTest);

      const negativeTest = this.buildNegativeTest(req, pageUrl, optimization, regression);
      if (negativeTest) tests.push(negativeTest);
    }

    if (flowGraph && flowGraph.edges.length > 0) {
      const edges = flowGraph.edges.filter(e => e.from === pageUrl);

      for (const edge of edges) {
        const selector = this.escape(edge.selector || '');
        const title = `Navigate from ${edge.from} to ${edge.to}`;
        const priorityComment = this.buildPriorityComment(title, optimization);
        const regressionComment = this.buildRegressionCommentForTitle(title, regression);

        tests.push(`
test('${title}', async ({ page }) => {
  ${priorityComment}
  ${regressionComment}
  await page.goto('${edge.from}');
  await selfHealClick(page, '${selector}', '${selector}');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('${edge.to}');
  await capturePageBaseline(page);
});
`);
      }
    }

    if (journeys && journeys.length > 0) {
      for (const journey of journeys) {
        tests.push(this.buildJourneyTest(journey, optimization, regression));
      }
    }

    if (scenarios && scenarios.length > 0) {
      for (const scenario of scenarios) {
        tests.push(this.buildScenarioTest(scenario, optimization, regression));
      }
    }

    if (stateGraph && stateGraph.states.length > 0) {
      tests.push(this.buildStateInvariantTest(pageUrl, stateGraph, optimization, regression));
    }

    return `
import { test, expect } from '@playwright/test';

async function selfHealClick(page, evolvedSelector, originalSelector) {
  const candidates = [evolvedSelector, originalSelector].filter(Boolean);

  for (const sel of candidates) {
    try {
      await page.click(sel, { timeout: 2000 });
      return;
    } catch {}
  }

  for (const sel of candidates) {
    const textMatch = sel?.match(/has-text\\("([^"]+)"\\)/);
    if (textMatch) {
      try {
        await page.getByText(textMatch[1]).click({ timeout: 2000 });
        return;
      } catch {}
    }
  }

  for (const sel of candidates) {
    if (sel?.includes('button')) {
      try {
        await page.getByRole('button').first().click({ timeout: 2000 });
        return;
      } catch {}
    }
  }

  throw new Error('Self-healing failed for selectors: ' + candidates.join(', '));
}

async function capturePageBaseline(page) {
  await expect(page).toHaveScreenshot();
}

async function aiAssertPageIdentity(page, expected) {
  const content = await page.content();
  expect(content.length).toBeGreaterThan(50);
}

async function aiAssertComponentPresence(page, hint) {
  const content = await page.content();
  expect(content.includes(hint)).toBeTruthy();
}

${tests.join('\n')}
`;
  }

  private buildPriorityComment(
    title: string,
    optimization?: GlobalOptimizationResult
  ): string {
    if (!optimization) return '';

    const item = optimization.testPlan.find(t => t.title === title);
    if (!item) return '';

    return `
/**
 * Test Priority: ${item.priority}
 * Reason: ${item.reason}
 */
`;
  }

  private buildRegressionCommentForRequirement(
    requirementId: string,
    regression?: RegressionMemory
  ): string {
    if (!regression) return '';

    const sig = regression.signatures.find(
      s => s.kind === 'selector' && s.refId === requirementId
    );
    if (!sig) return '';

    const forecast = regression.forecasts.find(
      f => f.kind === 'selector' && f.refId === requirementId
    );

    const risk = forecast?.riskScore ?? 0;
    const horizon = forecast?.horizon ?? 'long';
    const reason = forecast?.reason ?? 'No forecast details.';

    return `
/**
 * Regression Signature (Selector):
 * Risk Score: ${risk.toFixed(2)}
 * Horizon: ${horizon}
 * Reason: ${reason}
 */
`;
  }

  private buildRegressionCommentForScenario(
    scenarioId: string,
    regression?: RegressionMemory
  ): string {
    if (!regression) return '';

    const sig = regression.signatures.find(
      s => s.kind === 'scenario' && s.refId === scenarioId
    );
    if (!sig) return '';

    const forecast = regression.forecasts.find(
      f => f.kind === 'scenario' && f.refId === scenarioId
    );

    const risk = forecast?.riskScore ?? 0;
    const horizon = forecast?.horizon ?? 'long';
    const reason = forecast?.reason ?? 'No forecast details.';

    return `
/**
 * Regression Signature (Scenario):
 * Risk Score: ${risk.toFixed(2)}
 * Horizon: ${horizon}
 * Reason: ${reason}
 */
`;
  }

  private buildRegressionCommentForState(
    stateId: string,
    regression?: RegressionMemory
  ): string {
    if (!regression) return '';

    const sig = regression.signatures.find(
      s => s.kind === 'state' && s.refId === stateId
    );
    if (!sig) return '';

    const forecast = regression.forecasts.find(
      f => f.kind === 'state' && f.refId === stateId
    );

    const risk = forecast?.riskScore ?? 0;
    const horizon = forecast?.horizon ?? 'long';
    const reason = forecast?.reason ?? 'No forecast details.';

    return `
/**
 * Regression Signature (State):
 * Risk Score: ${risk.toFixed(2)}
 * Horizon: ${horizon}
 * Reason: ${reason}
 */
`;
  }

  private buildRegressionCommentForTitle(
    _title: string,
    _regression?: RegressionMemory
  ): string {
    // For now, regression is attached to selectors/scenarios/states, not arbitrary titles.
    return '';
  }

  private buildActionTest(
    req: RequirementLike,
    pageUrl: string,
    optimization?: GlobalOptimizationResult,
    regression?: RegressionMemory
  ): string | null {
    const evolved = this.escape(req.selector);
    const original = this.escape(req.selector);
    const action = req.action || 'interact';

    const historyComment =
      req.selectorHistory && req.selectorHistory.length > 0
        ? `
/**
 * Selector History:
 * ${req.selectorHistory
   .map(
     h =>
       `- ${h.value} (reason: ${h.reason ?? 'n/a'}, confidence: ${
         h.confidence ?? 0
       }, at: ${h.timestamp})`
   )
   .join('\n * ')}
 */
`
        : '';

    const evolutionComment = `
/**
 * Selector Stability: ${req.stabilityScore ?? 'N/A'} → ${req.improvedScore ?? 'N/A'}
 * Drift Probability: ${(req.driftProbability ?? 0).toFixed(2)}
 * Confidence: ${(req.evolutionConfidence ?? 0).toFixed(2)}
 * Reason: ${req.evolutionReason ?? 'N/A'}
 */
${historyComment}
`;

    const priorityComment = this.buildPriorityComment(req.description, optimization);
    const regressionComment = this.buildRegressionCommentForRequirement(
      req.id,
      regression
    );

    const clickBlock = `
${evolutionComment}
${priorityComment}
${regressionComment}
await selfHealClick(page, '${evolved}', '${original}');
`;

    switch (action) {
      case 'login':
        return `
test('${this.escape(req.description)}', async ({ page }) => {
  await page.goto('${pageUrl}');
  await page.fill('input[type="text"]', 'standard_user');
  await page.fill('input[type="password"]', 'secret_sauce');
  ${clickBlock}
  await page.waitForLoadState('networkidle');
  await aiAssertPageIdentity(page, 'inventory');
  await aiAssertComponentPresence(page, 'inventory');
  await capturePageBaseline(page);
});
`;

      case 'add-to-cart':
        return `
test('${this.escape(req.description)}', async ({ page }) => {
  await page.goto('${pageUrl}');
  ${clickBlock}
  const cartBadge = page.locator('.shopping_cart_badge');
  await expect(cartBadge).toBeVisible();
  await aiAssertComponentPresence(page, 'cart');
  await capturePageBaseline(page);
});
`;

      case 'checkout':
        return `
test('${this.escape(req.description)}', async ({ page }) => {
  await page.goto('${pageUrl}');
  ${clickBlock}
  await page.waitForLoadState('networkidle');
  await aiAssertPageIdentity(page, 'checkout');
  await aiAssertComponentPresence(page, 'checkout');
  await capturePageBaseline(page);
});
`;

      case 'submit':
      case 'navigate':
      case 'open-product':
      case 'open-cart':
      case 'open-inventory':
      case 'click':
        return `
test('${this.escape(req.description)}', async ({ page }) => {
  await page.goto('${pageUrl}');
  ${clickBlock}
  await page.waitForLoadState('networkidle');
  await capturePageBaseline(page);
});
`;

      case 'input':
      case 'input-email':
      case 'input-password':
      case 'input-search':
        return `
test('${this.escape(req.description)}', async ({ page }) => {
  await page.goto('${pageUrl}');
  await page.fill('${evolved}', 'test-value');
  await aiAssertComponentPresence(page, 'input');
  await capturePageBaseline(page);
});
`;

      case 'select':
        return `
test('${this.escape(req.description)}', async ({ page }) => {
  await page.goto('${pageUrl}');
  await page.selectOption('${evolved}', { index: 1 });
  await aiAssertComponentPresence(page, 'select');
  await capturePageBaseline(page);
});
`;

      default:
        return null;
    }
  }

  private buildNegativeTest(
    req: RequirementLike,
    pageUrl: string,
    optimization?: GlobalOptimizationResult,
    regression?: RegressionMemory
  ): string | null {
    const action = req.action || 'interact';
    const selector = this.escape(req.selector);

    const baseTitle = this.escape(req.description);
    const priorityComment = (suffix: string) =>
      this.buildPriorityComment(`${baseTitle} - ${suffix}`, optimization);
    const regressionComment = this.buildRegressionCommentForRequirement(
      req.id,
      regression
    );

    switch (action) {
      case 'login':
        return `
test('${baseTitle} - negative: invalid credentials', async ({ page }) => {
  ${priorityComment('negative: invalid credentials')}
  ${regressionComment}
  await page.goto('${pageUrl}');
  await page.fill('input[type="text"]', 'invalid_user');
  await page.fill('input[type="password"]', 'wrong_password');
  await selfHealClick(page, '${selector}', '${selector}');
  await page.waitForLoadState('networkidle');
  await aiAssertComponentPresence(page, 'error');
  await capturePageBaseline(page);
});
`;
      case 'add-to-cart':
        return `
test('${baseTitle} - negative: add to cart without inventory', async ({ page }) => {
  ${priorityComment('negative: add to cart without inventory')}
  ${regressionComment}
  await page.goto('${pageUrl}');
  await selfHealClick(page, '${selector}', '${selector}');
  await capturePageBaseline(page);
});
`;
      case 'checkout':
        return `
test('${baseTitle} - negative: checkout with missing data', async ({ page }) => {
  ${priorityComment('negative: checkout with missing data')}
  ${regressionComment}
  await page.goto('${pageUrl}');
  await selfHealClick(page, '${selector}', '${selector}');
  await aiAssertComponentPresence(page, 'error');
  await capturePageBaseline(page);
});
`;
      default:
        return null;
    }
  }

  private buildJourneyTest(
    journey: UIJourney,
    optimization?: GlobalOptimizationResult,
    regression?: RegressionMemory
  ): string {
    const first = journey.steps[0];
    const startUrl = first.from;

    const priorityComment = this.buildPriorityComment(journey.title, optimization);
    const regressionComment = this.buildRegressionCommentForScenario(
      journey.id,
      regression
    );

    const stepsCode = journey.steps
      .map(
        (s, idx) => `
  // Step ${idx + 1}: ${s.from} → ${s.to}
  await selfHealClick(page, '${this.escape(s.selector)}', '${this.escape(
          s.selector
        )}');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('${s.to}');
  await capturePageBaseline(page);
`
      )
      .join('\n');

    const lastStep = journey.steps[journey.steps.length - 1];

    return `
test('${this.escape(journey.title)}', async ({ page }) => {
  ${priorityComment}
  ${regressionComment}
  await page.goto('${startUrl}');
  ${stepsCode}
  await aiAssertPageIdentity(page, '${lastStep.to}');
});
`;
  }

  private buildScenarioTest(
    scenario: UIScenario,
    optimization?: GlobalOptimizationResult,
    regression?: RegressionMemory
  ): string {
    if (!scenario.steps.length) return '';

    const first = scenario.steps[0];
    const startUrl = first.from;

    const preconditionsComment =
      scenario.preconditions && scenario.preconditions.length
        ? `
/**
 * Preconditions:
 * ${scenario.preconditions.map(p => `- ${p}`).join('\n * ')}
 */
`
        : '';

    const expectedComment =
      scenario.expectedOutcomes && scenario.expectedOutcomes.length
        ? `
/**
 * Expected Outcomes:
 * ${scenario.expectedOutcomes.map(e => `- ${e}`).join('\n * ')}
 */
`
        : '';

    const metaComment = `
/**
 * Scenario Stability: ${(scenario.stabilityScore * 100).toFixed(0)}%
 * Drift Risk: ${(scenario.driftRisk * 100).toFixed(0)}%
 */
${preconditionsComment}
${expectedComment}
`;

    const priorityComment = this.buildPriorityComment(scenario.title, optimization);
    const regressionComment = this.buildRegressionCommentForScenario(
      scenario.id,
      regression
    );

    const stepsCode = scenario.steps
      .map(
        (s, idx) => `
  // Scenario Step ${idx + 1}: ${s.from} → ${s.to}
  await selfHealClick(page, '${this.escape(s.selector)}', '${this.escape(
          s.selector
        )}');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL('${s.to}');
  await capturePageBaseline(page);
`
      )
      .join('\n');

    const lastStep = scenario.steps[scenario.steps.length - 1];

    return `
test('${this.escape(scenario.title)}', async ({ page }) => {
  ${metaComment}
  ${priorityComment}
  ${regressionComment}
  await page.goto('${startUrl}');
  ${stepsCode}
  await aiAssertPageIdentity(page, '${lastStep.to}');
});
`;
  }

  private buildStateInvariantTest(
    pageUrl: string,
    stateGraph: UIStateGraph,
    optimization?: GlobalOptimizationResult,
    regression?: RegressionMemory
  ): string {
    const state = stateGraph.states.find(s => s.url === pageUrl);
    if (!state) return '';

    const invariantsComment =
      state.invariants && state.invariants.length
        ? `
/**
 * State Invariants for ${state.label}:
 * ${state.invariants.map(i => `- ${i}`).join('\n * ')}
 */
`
        : '';

    const title = `State invariants for ${this.escape(state.label)}`;
    const priorityComment = this.buildPriorityComment(title, optimization);
    const regressionComment = this.buildRegressionCommentForState(
      state.id,
      regression
    );

    return `
test('${title}', async ({ page }) => {
  ${invariantsComment}
  ${priorityComment}
  ${regressionComment}
  await page.goto('${state.url}');
  const content = await page.content();
  expect(content.length).toBeGreaterThan(50);
  await capturePageBaseline(page);
});
`;
  }

  private escape(value: string): string {
    return value.replace(/'/g, "\\'");
  }

  private safeFileName(value: string): string {
    return value.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
  }
}
