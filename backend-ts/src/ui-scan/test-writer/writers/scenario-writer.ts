import { escapeSelector } from './helpers';
import { CommentsWriter } from './comments-writer';

export class ScenarioWriter {
  private comments = new CommentsWriter();

  build(scenario, optimization, regression, rootCause) {
    const priority = this.comments.priority(scenario.title, optimization);
    const regressionComment = this.comments.regressionScenario(scenario.id, regression);
    const rca = this.comments.rcaScenario(scenario.id, rootCause);

    const steps = scenario.steps
      .map(
        (s, i) => `
  // Scenario Step ${i + 1}: ${s.from} → ${s.to}
  await selfHealClick(page, '${escapeSelector(s.selector)}', '${escapeSelector(s.selector)}');
  await expect(page).toHaveURL('${s.to}');
  await capturePageBaseline(page);
`
      )
      .join('\n');

    const start = scenario.steps[0].from;
    const end = scenario.steps[scenario.steps.length - 1].to;

    return `
test('${scenario.title}', async ({ page }) => {
  ${priority}
  ${regressionComment}
  ${rca}
  await page.goto('${start}');
  ${steps}
  await aiAssertPageIdentity(page, '${end}');
});
`;
  }
}
