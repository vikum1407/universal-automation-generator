import { HybridFlow } from '../hybrid/flow-hybrid-test-generator';
import { Journey, JourneyStep, JourneyType } from './journey-model';

export class JourneyEngine {
  generateJourneys(flows: HybridFlow[]): Journey[] {
    const journeys: Journey[] = [];
    const seen = new Set<string>();

    for (const flow of flows) {
      if (flow.steps.length < 2) continue;

      const key = flow.steps.join('->');
      if (seen.has(key)) continue;
      seen.add(key);

      const steps: JourneyStep[] = [];
      for (let i = 0; i < flow.steps.length - 1; i++) {
        steps.push({
          from: flow.steps[i],
          to: flow.steps[i + 1],
          selector: flow.selectors[i],
          action: flow.actions[i]
        });
      }

      const type = this.classifyJourney(flow.steps);
      const title = this.generateTitle(flow.steps, type);

      journeys.push({
        id: `JOURNEY-${journeys.length + 1}`,
        title,
        type,
        steps
      });
    }

    return journeys;
  }

  private classifyJourney(steps: string[]): JourneyType {
    const path = steps.join(' ').toLowerCase();

    if (path.includes('login')) return 'login';
    if (path.includes('checkout') && path.includes('complete')) return 'checkout';
    if (path.includes('inventory') || path.includes('product')) return 'product-browsing';
    if (path.includes('cart')) return 'cart';
    if (steps.length > 2) return 'navigation';

    return 'generic';
  }

  private generateTitle(steps: string[], type: JourneyType): string {
    switch (type) {
      case 'login':
        return 'User logs in and navigates the application';
      case 'checkout':
        return 'User completes checkout flow';
      case 'product-browsing':
        return 'User browses inventory and views product details';
      case 'cart':
        return 'User interacts with the shopping cart';
      case 'navigation':
        return `User navigates: ${this.shorten(steps)}`;
      default:
        return `Journey: ${this.shorten(steps)}`;
    }
  }

  private shorten(steps: string[]): string {
    return steps
      .map(s => s.replace(/^https?:\/\//, '').replace(/\/$/, ''))
      .join(' → ');
  }
}
