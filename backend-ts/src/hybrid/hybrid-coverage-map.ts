import { CorrelatedHybridFlow } from './api-correlation-engine';

export interface HybridCoverageMap {
  totalFlows: number;
  totalApiCalls: number;
  pagesCovered: string[];
  apiEndpointsCovered: string[];
  flowCoverage: {
    flow: string[];
    apiCalls: { method?: string; url?: string }[];
  }[];
}

export class HybridCoverageMapBuilder {
  build(flows: CorrelatedHybridFlow[]): HybridCoverageMap {
    const pages = new Set<string>();
    const apis = new Set<string>();

    const flowCoverage = flows.map(flow => {
      flow.steps.forEach(step => pages.add(step));

      flow.apiCalls.forEach(api => {
        if (api.url) apis.add(api.url);
      });

      return {
        flow: flow.steps,
        apiCalls: flow.apiCalls.map(a => ({
          method: a.method,
          url: a.url
        }))
      };
    });

    return {
      totalFlows: flows.length,
      totalApiCalls: Array.from(apis).length,
      pagesCovered: Array.from(pages),
      apiEndpointsCovered: Array.from(apis),
      flowCoverage
    };
  }
}
