import { Injectable, Logger } from '@nestjs/common';
import type { PageMap, PageInfo, FormInfo, FieldInfo, ButtonInfo } from '../crawler/crawler.types';

interface RawAction {
  kind:      'goto' | 'fill' | 'click' | 'check' | 'select';
  selector:  string;
  value?:    string;
  url?:      string;
  role?:     string;   // captured from getByRole('role', ...)
  roleName?: string;   // captured from getByRole('...', { name: '...' })
}

interface PageGroup {
  url:      string;
  label?:   string;   // set when the section was opened by a nav link click
  actions:  RawAction[];
}

@Injectable()
export class CodegenParserService {
  private readonly logger = new Logger(CodegenParserService.name);

  // ─── Entry point ──────────────────────────────────────────────────────────────

  parse(script: string): PageMap {
    const actions = this.extractActions(script);
    const pages   = this.groupIntoPages(actions);
    const baseUrl = pages[0]?.url ? this.extractBase(pages[0].url) : '';

    this.logger.log(`Codegen parsed: ${actions.length} actions → ${pages.length} pages`);
    return { baseUrl, pages, crawledAt: new Date().toISOString() };
  }

  // ─── Step 1: Extract raw actions line-by-line ────────────────────────────────

  private extractActions(script: string): RawAction[] {
    const actions: RawAction[] = [];

    for (const raw of script.split('\n')) {
      const line = raw.trim();
      if (!line.includes('page.') && !line.includes('await ')) continue;

      // goto
      const gotoM = line.match(/page\.goto\(['"`]([^'"`]+)['"`]\)/);
      if (gotoM) { actions.push({ kind: 'goto', selector: '', url: gotoM[1] }); continue; }

      // Capture role + name before extractSelector converts them to CSS strings
      const roleCapture = line.match(
        /page\.getByRole\(['"`]([^'"`]+)['"`](?:,\s*\{[^}]*?name:\s*['"`]([^'"`]+)['"`][^}]*?\})?\s*\)/
      );
      const selector = this.extractSelector(line);
      if (!selector) continue;

      // fill
      const fillM = line.match(/\.fill\(['"`]([^'"`]*)['"`]\)/);
      if (fillM) { actions.push({ kind: 'fill', selector, value: fillM[1] }); continue; }

      // selectOption
      const selM = line.match(/\.selectOption\(['"`]([^'"`]+)['"`]\)/);
      if (selM) { actions.push({ kind: 'select', selector, value: selM[1] }); continue; }

      // check / uncheck
      if (line.match(/\.(un)?check\(\)/)) { actions.push({ kind: 'check', selector }); continue; }

      // click — preserve role metadata for nav detection
      if (line.includes('.click()')) {
        actions.push({
          kind:     'click',
          selector,
          role:     roleCapture?.[1],
          roleName: roleCapture?.[2],
        });
        continue;
      }
    }

    return actions;
  }

  private extractSelector(line: string): string | null {
    // page.locator('...')
    const locM = line.match(/page\.locator\(['"`]([^'"`]+)['"`]\)/);
    if (locM) return locM[1];

    // page.getByRole('role', { name: 'text' })
    const roleM = line.match(
      /page\.getByRole\(['"`]([^'"`]+)['"`](?:,\s*\{[^}]*?name:\s*['"`]([^'"`]+)['"`][^}]*?\})?\s*\)/
    );
    if (roleM) {
      return roleM[2]
        ? `[role="${roleM[1]}"][aria-label="${roleM[2]}"], ${roleM[1]}:has-text("${roleM[2]}")`
        : `[role="${roleM[1]}"]`;
    }

    // page.getByLabel('...')
    const lblM = line.match(/page\.getByLabel\(['"`]([^'"`]+)['"`]\)/);
    if (lblM) return `[aria-label="${lblM[1]}"]`;

    // page.getByPlaceholder('...')
    const phM = line.match(/page\.getByPlaceholder\(['"`]([^'"`]+)['"`]\)/);
    if (phM) return `[placeholder="${phM[1]}"]`;

    // page.getByText('...')
    const textM = line.match(/page\.getByText\(['"`]([^'"`]+)['"`]\)/);
    if (textM) return `text=${textM[1]}`;

    // page.getByTestId('...')
    const tidM = line.match(/page\.getByTestId\(['"`]([^'"`]+)['"`]\)/);
    if (tidM) return `[data-testid="${tidM[1]}"]`;

    return null;
  }

  // ─── Step 2: Group actions by page ───────────────────────────────────────────
  // Splits on both page.goto() calls AND navigation link clicks, so SPA journeys
  // produce multiple Page Objects even with a single goto.

  private groupIntoPages(actions: RawAction[]): PageInfo[] {
    const groups: PageGroup[] = [];
    let current: PageGroup | null = null;

    for (const action of actions) {
      // Hard split — explicit navigation to a new URL
      if (action.kind === 'goto' && action.url) {
        if (current) groups.push(current);
        current = { url: action.url, actions: [] };
        continue;
      }

      // Soft split — clicking a nav link opens a new section
      if (current && action.kind === 'click' && this.isNavLink(action)) {
        if (current.actions.length > 0) {
          // Current section has actions — save it and start a fresh section
          groups.push(current);
          current = { url: current.url, label: action.roleName!, actions: [] };
        } else {
          // Consecutive nav clicks with nothing in between — just update the label
          current.label = action.roleName!;
        }
        continue; // nav click itself is never added as an action
      }

      if (current) current.actions.push(action);
    }
    if (current) groups.push(current);

    // Drop empty groups (e.g., two nav clicks back-to-back with nothing between)
    const nonEmpty = groups.filter(g => g.actions.length > 0);

    // Deduplicate by label (for nav sections) or by URL (for goto sections).
    // When the same label appears twice, keep the visit with the most actions.
    const seen = new Map<string, PageGroup>();
    for (const g of nonEmpty) {
      const key = g.label ?? g.url;
      const prev = seen.get(key);
      if (!prev || g.actions.length > prev.actions.length) seen.set(key, g);
    }

    return Array.from(seen.values()).map(g => this.toPageInfo(g.url, g.actions, g.label));
  }

  // Words that signal an action button disguised as a link — not real page navigation.
  private static readonly ACTION_VERBS = new Set([
    'add', 'remove', 'delete', 'place', 'buy', 'submit', 'cancel',
    'close', 'open', 'view', 'edit', 'update', 'create', 'send',
    'save', 'download', 'upload', 'next', 'back', 'previous',
    'continue', 'finish', 'complete', 'confirm', 'apply', 'pay',
  ]);

  // A nav link is a role=link click where the name is short, has no digits,
  // and doesn't start with a common action verb.
  private isNavLink(action: RawAction): boolean {
    if (action.role !== 'link' || !action.roleName) return false;
    const name      = action.roleName.trim();
    const words     = name.split(/\s+/);
    if (words.length > 4)                                         return false;
    if (/\d/.test(name))                                          return false;
    if (name.startsWith('http') || name.includes('/'))            return false;
    if (CodegenParserService.ACTION_VERBS.has(words[0].toLowerCase())) return false;
    return true;
  }

  // ─── Step 3: Convert one page group → PageInfo ───────────────────────────────

  private toPageInfo(url: string, actions: RawAction[], label?: string): PageInfo {
    const parsedUrl = (() => { try { return new URL(url); } catch { return null; } })();
    const basePath  = parsedUrl?.pathname ?? '/';

    // Nav-link sections are SPA overlays — they live at the same real URL as the parent
    // page, so goto() must navigate to that real URL (not a fake /contact or /cart path).
    // We still use a label-derived className/title to keep each section distinct.
    const path      = basePath;
    const className = label ? this.labelToClassName(label) : this.toClassName(basePath);
    const title     = label
      ? label.replace(/\s*\([^)]*\)/g, '').trim()   // strip "(current)" etc.
      : (className.replace(/Page$/, '').replace(/([A-Z])/g, ' $1').trim() || 'Home');

    const fillActions   = actions.filter(a => a.kind === 'fill');
    const selectActions = actions.filter(a => a.kind === 'select');
    const clickActions  = actions.filter(a => a.kind === 'click');

    const forms: FormInfo[] = [];
    if (fillActions.length > 0 || selectActions.length > 0) {
      const fields: FieldInfo[] = [...fillActions, ...selectActions]
        .map(a => ({
          name:     this.selectorToName(a.selector),
          type:     this.guessFieldType(a.selector),
          label:    this.selectorToLabel(a.selector),
          required: false,
        }))
        .filter(f => !!f.name);

      const hasPass  = fields.some(f => f.type === 'password');
      const hasEmail = fields.some(f => f.type === 'email');
      const purpose  = hasPass && hasEmail ? 'login' : hasPass ? 'register' : 'generic';

      forms.push({ id: 'recorded_form', action: '', method: 'POST', purpose, fields, ...(label ? { isInModal: true } : {}) });
    }

    const buttons: ButtonInfo[] = clickActions
      .slice(0, 10)
      .map(a => ({ text: this.selectorToLabel(a.selector), type: 'button', role: 'action' as const }))
      .filter(b => !!b.text);

    return {
      url, path, title, className,
      forms, buttons,
      navLinks: [],
      headings: [],
      isAuthProtected: fillActions.some(a => this.guessFieldType(a.selector) === 'password'),
      hasTable:  false,
      hasModal:  false,
    };
  }

  // ─── Label → class name / path helpers ───────────────────────────────────────

  // "About us" → "AboutUsPage",  "Home (current)" → "HomePage"
  private labelToClassName(label: string): string {
    const clean = label
      .replace(/\s*\([^)]*\)/g, '')          // strip "(current)", "(exact)" etc.
      .replace(/[^a-zA-Z0-9\s]/g, ' ')       // symbols → space
      .trim();
    if (!clean) return 'SectionPage';
    return clean
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('') + 'Page';
  }

  // "About us" → "/about-us",  "Home (current)" → "/",  "Cart" → "/cart"
  private labelToPath(label: string): string {
    const clean = label
      .replace(/\s*\([^)]*\)/g, '')
      .trim()
      .toLowerCase();
    if (!clean || clean === 'home') return '/';
    return '/' + clean.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  // ─── Selector → field name / label / type ───────────────────────────────────

  private selectorToName(selector: string): string {
    if (selector.startsWith('#'))                        return selector.slice(1);
    const nameM  = selector.match(/\[name="([^"]+)"\]/);    if (nameM)  return nameM[1];
    const idM    = selector.match(/\[id="([^"]+)"\]/);      if (idM)    return idM[1];
    const phM    = selector.match(/\[placeholder="([^"]+)"\]/); if (phM) return phM[1].toLowerCase().replace(/\s+/g, '_');
    const ariaM  = selector.match(/\[aria-label="([^"]+)"\]/); if (ariaM) return ariaM[1].toLowerCase().replace(/\s+/g, '_');
    const tidM   = selector.match(/\[data-testid="([^"]+)"\]/); if (tidM) return tidM[1];
    const classM = selector.match(/\.([a-zA-Z][\w-]*)/);    if (classM) return classM[1];
    return '';
  }

  private selectorToLabel(selector: string): string {
    return this.selectorToName(selector)
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  private guessFieldType(selector: string): string {
    const s = selector.toLowerCase();
    if (s.includes('password') || s.includes('pass'))    return 'password';
    if (s.includes('email')    || s.includes('mail'))    return 'email';
    if (s.includes('phone')    || s.includes('tel'))     return 'tel';
    if (s.includes('number')   || s.includes('qty'))     return 'number';
    if (s.includes('date'))                              return 'date';
    if (s.includes('url')      || s.includes('website')) return 'url';
    return 'text';
  }

  private toClassName(path: string): string {
    const parts = path.replace(/^\/|\/$/g, '').split('/').filter(Boolean);
    if (!parts.length) return 'HomePage';
    return parts
      .map(p => p.charAt(0).toUpperCase() + p.slice(1).replace(/[^a-zA-Z0-9]/g, ''))
      .join('') + 'Page';
  }

  private extractBase(url: string): string {
    try { const u = new URL(url); return `${u.protocol}//${u.host}`; } catch { return ''; }
  }
}
