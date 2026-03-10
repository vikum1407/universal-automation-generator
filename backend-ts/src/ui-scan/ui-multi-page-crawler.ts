import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';

export interface CrawledPage {
  url: string;
  html: string;
  screenshotPath?: string;
  components?: ComponentMeta[];
  navigationTrace?: NavigationTrace[];
}

export interface ComponentMeta {
  selector: string;
  text?: string;
  role?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  visible: boolean;
  interactive: boolean;
}

export interface NavigationTrace {
  from: string;
  to: string;
  selector?: string;
  action?: string;
}

export class UIMultiPageCrawler {
  async crawl(startUrl: string, maxDepth: number = 2): Promise<CrawledPage[]> {
    const browser = await chromium.launch({ headless: true });
    try {
      return await this.crawlInternal(browser, startUrl, maxDepth);
    } finally {
      await browser.close();
    }
  }

  private async crawlInternal(browser: Browser, startUrl: string, maxDepth: number): Promise<CrawledPage[]> {
    const root = new URL(startUrl);
    const visited = new Set<string>();
    const results: CrawledPage[] = [];

    const queue: { url: string; depth: number; trace: NavigationTrace[] }[] = [
      { url: startUrl, depth: 0, trace: [] }
    ];

    while (queue.length > 0) {
      const { url, depth, trace } = queue.shift()!;
      if (visited.has(url)) continue;
      visited.add(url);

      const page = await browser.newPage();
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(500);

        const html = await page.content();

        const components = await this.extractComponents(page);

        const screenshotPath = await this.captureScreenshotIfInteractive(page, components);

        results.push({
          url,
          html,
          screenshotPath,
          components,
          navigationTrace: trace
        });

        if (depth >= maxDepth) {
          await page.close();
          continue;
        }

        const links = await page.$$eval('a[href]', anchors =>
          anchors.map(a => (a as HTMLAnchorElement).href).filter(Boolean)
        );

        for (const href of links) {
          let target: URL;
          try {
            target = new URL(href, url);
          } catch {
            continue;
          }

          if (target.origin !== root.origin) continue;
          if (this.isAsset(target.pathname)) continue;

          const normalized = target.toString().split('#')[0];

          if (!visited.has(normalized)) {
            queue.push({
              url: normalized,
              depth: depth + 1,
              trace: [...trace, { from: url, to: normalized, selector: 'a[href]', action: 'navigate' }]
            });
          }
        }
      } catch {
        // ignore navigation errors
      } finally {
        await page.close();
      }
    }

    return results;
  }

  private async extractComponents(page: Page): Promise<ComponentMeta[]> {
    const elements = await page.$$('*');

    const components: ComponentMeta[] = [];

    for (const el of elements) {
      const box = await el.boundingBox();
      const visible = !!box;
      const role = await el.getAttribute('role');
      const text = (await el.textContent())?.trim() || '';

      const interactive =
        (await el.isEnabled().catch(() => false)) &&
        (await el.isVisible().catch(() => false));

      const selector = await page.evaluate(e => {
        const path: string[] = [];
        while (e && e.nodeType === Node.ELEMENT_NODE) {
          let selector = e.nodeName.toLowerCase();
          if (e.id) {
            selector += `#${e.id}`;
            path.unshift(selector);
            break;
          } else {
            let sib = e;
            let nth = 1;
            while ((sib = (sib.previousElementSibling as HTMLElement | null)) != null) nth++;
            selector += `:nth-child(${nth})`;
          }
          path.unshift(selector);
          e = e.parentElement;
        }
        return path.join(' > ');
      }, el);

      components.push({
        selector,
        text,
        role: role || undefined,
        boundingBox: box || undefined,
        visible,
        interactive
      });
    }

    return components;
  }

  private async captureScreenshotIfInteractive(page: Page, components: ComponentMeta[]): Promise<string | undefined> {
    const hasInteractive = components.some(c => c.interactive);

    if (!hasInteractive) return undefined;

    const fileName = `screenshot-${Date.now()}.png`;
    const filePath = `./.qlitz-snapshots/${fileName}`;

    await fs.promises.mkdir('./.qlitz-snapshots', { recursive: true });
    await page.screenshot({ path: filePath, fullPage: true });

    return filePath;
  }

  private isAsset(pathname: string): boolean {
    const lower = pathname.toLowerCase();
    return (
      lower.endsWith('.png') ||
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.gif') ||
      lower.endsWith('.svg') ||
      lower.endsWith('.ico') ||
      lower.endsWith('.css') ||
      lower.endsWith('.js') ||
      lower.endsWith('.woff') ||
      lower.endsWith('.woff2') ||
      lower.endsWith('.ttf') ||
      lower.endsWith('.eot') ||
      lower.endsWith('.pdf')
    );
  }
}
