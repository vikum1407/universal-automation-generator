import { UIScanNode } from './ui-selector-extractor';

export interface FlowEdge {
  from: string;
  to: string;
  selector?: string;
  action?: string; // NEW: semantic action (navigate, open-product, etc.)
}

export interface FlowGraph {
  pages: { url: string; title?: string }[];
  edges: FlowEdge[];
}

export class UIFlowGraphBuilder {
  build(
    pages: { url: string; html: string; title?: string }[],
    uiNodes: UIScanNode[] = []
  ): FlowGraph {
    const edges: FlowEdge[] = [];

    const pageMap = pages.map(p => ({
      url: p.url,
      title: p.title ?? ''
    }));

    for (const page of pages) {
      const links = this.extractLinks(page.html, page.url);

      for (const link of links) {
        if (pageMap.find(p => p.url === link.target)) {
          const action = this.detectAction(link.selector, uiNodes);

          edges.push({
            from: page.url,
            to: link.target,
            selector: link.selector,
            action
          });
        }
      }
    }

    return {
      pages: pageMap,
      edges
    };
  }

  private detectAction(selector: string, uiNodes: UIScanNode[]): string | undefined {
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
