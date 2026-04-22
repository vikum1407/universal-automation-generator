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
      const summary: string =
        ep.spec?.summary || `${ep.method.toUpperCase()} ${ep.path}`;

      return {
        id: `API-${index + 1}`,
        title: summary,
        description: summary,
        type: 'api',
        source: {
          endpointPath: ep.path,
          method: ep.method
        },
        tags,
        coveredBy: []
      };
    });
  }
}
