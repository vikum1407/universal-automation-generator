import * as cheerio from 'cheerio';
import crypto from 'crypto';

export interface UIScanNode {
  pageUrl: string;
  selector: string;
  text?: string;
  role?: string;
  type?: string;
  action?: string;
  attributes?: Record<string, string>;

  // Phase 8 additions
  componentType?: string;
  semanticRole?: string;

  visualId?: string;
  baselineGroup?: string;

  aiAssertions?: string[];
  aiNegativeTests?: {
    case: string;
    steps: string[];
    assertions: string[];
  }[];
}

export class UISelectorExtractor {
  extract(html: string, pageUrl: string): UIScanNode[] {
    if (!html || typeof html !== 'string') return [];

    const $ = cheerio.load(html);
    const nodes: UIScanNode[] = [];

    const candidates = [
      'button',
      'a[href]',
      'input',
      'select',
      'textarea',
      '[role="button"]',
      '[data-testid]',
      '[data-test]',
      '[data-qa]',
      '[id]',
      '[type="submit"]',
      '[type="button"]'
    ];

    $(candidates.join(',')).each((_, el) => {
      const node = $(el);

      if (!this.isVisible(node)) return;

      const selector = this.buildSelector(node);
      if (!selector) return;

      const text = (node.text() || '').trim();
      const role = node.attr('role') || undefined;
      const type = node.attr('type') || undefined;

      const action = this.detectAction(node, text, type);
      const attributes = this.collectAttributes(node);

      const componentType = this.classifyComponent(node, text, type);
      const semanticRole = this.classifySemanticRole(node, text);

      const visualId = this.computeVisualId(selector, text, attributes);
      const baselineGroup = this.computeBaselineGroup(pageUrl, componentType);

      const aiAssertions = this.generateAIAssertions(componentType, text, action);
      const aiNegativeTests = this.generateAINegativeTests(componentType, action);

      nodes.push({
        pageUrl,
        selector,
        text,
        role,
        type,
        action,
        attributes,
        componentType,
        semanticRole,
        visualId,
        baselineGroup,
        aiAssertions,
        aiNegativeTests
      });
    });

    return nodes;
  }

  private isVisible(node: any): boolean {
    const style = (node.attr('style') || '').toLowerCase();
    if (style.includes('display: none')) return false;
    if (style.includes('visibility: hidden')) return false;
    return true;
  }

  private collectAttributes(node: any): Record<string, string> {
    const attrs: Record<string, string> = {};
    const raw = node.get(0)?.attribs || {};
    for (const key of Object.keys(raw)) {
      attrs[key] = raw[key];
    }
    return attrs;
  }

  private detectAction(node: any, text: string, type?: string): string | undefined {
    const tag = node.get(0)?.tagName?.toLowerCase() || '';

    if (tag === 'button') return this.classifyButton(text);
    if (tag === 'a') return this.classifyLink(text);
    if (tag === 'input') return this.classifyInput(type, text);
    if (tag === 'select') return 'select';
    if (tag === 'textarea') return 'input-textarea';

    return undefined;
  }

  private classifyButton(text: string): string | undefined {
    const t = text.toLowerCase();

    if (t.includes('add to cart')) return 'add-to-cart';
    if (t.includes('checkout')) return 'checkout';
    if (t.includes('login') || t.includes('sign in')) return 'login';
    if (t.includes('submit')) return 'submit';
    if (t.includes('next')) return 'next';
    if (t.includes('continue')) return 'continue';

    return 'click';
  }

  private classifyLink(text: string): string | undefined {
    const t = text.toLowerCase();

    if (t.includes('details')) return 'open-details';
    if (t.includes('product')) return 'open-product';
    if (t.includes('cart')) return 'open-cart';
    if (t.includes('inventory')) return 'open-inventory';

    return 'navigate';
  }

