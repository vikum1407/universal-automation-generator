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

interface LoginForm {
  usernameSelector: string;
  passwordSelector: string;
  buttonSelector: string;
  usernameValue: string;
  passwordValue: string;
}

export class UIMultiPageCrawler {
  // Depth 3 + crawl budget + hybrid auto-login
  async crawl(startUrl: string, maxDepth: number = 3, maxPages: number = 30): Promise<CrawledPage[]> {
    const browser = await chromium.launch({ headless: true });
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
      try {
        await this.gotoWithHybridWait(page, normalizedUrl);

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

        // Hybrid auto-login: detect and attempt login if a form is present
        const loginForm = await this.detectLoginForm(page);
        if (loginForm) {
          const loggedInUrl = await this.tryAutoLogin(page, normalizedUrl, loginForm);
          if (loggedInUrl) {
            const normalizedLoggedIn = this.normalizeUrl(loggedInUrl);
            if (
              new URL(normalizedLoggedIn).origin === root.origin &&
              !visited.has(normalizedLoggedIn) &&
              results.length < maxPages
            ) {
              queue.push({
                url: normalizedLoggedIn,
                depth: depth + 1,
                trace: [
                  ...trace,
                  {
                    from: normalizedUrl,
                    to: normalizedLoggedIn,
                    selector: loginForm.buttonSelector,
                    action: 'login'
                  }
                ]
              });
            }
          }
        }

        // Follow anchor links (same-origin, non-asset, not visited)
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
        // ignore navigation errors
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

  private async gotoWithHybridWait(page: Page, url: string) {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
    } catch {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    }
    await page.waitForTimeout(500);
  }

  private async detectLoginForm(page: Page): Promise<LoginForm | null> {
    const url = page.url();

    // SauceDemo-specific detection
    if (url.includes('saucedemo.com')) {
      const hasUser = await page.$('#user-name');
      const hasPass = await page.$('#password');
      const hasButton = await page.$('#login-button');

      if (hasUser && hasPass && hasButton) {
        return {
          usernameSelector: '#user-name',
          passwordSelector: '#password',
          buttonSelector: '#login-button',
          usernameValue: 'standard_user',
          passwordValue: 'secret_sauce'
        };
      }
    }

    // Generic login detection
    const passwordInput = await page.$('input[type="password"]');
    if (!passwordInput) return null;

    const usernameInput =
      (await page.$('input[type="email"]')) ||
      (await page.$('input[name*="user" i]')) ||
      (await page.$('input[name*="email" i]')) ||
      (await page.$('input[type="text"]'));

    const loginButton =
      (await page.$('button:has-text("login")')) ||
      (await page.$('button:has-text("sign in")')) ||
      (await page.$('input[type="submit"]')) ||
      (await page.$('button'));

    if (!usernameInput || !loginButton) return null;

    const usernameSelector = await this.buildElementSelector(page, usernameInput);
    const passwordSelector = await this.buildElementSelector(page, passwordInput);
    const buttonSelector = await this.buildElementSelector(page, loginButton);

    if (!usernameSelector || !passwordSelector || !buttonSelector) return null;

    return {
      usernameSelector,
      passwordSelector,
      buttonSelector,
      usernameValue: 'test@example.com',
      passwordValue: 'Password123!'
    };
  }

  private async buildElementSelector(page: Page, handle: any): Promise<string | null> {
    try {
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
      }, handle);
      return selector || null;
    } catch {
      return null;
    }
  }

  private async tryAutoLogin(page: Page, currentUrl: string, form: LoginForm): Promise<string | null> {
    try {
      const beforeUrl = page.url();

      await page.fill(form.usernameSelector, form.usernameValue);
      await page.fill(form.passwordSelector, form.passwordValue);

      const [nav] = await Promise.all([
        (async () => {
          try {
            await page.waitForLoadState('networkidle', { timeout: 8000 });
          } catch {
            await page.waitForLoadState('domcontentloaded', { timeout: 8000 });
          }
        })(),
        page.click(form.buttonSelector)
      ]);

      await page.waitForTimeout(500);

      const afterUrl = page.url();
      if (afterUrl && afterUrl !== beforeUrl && afterUrl !== currentUrl) {
        return afterUrl;
      }
    } catch {
      // ignore login failures
    }
    return null;
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
