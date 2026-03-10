import { CorrelatedHybridFlow } from './api-correlation-engine';

export class HybridFlowPrioritizer {
  prioritize(flows: CorrelatedHybridFlow[]): CorrelatedHybridFlow[] {
    return flows
      .map(flow => ({
        ...flow,
        priority: this.score(flow)
      }))
      .sort((a, b) => b.priority - a.priority);
  }

  private score(flow: CorrelatedHybridFlow): number {
    let score = 0;

    // 1. Longer flows are more valuable
    score += flow.steps.length * 10;

    // 2. Flows with API calls are more valuable
    score += (flow.apiCalls?.length ?? 0) * 20;

    // 3. Login / Checkout / Cart / Dashboard keywords boost priority
    const criticalKeywords = ['login', 'checkout', 'cart', 'dashboard', 'payment'];
    const flowString = flow.steps.join(' ').toLowerCase();

    criticalKeywords.forEach(keyword => {
      if (flowString.includes(keyword)) {
        score += 30;
      }
    });

    // 4. Entry-point flows get a small boost
    if (flow.steps[0] === flow.steps[0]) {
      score += 5;
    }

    return score;
  }
}
