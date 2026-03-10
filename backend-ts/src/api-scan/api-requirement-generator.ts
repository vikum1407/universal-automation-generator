import { Requirement } from '../rtm/rtm.model';

interface EndpointInput {
  path: string;
  method: string;
  spec: any;
}

export class APIRequirementGenerator {
  generate(endpoints: EndpointInput[]): Requirement[] {
    if (!Array.isArray(endpoints)) return [];

    return endpoints.map((ep, index) => {
      const tags: string[] = ep.spec?.tags || [];
      const summary: string = ep.spec?.summary || `${ep.method.toUpperCase()} ${ep.path}`;
      const operationId: string = ep.spec?.operationId || `op_${index + 1}`;

      return {
        id: `API-${index + 1}`,
        page: ep.path,
        description: summary,
        selector: ep.path,
        type: 'api',
        source: 'API',
        method: ep.method,
        spec: ep.spec,
        tags,
        operationId
      } as any;
    });
  }
}
