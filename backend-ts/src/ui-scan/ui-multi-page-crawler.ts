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
  attributes?: Record<string, string>;
}

export interface NavigationTrace {
  from: string;
  to: string;
  selector?: string;
  action?: string;
}

interface LoginForm {
  usernameSelector: string;
  passwordSelector: string;
  buttonSelector: string;
  usernameValue: string;
  passwordValue: string;
}

export class UIMultiPageCrawler {
  async crawl(startUrl: string, maxDepth: number = 3, maxPages: number = 30): Promise<CrawledPage[]> {
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1280,720'
      ]
    });

    try {
      return await this.crawlInternal(browser, startUrl, maxDepth, maxPages);
    } finally {
      await browser.close();
    }
  }

  private async crawlInternal(
    browser: Browser,
    startUrl: string,
    maxDepth: number,
    maxPages: number
  ): Promise<CrawledPage[]> {
    const root = new URL(startUrl);
    const visited = new Set<string>();
    const results: CrawledPage[] = [];

    const queue: { url: string; depth: number; trace: NavigationTrace[] }[] = [
      { url: startUrl, depth: 0, trace: [] }
    ];

    while (queue.length > 0 && results.length < maxPages) {
      const { url, depth, trace } = queue.shift()!;
      const normalizedUrl = this.normalizeUrl(url);

      if (visited.has(normalizedUrl)) continue;
      visited.add(normalizedUrl);

      const page = await browser.newPage();

      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
      });

      try {
        await this.gotoSafe(page, normalizedUrl);

        const html = await page.content();
        const components = await this.extractComponents(page);
        const screenshotPath = await this.captureScreenshotIfInteractive(page, components);

        results.push({
          url: normalizedUrl,
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
          anchors
            .map(a => ({
              href: (a as HTMLAnchorElement).href,
              rawHref: (a as HTMLAnchorElement).getAttribute('href') || ''
            }))
            .filter(a => !!a.href)
        );

        for (const link of links) {
          let target: URL;
          try {
            target = new URL(link.href, normalizedUrl);
          } catch {
            continue;
          }

          if (target.origin !== root.origin) continue;
          if (this.isAsset(target.pathname)) continue;

          const normalizedTarget = this.normalizeUrl(target.toString());
          if (visited.has(normalizedTarget)) continue;

          if (results.length + queue.length >= maxPages) break;

          queue.push({
            url: normalizedTarget,
            depth: depth + 1,
            trace: [
              ...trace,
              {
                from: normalizedUrl,
                to: normalizedTarget,
                selector: `a[href="${link.rawHref}"]`,
                action: 'navigate'
              }
            ]
          });
        }
      } catch {
      } finally {
        await page.close();
      }
    }

    return results;
  }

  private normalizeUrl(url: string): string {
    try {
      const u = new URL(url);
      u.hash = '';
      return u.toString();
    } catch {
      return url.split('#')[0];
    }
  }

  private async gotoSafe(page: Page, url: string) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
    } catch {}

    await page.waitForTimeout(300);
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
          let selector = (e as HTMLElement).nodeName.toLowerCase();
          if ((e as HTMLElement).id) {
            selector += `#${(e as HTMLElement).id}`;
            path.unshift(selector);
            break;
          } else {
            let sib = e;
            let nth = 1;
            while ((sib = (sib.previousElementSibling as HTMLElement | null)) != null) nth++;
            selector += `:nth-child(${nth})`;
          }
          path.unshift(selector);
          e = e.parentElement as HTMLElement | null;
        }
        return path.join(' > ');
      }, el);

      const attributes = await page.evaluate(e => {
        const attrs: Record<string, string> = {};
        for (const attr of (e as HTMLElement).attributes) {
          attrs[attr.name] = attr.value;
        }
        return attrs;
      }, el);

      components.push({
        selector,
        text,
        role: role || undefined,
        boundingBox: box || undefined,
        visible,
        interactive,
        attributes
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
