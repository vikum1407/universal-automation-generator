import { chromium } from 'playwright';
import { UIScanPage, UIScanResult } from './ui-scan.model';
import { UISelectorExtractor } from './ui-selector-extractor';

export class UICrawler {
  private visited = new Set<string>();
  private extractor = new UISelectorExtractor();

  constructor(
    private baseUrl: string,
    private maxDepth: number = 1,
    private maxPages: number = 20
  ) {}

  private isInternalLink(url: string): boolean {
    try {
      const u = new URL(url, this.baseUrl);
      return u.origin === new URL(this.baseUrl).origin;
    } catch {
      return false;
    }
  }

  async crawl(): Promise<UIScanResult> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const results: UIScanPage[] = [];
    const queue: string[] = [this.baseUrl];

    while (queue.length > 0 && results.length < this.maxPages) {
      const currentUrl = queue.shift()!;
      if (this.visited.has(currentUrl)) continue;

      this.visited.add(currentUrl);

      try {
        await page.goto(currentUrl, { waitUntil: 'domcontentloaded' });

        const title = await page.title();
        const html = await page.content();
        const extracted = this.extractor.extract(html, currentUrl);

        results.push({
          url: currentUrl,
          title,
          html,
          selectors: extracted as any
        });

        const clickTargets = await page.evaluate(() => {
          const items: { selector: string; targetUrl: string }[] = [];

          document.querySelectorAll('a[href]').forEach((el) => {
            items.push({
              selector: el.id ? `#${el.id}` : `a[href="${el.getAttribute('href')}"]`,
              targetUrl: (el as HTMLAnchorElement).href
            });
          });

          document.querySelectorAll('button').forEach((el) => {
            items.push({
              selector: el.id ? `#${el.id}` : 'button',
              targetUrl: window.location.href
            });
          });

          document.querySelectorAll('[data-test]').forEach((el) => {
            items.push({
              selector: `[data-test="${el.getAttribute('data-test')}"]`,
              targetUrl: window.location.href
            });
          });

          document.querySelectorAll('[role="button"]').forEach((el) => {
            items.push({
              selector: el.id ? `#${el.id}` : '[role="button"]',
              targetUrl: window.location.href
            });
          });

          return items;
        });

        for (const item of clickTargets) {
          const target = item.targetUrl;
          if (
            this.isInternalLink(target) &&
            !this.visited.has(target) &&
            queue.length < this.maxPages
          ) {
            queue.push(target);
          }
        }
      } catch (err) {
        console.error(`Failed to crawl ${currentUrl}`, err);
      }
    }

    await browser.close();

    return { pages: results };
  }
}
