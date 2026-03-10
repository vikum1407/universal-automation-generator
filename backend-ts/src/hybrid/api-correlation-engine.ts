import { Requirement } from '../rtm/rtm.model';
import { HybridFlow } from './flow-hybrid-test-generator';

export interface CorrelatedApiCall {
  method?: string;
  url?: string;
  description: string;
}

export interface CorrelatedHybridFlow extends HybridFlow {
  apiCalls: CorrelatedApiCall[];
}

export class ApiCorrelationEngine {
  correlate(flows: HybridFlow[], requirements: Requirement[]): CorrelatedHybridFlow[] {
    const apiReqs = requirements.filter(r => r.type === 'api' || r.source === 'API');

    return flows.map(flow => {
      const apiCalls: CorrelatedApiCall[] = [];

      for (const api of apiReqs) {
        const apiUrl = (api as any).url as string | undefined;
        const apiMethod = (api as any).method as string | undefined;

        if (!apiUrl) {
          continue;
        }

        const matchesFlow =
          flow.steps.some(step => {
            try {
              const stepUrl = new URL(step);
              const apiUrlObj = new URL(apiUrl, stepUrl.origin);
              return stepUrl.origin === apiUrlObj.origin;
            } catch {
              return false;
            }
          });

        if (matchesFlow) {
          apiCalls.push({
            method: apiMethod,
            url: apiUrl,
            description: api.description
          });
        }
      }

      return {
        ...flow,
        apiCalls
      };
    });
  }
}
