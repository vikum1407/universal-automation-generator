export class JourneyWriter {
  build(journey, optimization, regression, rootCause) {
    const risk = journey.risk?.score ?? 0;
    const priority = journey.risk?.priority ?? 'P2';

    const steps = journey.steps
      .map(
        (s, i) => `
  // Step ${i + 1}: ${s.from} → ${s.to}
  await selfHealClick(page, '${s.selector}');
  await expect(page).toHaveURL('${s.to}');
  await capturePageBaseline(page);
`
      )
      .join('\n');

    const start = journey.steps[0].from;
    const end = journey.steps[journey.steps.length - 1].to;

    return `
import { test, expect } from '@playwright/test';

test('${journey.title}', async ({ page }) => {
  // Priority: ${priority}
  // Risk Score: ${risk.toFixed(2)}

  await page.goto('${start}');
  ${steps}
  await aiAssertPageIdentity(page, '${end}');
});
`;
  }
}
