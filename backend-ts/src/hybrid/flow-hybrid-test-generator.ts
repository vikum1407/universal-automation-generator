import { FlowGraph } from '../ui-scan/ui-flow-graph';
import { Requirement } from '../rtm/rtm.model';
import { UIScanNode } from '../ui-scan/ui-selector-extractor';

export interface HybridFlow {
  steps: string[];
  selectors: string[];
  actions: string[];
}

interface EdgeHop {
  to: string;
  selector?: string;
  action?: string;
}

export class FlowHybridTestGenerator {
  private readonly MAX_DEPTH = 4;

  generate(flow: FlowGraph, uiNodes: UIScanNode[] = []): HybridFlow[] {
    const hybridFlows: HybridFlow[] = [];

    const adjacency: Record<string, EdgeHop[]> = {};
    flow.pages.forEach(p => {
      adjacency[p.url] = [];
    });

    flow.edges.forEach(e => {
      const action = this.detectActionForEdge(e.selector, uiNodes);
      if (!adjacency[e.from]) adjacency[e.from] = [];
      adjacency[e.from].push({
        to: e.to,
        selector: e.selector,
        action
      });
    });

    const seenPaths = new Set<string>();

    const dfs = (
      current: string,
      steps: string[],
      selectors: string[],
      actions: string[],
      depth: number
    ) => {
      if (depth > 0) {
        const key = steps.join('->');
        if (!seenPaths.has(key)) {
          seenPaths.add(key);
          hybridFlows.push({
            steps: [...steps],
            selectors: [...selectors],
            actions: [...actions]
          });
        }
      }

      if (depth >= this.MAX_DEPTH) return;

      const nextHops = adjacency[current] || [];
      for (const hop of nextHops) {
        if (steps.includes(hop.to)) continue;

        dfs(
          hop.to,
          [...steps, hop.to],
          [...selectors, hop.selector ?? ''],
          [...actions, hop.action ?? 'navigate'],
          depth + 1
        );
      }
    };

    for (const p of flow.pages) {
      const start = p.url;
      dfs(start, [start], [], [], 0);
    }

    return hybridFlows;
  }

  private detectActionForEdge(selector?: string, uiNodes: UIScanNode[] = []): string | undefined {
    if (!selector) return 'navigate';
    const match = uiNodes.find(n => n.selector === selector);
    return match?.action ?? 'navigate';
  }

  toRequirements(flows: HybridFlow[]): Requirement[] {
    return flows.map((flow, index) => ({
      id: `HYBRID-FLOW-${index + 1}`,
      title: `Hybrid flow ${index + 1}`,
      description: `User can complete flow: ${flow.steps.join(' → ')}`,
      type: 'ui',
      source: {
        pageName: flow.steps[0]
      },
      coveredBy: []
    }));
  }
}
