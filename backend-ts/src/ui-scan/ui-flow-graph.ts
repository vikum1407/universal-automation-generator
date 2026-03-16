import { UIScanNode } from './ui-selector-extractor';
import { CrawledPage } from './ui-multi-page-crawler';

export interface FlowEdge {
  from: string;
  to: string;
  selector?: string;
  action?: string;
}

export interface FlowGraph {
  pages: { url: string; title?: string }[];
  edges: FlowEdge[];
}

export class UIFlowGraphBuilder {
  build(
    pages: CrawledPage[],
    uiNodes: UIScanNode[] = []
  ): FlowGraph {
    const edges: FlowEdge[] = [];
    const edgeKey = (e: FlowEdge) => `${e.from}::${e.to}::${e.selector || ''}`;

    const pageMap = pages.map(p => ({
      url: p.url,
      title: ''
    }));

    // 1) Use navigation traces from crawler when available
    for (const page of pages) {
      if (page.navigationTrace && page.navigationTrace.length > 0) {
        for (const nav of page.navigationTrace) {
          const action = this.detectAction(nav.selector, uiNodes);
          const edge: FlowEdge = {
            from: nav.from,
            to: nav.to,
            selector: nav.selector,
            action
          };
          if (!edges.find(e => edgeKey(e) === edgeKey(edge))) {
            edges.push(edge);
          }
        }
      }
    }

    // 2) Fallback: extract links from HTML (for robustness)
    for (const page of pages) {
      const links = this.extractLinks(page.html, page.url);

      for (const link of links) {
        if (pageMap.find(p => p.url === link.target)) {
          const action = this.detectAction(link.selector, uiNodes);
          const edge: FlowEdge = {
            from: page.url,
            to: link.target,
            selector: link.selector,
            action
          };
          if (!edges.find(e => edgeKey(e) === edgeKey(edge))) {
            edges.push(edge);
          }
        }
      }
    }

    return {
      pages: pageMap,
      edges
    };
  }

  private detectAction(selector: string | undefined, uiNodes: UIScanNode[]): string | undefined {
    if (!selector) return 'navigate';
    const match = uiNodes.find(n => n.selector === selector);
    return match?.action ?? 'navigate';
  }

  private extractLinks(html: string, baseUrl: string): { target: string; selector: string }[] {
    const results: { target: string; selector: string }[] = [];

    const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
    let match;

    while ((match = anchorRegex.exec(html)) !== null) {
      const href = match[1];

      try {
        const resolved = new URL(href, baseUrl).toString().split('#')[0];

        results.push({
          target: resolved,
          selector: `a[href="${href}"]`
        });
      } catch {
        continue;
      }
    }

    return results;
  }
}
