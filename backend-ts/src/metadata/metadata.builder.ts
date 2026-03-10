import { OpenApiParser } from './openapi.parser';
import { ServiceMetadata } from './metadata.model';

export class MetadataBuilder {
  private parser = new OpenApiParser();

  async build(template: string, openapiUrl: string): Promise<ServiceMetadata> {
    // UI templates do NOT use OpenAPI
    if (template === 'ui-playwright') {
      return {
        openapiUrl,
        baseUrl: openapiUrl,
        endpoints: []
      };
    }

    // API templates use OpenAPI parser
    const parsed = await this.parser.parse(openapiUrl);

    return {
      openapiUrl,
      baseUrl: parsed.baseUrl,
      endpoints: parsed.endpoints
    };
  }
}
