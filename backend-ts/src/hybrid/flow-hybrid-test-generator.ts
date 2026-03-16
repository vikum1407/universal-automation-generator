import { FlowGraph } from '../ui-scan/ui-flow-graph';
import { Requirement } from '../rtm/rtm.model';
import { UIScanNode } from '../ui-scan/ui-selector-extractor';

export interface HybridFlow {
  steps: string[];      // sequence of page URLs
  selectors: string[];  // selector used for each hop
  actions: string[];    // semantic action per hop
}

interface EdgeHop {
  to: string;
  selector?: string;
  action?: string;
}

export class FlowHybridTestGenerator {
  private readonly MAX_DEPTH = 4; // up to 5 pages per journey

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
        if (steps.includes(hop.to)) continue; // avoid cycles

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
      page: flow.steps[0],
      description: `User can complete flow: ${flow.steps.join(' → ')}`,
      type: 'ui',
      source: 'UI'
    }));
  }
}
