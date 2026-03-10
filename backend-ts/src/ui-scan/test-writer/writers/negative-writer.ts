import { escapeSelector } from './helpers';
import { CommentsWriter } from './comments-writer';

export class NegativeWriter {
  private comments = new CommentsWriter();

  build(req, pageUrl, optimization, regression, rootCause) {
    const selector = escapeSelector(req.selector);
    const base = req.description;

    const regressionComment = this.comments.regressionSelector(req.id, regression);
    const rca = this.comments.rcaSelector(req.id, rootCause);

    switch (req.action) {
      case 'login':
        return `
test('${base} - negative: invalid credentials', async ({ page }) => {
  ${this.comments.priority(base + ' - negative', optimization)}
  ${regressionComment}
  ${rca}
  await page.goto('${pageUrl}');
  await page.fill('input[type="text"]', 'invalid_user');
  await page.fill('input[type="password"]', 'wrong_password');
  await selfHealClick(page, '${selector}', '${selector}');
  await aiAssertComponentPresence(page, 'error');
  await capturePageBaseline(page);
});
`;

      default:
        return null;
    }
  }
}
