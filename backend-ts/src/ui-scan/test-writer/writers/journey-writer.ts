import { escapeSelector } from './helpers';
import { CommentsWriter } from './comments-writer';

export class JourneyWriter {
  private comments = new CommentsWriter();

  build(journey, optimization, regression, rootCause) {
    const priority = this.comments.priority(journey.title, optimization);
    const regressionComment = this.comments.regressionScenario(journey.id, regression);
    const rca = this.comments.rcaScenario(journey.id, rootCause);

    const steps = journey.steps
      .map(
        (s, i) => `
  // Step ${i + 1}: ${s.from} → ${s.to}
  await selfHealClick(page, '${escapeSelector(s.selector)}', '${escapeSelector(s.selector)}');
  await expect(page).toHaveURL('${s.to}');
  await capturePageBaseline(page);
`
      )
      .join('\n');

    const start = journey.steps[0].from;
    const end = journey.steps[journey.steps.length - 1].to;

    return `
test('${journey.title}', async ({ page }) => {
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
