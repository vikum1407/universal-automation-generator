export class ScenarioWriter {
  build(scenario, optimization, regression, rootCause) {
    const risk = scenario.risk?.score ?? 0;
    const priority = scenario.risk?.priority ?? 'P2';

    const steps = scenario.steps
      .map(
        (s, i) => `
  // Scenario Step ${i + 1}: ${s.from} → ${s.to}
  await selfHealClick(page, '${s.selector}');
  await expect(page).toHaveURL('${s.to}');
  await capturePageBaseline(page);
`
      )
      .join('\n');

    const start = scenario.steps[0].from;
    const end = scenario.steps[scenario.steps.length - 1].to;

    return `
import { test, expect } from '@playwright/test';

test('${scenario.title}', async ({ page }) => {
  // Priority: ${priority}
  // Risk Score: ${risk.toFixed(2)}

  await page.goto('${start}');
  ${steps}
  await aiAssertPageIdentity(page, '${end}');
});
`;
  }
}
