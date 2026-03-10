import { escapeSelector, FlowGraph } from './helpers';
import { CommentsWriter } from './comments-writer';

export class FlowWriter {
  private comments = new CommentsWriter();

  build(pageUrl: string, flowGraph: FlowGraph, optimization?: any, regression?: any, rootCause?: any) {
    const tests: string[] = [];

    const edges = flowGraph.edges.filter(e => e.from === pageUrl);

    for (const edge of edges) {
      const selector = escapeSelector(edge.selector || '');
      const title = `Navigate from ${edge.from} to ${edge.to}`;

      const priority = this.comments.priority(title, optimization);
      const regressionComment = ''; // navigation has no regression signature
      const rca = ''; // navigation has no RCA node

      tests.push(`
test('${title}', async ({ page }) => {
  ${priority}
  ${regressionComment}
  ${rca}
  await page.goto('${edge.from}');
  await selfHealClick(page, '${selector}', '${selector}');
  await expect(page).toHaveURL('${edge.to}');
  await capturePageBaseline(page);
});
`);
    }

    return tests;
  }
}
