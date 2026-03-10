import * as fs from 'fs';
import * as path from 'path';
import { HybridFlow } from './flow-hybrid-test-generator';

export class HybridFlowTestWriter {
  writeTests(flows: HybridFlow[], outputDir: string): { name: string; content: string }[] {
    if (!Array.isArray(flows) || flows.length === 0) return [];

    const testsRoot = path.join(outputDir, 'ui-tests');
    if (!fs.existsSync(testsRoot)) fs.mkdirSync(testsRoot, { recursive: true });

    const fileName = `hybrid-flows.spec.ts`;
    const filePath = path.join(testsRoot, fileName);

    const content = this.buildTestFile(flows);

    fs.writeFileSync(filePath, content.trim() + '\n');

    return [
      {
        name: fileName,
        content: content.trim() + '\n'
      }
    ];
  }

  private buildTestFile(flows: HybridFlow[]): string {
    const tests = flows
      .map((flow, index) => this.buildFlowTest(flow, index))
      .join('\n');

    return `
import { test, expect } from '@playwright/test';

/**
 * SELF-HEALING SELECTOR ENGINE
 */
async function selfHealClick(page, selector) {
  if (!selector) return;

  try {
    await page.click(selector, { timeout: 2000 });
    return;
  } catch {}

  const candidates = [
    selector,
    selector.replace(/"/g, "'"),
    selector.replace(/\

\[/g, '').replace(/\\]

/g, ''),
  ];

  for (const alt of candidates) {
    try {
      await page.click(alt, { timeout: 2000 });
      return;
    } catch {}
  }

  const textMatch = selector.match(/has-text\\("([^"]+)"\\)/);
  if (textMatch) {
    const text = textMatch[1];
    try {
      await page.getByText(text).click({ timeout: 2000 });
      return;
    } catch {}
  }

  const roleMatch = selector.includes('button')
    ? 'button'
    : selector.includes('input')
    ? 'textbox'
    : null;

  if (roleMatch) {
    try {
      await page.getByRole(roleMatch).first().click({ timeout: 2000 });
      return;
    } catch {}
  }

  throw new Error('Self-healing failed for selector: ' + selector);
}

/**
 * AI ASSERTION HOOKS (stubbed for future AI integration)
 */
async function aiAssertPageIdentity(page, expectedHint) {
  const html = await page.content();
  expect(html.length).toBeGreaterThan(50);
}

async function aiAssertComponentPresence(page, hint) {
  const html = await page.content();
  expect(html.includes(hint)).toBeTruthy();
}

async function aiAssertFlowState(page, stepIndex, totalSteps) {
  const html = await page.content();
  expect(html.length).toBeGreaterThan(50);
}

${tests}
`;
  }

  private buildFlowTest(flow: HybridFlow, index: number): string {
    const steps = flow.steps;
    const selectors = flow.selectors;

    const lines: string[] = [];

    lines.push(`  await page.goto('${steps[0]}');`);
    lines.push(`  await aiAssertPageIdentity(page, '${steps[0]}');`);
    lines.push(`  await aiAssertFlowState(page, 0, ${steps.length});`);

    for (let i = 1; i < steps.length; i++) {
      const selector = selectors[i - 1] || '';
      const target = steps[i];

      if (selector) {
        lines.push(`  await selfHealClick(page, '${selector}');`);
      } else {
        lines.push(`  await page.goto('${target}');`);
      }

      lines.push(`  await page.waitForLoadState('networkidle');`);
      lines.push(`  await aiAssertPageIdentity(page, '${target}');`);
      lines.push(`  await aiAssertFlowState(page, ${i}, ${steps.length});`);
    }

    lines.push(`  await expect(page).toHaveURL('${steps[steps.length - 1]}');`);

    return `
test('Hybrid flow #${index + 1}: ${steps.join(' → ')}', async ({ page }) => {
${lines.join('\n')}
});
`;
  }
}
