import { escapeSelector } from './helpers';
import { CommentsWriter } from './comments-writer';

export class ActionWriter {
  private comments = new CommentsWriter();

  build(req, pageUrl, optimization, regression, rootCause) {
    const evolved = escapeSelector(req.selector);
    const original = escapeSelector(req.selector);
    const action = req.action || 'interact';

    const priority = this.comments.priority(req.description, optimization);
    const regressionComment = this.comments.regressionSelector(req.id, regression);
    const rca = this.comments.rcaSelector(req.id, rootCause);

    const clickBlock = `
${priority}
${regressionComment}
${rca}
await selfHealClick(page, '${evolved}', '${original}');
`;

    switch (action) {
      case 'login':
        return `
test('${req.description}', async ({ page }) => {
  await page.goto('${pageUrl}');
  await page.fill('input[type="text"]', 'standard_user');
  await page.fill('input[type="password"]', 'secret_sauce');
  ${clickBlock}
  await page.waitForLoadState('networkidle');
  await aiAssertPageIdentity(page, 'inventory');
  await capturePageBaseline(page);
});
`;

      case 'add-to-cart':
        return `
test('${req.description}', async ({ page }) => {
  await page.goto('${pageUrl}');
  ${clickBlock}
  const cartBadge = page.locator('.shopping_cart_badge');
  await expect(cartBadge).toBeVisible();
  await capturePageBaseline(page);
});
`;

      default:
        return `
test('${req.description}', async ({ page }) => {
  await page.goto('${pageUrl}');
  ${clickBlock}
  await page.waitForLoadState('networkidle');
  await capturePageBaseline(page);
});
`;
    }
  }
}