  private classifyInput(type?: string, text?: string): string | undefined {
    if (!type) return 'input';

    const t = type.toLowerCase();

    if (t === 'password') return 'input-password';
    if (t === 'email') return 'input-email';
    if (t === 'search') return 'input-search';
    if (t === 'submit') return 'submit';
    if (t === 'button') return 'click';

    return 'input';
  }

  private classifyComponent(node: any, text: string, type?: string): string {
    const tag = node.get(0)?.tagName?.toLowerCase() || '';

    if (tag === 'button') return 'button';
    if (tag === 'a') return 'link';
    if (tag === 'input') return 'input-field';
    if (tag === 'select') return 'dropdown';
    if (tag === 'textarea') return 'textarea';

    if (text && text.length > 20) return 'text-block';

    return 'element';
  }

  private classifySemanticRole(node: any, text: string): string {
    const t = text.toLowerCase();

    if (t.includes('add to cart')) return 'primary-action';
    if (t.includes('checkout')) return 'primary-action';
    if (t.includes('login')) return 'primary-action';
    if (t.includes('submit')) return 'primary-action';

    if (t.includes('cancel')) return 'secondary-action';
    if (t.includes('back')) return 'secondary-action';

    return 'generic-action';
  }

  private computeVisualId(selector: string, text: string, attrs: Record<string, string>): string {
    const raw = selector + '|' + text + '|' + JSON.stringify(attrs);
    return crypto.createHash('md5').update(raw).digest('hex');
  }

  private computeBaselineGroup(pageUrl: string, componentType: string): string {
    return `${pageUrl}::${componentType}`;
  }

  private generateAIAssertions(componentType: string, text: string, action?: string): string[] {
    const assertions: string[] = [];

    assertions.push('element exists');
    assertions.push('element is visible');

    if (text) assertions.push(`text contains "${text}"`);

    if (componentType === 'input-field') assertions.push('input is editable');
    if (componentType === 'button') assertions.push('button is clickable');

    if (action === 'add-to-cart') assertions.push('cart count increases');
    if (action === 'login') assertions.push('user is authenticated');
    if (action === 'checkout') assertions.push('checkout page loads');

    return assertions;
  }

  private generateAINegativeTests(componentType: string, action?: string) {
    const tests = [];

    if (componentType === 'input-field') {
      tests.push({
        case: 'empty input should show validation error',
        steps: ['clear input', 'submit form'],
        assertions: ['error message visible']
      });
    }

    if (action === 'login') {
      tests.push({
        case: 'invalid login should fail',
        steps: ['enter wrong credentials', 'click login'],
        assertions: ['error message visible']
      });
    }

    if (action === 'checkout') {
      tests.push({
        case: 'missing fields should block checkout',
        steps: ['leave fields empty', 'click checkout'],
        assertions: ['validation errors visible']
      });
    }

    return tests;
  }

  private buildSelector(node: any): string | null {
    const el = node.get(0);
    const tag = (el?.tagName || '').toLowerCase();

    const id = node.attr('id');
    if (id) return `#${this.sanitize(id)}`;

    const dataTestId = node.attr('data-testid');
    if (dataTestId) return `[data-testid="${this.sanitize(dataTestId)}"]`;

    const dataTest = node.attr('data-test');
    if (dataTest) return `[data-test="${this.sanitize(dataTest)}"]`;

    const dataQa = node.attr('data-qa');
    if (dataQa) return `[data-qa="${this.sanitize(dataQa)}"]`;

    const text = (node.text() || '').trim();
    if (tag === 'button' && text) return `button:has-text("${this.sanitize(text)}")`;
    if (tag === 'a' && text) return `a:has-text("${this.sanitize(text)}")`;

    if (tag === 'input') {
      const type = node.attr('type') || 'text';
      return `input[type="${this.sanitize(type)}"]`;
    }

    if (text) return `${tag}:has-text("${this.sanitize(text)}")`;

    const cls = node.attr('class');
    if (cls) return `${tag}.${cls.split(' ').join('.')}`;

    return tag || null;
  }

  private sanitize(text: string): string {
    return text.replace(/"/g, '\\"').replace(/`/g, '\\`');
  }
}
