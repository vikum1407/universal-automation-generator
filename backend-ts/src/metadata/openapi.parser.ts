import axios from 'axios';

export class OpenApiParser {
  async parse(openapiUrl: string) {
    const response = await axios.get(openapiUrl);
    const spec = response.data;

    const baseUrl =
      spec.servers?.[0]?.url ||
      spec.host ||
      spec.basePath ||
      '';

    const endpoints: any[] = [];

    if (spec.paths) {
      for (const path in spec.paths) {
        const methods = spec.paths[path];

        for (const method in methods) {
          const operation = methods[method];

          endpoints.push({
            path,
            method: method.toUpperCase(),
            responses: Object.keys(operation.responses || {}).map((code) => ({
              statusCode: Number(code)
            }))
          });
        }
      }
    }

    return {
      baseUrl,
      endpoints
    };
  }
}
