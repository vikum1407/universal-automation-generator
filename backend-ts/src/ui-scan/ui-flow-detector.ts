import { UIScanNode } from './ui-selector-extractor';

export interface UIPage {
  url: string;
  nodes: UIScanNode[];
}

export interface UIFlowEdge {
  from: string;
  to: string;
  action: string;
  selector: string;
}

export interface UIFlowGraph {
  pages: UIPage[];
  edges: UIFlowEdge[];
}

export class UIFlowDetector {
  detect(pages: UIPage[]): UIFlowGraph {
    const edges: UIFlowEdge[] = [];

    for (const page of pages) {
      for (const node of page.nodes) {
        if (!node.selector) continue;

        if (node.selector.startsWith('a:has-text') || node.selector.startsWith('a[')) {
          const href = node.attributes?.href;
          if (href && this.isValidNavigation(href)) {
            edges.push({
              from: page.url,
              to: this.normalizeUrl(page.url, href),
              action: node.text || 'navigate',
              selector: node.selector
            });
          }
        }
      }
    }

    return { pages, edges };
  }

  private isValidNavigation(href: string): boolean {
    if (!href) return false;
    if (href.startsWith('#')) return false;
    if (href.startsWith('javascript:')) return false;
    return true;
  }

  private normalizeUrl(base: string, href: string): string {
    try {
      return new URL(href, base).toString();
    } catch {
      return href;
    }
  }
}
