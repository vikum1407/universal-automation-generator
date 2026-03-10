import { chromium, Page, Browser } from 'playwright';
import { UISelectorExtractor, UIScanNode } from './ui-selector-extractor';

export interface ExploredPage {
  url: string;
  nodes: UIScanNode[];
}

export interface UIExplorationResult {
  pages: ExploredPage[];
}

export class UIExplorer {
  private extractor = new UISelectorExtractor();

  async explore(
    startUrl: string,
    options?: {
      maxDepth?: number;
      maxPages?: number;
      maxActionsPerPage?: number;
      waitAfterNavigationMs?: number;
    }
  ): Promise<UIExplorationResult> {
    const maxDepth = options?.maxDepth ?? 2;
    const maxPages = options?.maxPages ?? 10;
    const maxActionsPerPage = options?.maxActionsPerPage ?? 10;
    const waitAfterNavigationMs = options?.waitAfterNavigationMs ?? 1500;

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const visited = new Set<string>();
    const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];
    const pages: ExploredPage[] = [];

    try {
      while (queue.length > 0 && pages.length < maxPages) {
        const { url, depth } = queue.shift()!;
        if (visited.has(url)) continue;
        visited.add(url);

        await this.safeGoto(page, url, waitAfterNavigationMs);

        const html = await page.content();
        const nodes = this.extractor.extract(html, url);
        pages.push({ url, nodes });

        if (depth >= maxDepth) continue;

        const clickable = nodes.filter(
          n =>
            (n.action && n.action !== 'input' && n.action !== 'select') ||
            (n.selector && (n.selector.includes('button') || n.selector.includes('a')))
        );

        const limited = clickable.slice(0, maxActionsPerPage);

        for (const node of limited) {
          const targetSelector = node.selector;
          if (!targetSelector) continue;

          const beforeUrl = page.url();
          try {
            await page.click(targetSelector, { timeout: 2000 });
            await page.waitForTimeout(waitAfterNavigationMs);
          } catch {
            continue;
          }

          const afterUrl = page.url();
          if (afterUrl !== beforeUrl && !visited.has(afterUrl)) {
            queue.push({ url: afterUrl, depth: depth + 1 });
          }

          await this.safeGoto(page, url, waitAfterNavigationMs);
        }
      }
    } finally {
      await this.safeClose(browser);
    }

    return { pages };
  }

  private async safeGoto(page: Page, url: string, waitMs: number) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(waitMs);
    } catch {
      // ignore navigation failures
    }
  }

  private async safeClose(browser: Browser) {
    try {
      await browser.close();
    } catch {
      // ignore
    }
  }
}
