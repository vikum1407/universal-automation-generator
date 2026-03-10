import { HybridFlow } from './flow-hybrid-test-generator';

export class HybridFlowOptimizer {
  optimize(flows: HybridFlow[]): HybridFlow[] {
    // 1. Deduplicate by exact step sequence
    const uniqueMap = new Map<string, HybridFlow>();

    for (const flow of flows) {
      const key = flow.steps.join('→');
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, flow);
      }
    }

    const uniqueFlows = Array.from(uniqueMap.values());

    // 2. Remove flows that are strict prefixes of longer flows
    return uniqueFlows.filter(flow => {
      return !uniqueFlows.some(other => {
        if (other === flow) return false;
        if (other.steps.length <= flow.steps.length) return false;

        const prefixMatch = flow.steps.every((step, idx) => other.steps[idx] === step);
        return prefixMatch;
      });
    });
  }
}
