import { FlowGraph } from '../ui-scan/ui-flow-graph';
import { Requirement } from '../rtm/rtm.model';
import { UIScanNode } from '../ui-scan/ui-selector-extractor';

export interface HybridFlow {
  steps: string[];
  selectors: string[];
  actions: string[];
}

export class FlowHybridTestGenerator {
  generate(flow: FlowGraph, uiNodes: UIScanNode[] = []): HybridFlow[] {
    const hybridFlows: HybridFlow[] = [];

    const adjacency: Record<string, { to: string; selector?: string; action?: string }[]> = {};

    flow.pages.forEach(p => {
      adjacency[p.url] = [];
    });

    flow.edges.forEach(e => {
      const action = this.detectActionForEdge(e.selector, uiNodes);
      adjacency[e.from].push({ to: e.to, selector: e.selector, action });
    });

    for (const p of flow.pages) {
      const start = p.url;
      const level1 = adjacency[start];
      if (!level1 || level1.length === 0) continue;

      for (const step1 of level1) {
        hybridFlows.push({
          steps: [start, step1.to],
          selectors: [step1.selector ?? ''],
          actions: [step1.action ?? 'navigate']
        });

        const level2 = adjacency[step1.to];
        if (!level2 || level2.length === 0) continue;

        for (const step2 of level2) {
          hybridFlows.push({
            steps: [start, step1.to, step2.to],
            selectors: [step1.selector ?? '', step2.selector ?? ''],
            actions: [step1.action ?? 'navigate', step2.action ?? 'navigate']
          });
        }
      }
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
