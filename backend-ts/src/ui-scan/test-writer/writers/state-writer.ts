import { CommentsWriter } from './comments-writer';

export class StateWriter {
  private comments = new CommentsWriter();

  build(pageUrl, stateGraph, optimization, regression, rootCause) {
    const state = stateGraph.states.find(s => s.url === pageUrl);
    if (!state) return '';

    const priority = this.comments.priority(`State invariants for ${state.label}`, optimization);
    const regressionComment = this.comments.regressionState(state.id, regression);
    const rca = this.comments.rcaState(state.id, rootCause);

    const invariants = state.invariants
      .map(i => `- ${i}`)
      .join('\n * ');

    return `
test('State invariants for ${state.label}', async ({ page }) => {
  /**
   * State Invariants:
   * ${invariants}
   */
  ${priority}
  ${regressionComment}
  ${rca}
  await page.goto('${state.url}');
  const content = await page.content();
  expect(content.length).toBeGreaterThan(50);
  await capturePageBaseline(page);
});
`;
  }
}
