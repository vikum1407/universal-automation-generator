import { Injectable, Logger } from '@nestjs/common';
import { chromium } from 'playwright';
import type { Page, Browser } from 'playwright';
import type { PageMap, PageInfo, FormInfo, FieldInfo, ButtonInfo, NavLink } from './crawler.types';

@Injectable()
export class PlaywrightCrawlerService {
  private readonly logger   = new Logger(PlaywrightCrawlerService.name);
  private readonly MAX_PAGES  = 10;
  private readonly TIMEOUT_MS = 10_000;

  async crawl(websiteUrl: string): Promise<PageMap> {
    const base    = this.normaliseBase(websiteUrl);
    const visited = new Set<string>();
    const queue   = [base];
    const pages:  PageInfo[] = [];

    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent: 'Qlitz-Crawler/2.0',
        ignoreHTTPSErrors: true,
      });
      context.setDefaultTimeout(this.TIMEOUT_MS);

      while (queue.length && pages.length < this.MAX_PAGES) {
        const url = queue.shift()!;
        if (visited.has(url)) continue;
        visited.add(url);

        const page = await context.newPage();
        try {
          await page.goto(url, { waitUntil: 'load', timeout: this.TIMEOUT_MS });
          // Allow JS frameworks (React / Vue / Angular) time to render their initial DOM
          await page.waitForTimeout(1200);
          const pageInfo = await this.parsePage(page, url, base);
          pages.push(pageInfo);

          for (const link of pageInfo.navLinks.filter(l => l.isInternal)) {
            if (!visited.has(link.href) && !queue.includes(link.href)) {
              queue.push(link.href);
            }
          }
          this.logger.debug(`Crawled: ${url} (${pageInfo.forms.length} forms, ${pageInfo.navLinks.length} links)`);
        } catch (err: any) {
          this.logger.warn(`Skip ${url}: ${err?.message}`);
        } finally {
          await page.close();
        }
      }

      await context.close();
    } finally {
      await browser?.close();
    }

    this.logger.log(`Crawl complete: ${pages.length} pages from ${base}`);
    return { baseUrl: base, pages, crawledAt: new Date().toISOString() };
  }

  // ─── Page analysis ────────────────────────────────────────────────────────────

  private async parsePage(page: Page, url: string, base: string): Promise<PageInfo> {
    const path      = new URL(url).pathname;
    const title     = await page.title() || path;
    const className = this.toClassName(path);

    const [forms, buttons, navLinks, headings, hasTable, hasModal] = await Promise.all([
      this.parseForms(page),
      this.parseButtons(page),
      this.parseNavLinks(page, base),
      this.parseHeadings(page),
      page.locator('table, [role="grid"], [role="table"]').count().then(c => c > 0),
      page.locator('[role="dialog"], .modal, [class*="modal"]').count().then(c => c > 0),
    ]);

    const isAuthProtected = this.detectAuthProtected(title, await page.locator('input[type="password"]').count());

    return { url, path, title, className, forms, buttons, navLinks, headings, isAuthProtected, hasTable, hasModal };
  }

  private async parseForms(page: Page): Promise<FormInfo[]> {
    const formCount = await page.locator('form').count();
    const forms: FormInfo[] = [];
    for (let i = 0; i < formCount; i++) {
      const form   = page.locator('form').nth(i);
      const action = (await form.getAttribute('action')) ?? '';
      const method = ((await form.getAttribute('method')) ?? 'GET').toUpperCase();
      const id     = (await form.getAttribute('id')) ?? (await form.getAttribute('name')) ?? `form_${i}`;
      const fields = await this.parseFields(form, page);
      const purpose = this.detectFormPurpose(action, fields);
      const isInModal = await form.evaluate((el: Element) => {
        let p = el.parentElement;
        while (p) {
          const cls  = p.getAttribute('class') ?? '';
          const role = p.getAttribute('role') ?? '';
          if (role === 'dialog' || cls.includes('modal') || cls.includes('dialog') || cls.includes('overlay') || cls.includes('popup')) return true;
          p = p.parentElement;
        }
        return false;
      }).catch(() => false);
      forms.push({ id, action, method, purpose, fields, ...(isInModal ? { isInModal } : {}) });
    }
    return forms;
  }

  private async parseFields(form: import('playwright').Locator, page: Page): Promise<FieldInfo[]> {
    const inputs  = form.locator('input, select, textarea');
    const count   = await inputs.count();
    const fields: FieldInfo[] = [];

    for (let i = 0; i < count; i++) {
      const el    = inputs.nth(i);
      const tag   = await el.evaluate(e => e.tagName.toLowerCase());
      const type  = (await el.getAttribute('type')) ?? (tag === 'select' ? 'select' : tag === 'textarea' ? 'textarea' : 'text');
      if (['submit', 'button', 'reset', 'image', 'hidden'].includes(type)) continue;

      const name  = (await el.getAttribute('name')) ?? (await el.getAttribute('id')) ?? '';
      const id    = (await el.getAttribute('id')) ?? '';
      const label = await this.findLabel(page, id, name);
      const required = await el.evaluate(e => (e as HTMLInputElement).required || e.getAttribute('aria-required') === 'true');

      let options: string[] = [];
      if (tag === 'select') {
        options = await el.evaluate(e =>
          Array.from((e as HTMLSelectElement).options)
            .map(o => o.value)
            .filter(v => v && v !== '')
        );
      }

      const minLength = await el.getAttribute('minlength').then(v => v ? Number(v) : undefined);
      const maxLength = await el.getAttribute('maxlength').then(v => v ? Number(v) : undefined);

      fields.push({
        name, type, label, required,
        ...(options.length  ? { options }   : {}),
        ...(minLength != null ? { minLength } : {}),
        ...(maxLength != null ? { maxLength } : {}),
      });
    }
    return fields;
  }

  private async findLabel(page: Page, id: string, name: string): Promise<string> {
    if (id) {
      const lbl = await page.locator(`label[for="${id}"]`).first().textContent().catch(() => '');
      if (lbl?.trim()) return lbl.trim();
    }
    return name;
  }

  private async parseButtons(page: Page): Promise<ButtonInfo[]> {
    const btns  = page.locator('button, [role="button"], input[type="submit"]');
    const count = await btns.count();
    const buttons: ButtonInfo[] = [];
    for (let i = 0; i < Math.min(count, 20); i++) {
      const el   = btns.nth(i);
      const text = (await el.textContent())?.trim() ?? (await el.getAttribute('aria-label')) ?? '';
      const type = (await el.getAttribute('type')) ?? 'button';
      if (text) buttons.push({ text, type, role: this.detectButtonRole(text, type) });
    }
    return buttons;
  }

  private async parseNavLinks(page: Page, base: string): Promise<NavLink[]> {
    const links: NavLink[] = [];
    const seen  = new Set<string>();

    const anchors = await page.locator('a[href]').all();
    for (const a of anchors) {
      const href = (await a.getAttribute('href')) ?? '';
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      const abs = this.toAbsolute(href, base, page.url());
      if (!abs || seen.has(abs)) continue;
      seen.add(abs);
      const isInternal = abs.startsWith(base);
      const path = isInternal ? new URL(abs).pathname : href;
      const text = (await a.textContent())?.trim() ?? '';
      links.push({ text, href: abs, isInternal, path });
    }
    return links;
  }

  private async parseHeadings(page: Page): Promise<string[]> {
    const headings: string[] = [];
    const els = await page.locator('h1, h2').all();
    for (const el of els.slice(0, 5)) {
      const text = (await el.textContent())?.trim();
      if (text) headings.push(text);
    }
    return headings;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private detectFormPurpose(action: string, fields: FieldInfo[]): string {
    const hasPassword = fields.some(f => f.type === 'password');
    const hasEmail    = fields.some(f => f.type === 'email' || f.name.toLowerCase().includes('email'));
    if (hasPassword && hasEmail && fields.length <= 4) return 'login';
    if (hasPassword && fields.length > 4)              return 'register';
    if (action.toLowerCase().includes('search') || fields.some(f => f.name === 'q' || f.name === 'search')) return 'search';
    if (action.toLowerCase().includes('contact'))      return 'contact';
    return 'generic';
  }

  private detectButtonRole(text: string, type: string): string {
    const t = text.toLowerCase();
    if (type === 'submit' || ['login', 'sign in', 'register', 'submit', 'save', 'create', 'add', 'update', 'delete'].some(k => t.includes(k))) return 'submit';
    if (['next', 'back', 'previous', 'continue', 'go to'].some(k => t.includes(k))) return 'nav';
    return 'action';
  }

  private detectAuthProtected(title: string, pwCount: number): boolean {
    const t = title.toLowerCase();
    return pwCount > 0 || ['dashboard', 'account', 'profile', 'settings', 'admin'].some(k => t.includes(k));
  }

  private toClassName(path: string): string {
    const parts = path.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
    if (!parts.length) return 'HomePage';
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace(/[^a-zA-Z0-9]/g, '')).join('') + 'Page';
  }

  private normaliseBase(url: string): string {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return `${u.protocol}//${u.host}`;
  }

  private toAbsolute(href: string, base: string, currentUrl: string): string | null {
    try {
      if (href.startsWith('http')) return new URL(href).href.replace(/\/$/, '') || href;
      if (href.startsWith('/'))    return base + href;
      // relative path — resolve against current page
      return new URL(href, currentUrl).href;
    } catch { return null; }
  }
}
