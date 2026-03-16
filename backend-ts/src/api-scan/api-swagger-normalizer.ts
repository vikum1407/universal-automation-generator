import { RawSwagger } from './api-swagger-ingestor';
import {
  ApiEndpointModel,
  ApiParameterModel
} from '../metadata/api-endpoint.model';

export class ApiSwaggerNormalizer {
  normalize(swagger: RawSwagger): ApiEndpointModel[] {
    const endpoints: ApiEndpointModel[] = [];

    Object.entries(swagger.paths || {}).forEach(([path, methods]) => {
      Object.entries<any>(methods).forEach(([method, def]) => {
        if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].indexOf(method) === -1) {
          return;
        }

        const params: ApiParameterModel[] = (def.parameters || []).map(
          (p: any) => ({
            name: p.name,
            in: p.in,
            required: !!p.required,
            type: p.schema?.type
          })
        );

        const endpoint: ApiEndpointModel = {
          id: `${method.toUpperCase()} ${path}`,
          method: method.toUpperCase(),
          path,
          summary: def.summary,
          tags: def.tags,
          parameters: params,
          hasRequestBody: !!def.requestBody,
          hasResponse: !!def.responses
        };

        endpoints.push(endpoint);
      });
    });

    return endpoints;
  }
}
