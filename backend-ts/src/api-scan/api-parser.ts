import axios from 'axios';

export class APIParser {
  async loadSchema(url: string): Promise<any> {
    const res = await axios.get(url);
    return res.data;
  }

  extractEndpoints(schema: any) {
    const endpoints = [];

    for (const path in schema.paths) {
      const methods = schema.paths[path];

      for (const method in methods) {
        const details = methods[method];

        endpoints.push({
          path,
          method: method.toUpperCase(),
          summary: details.summary || '',
          parameters: details.parameters || [],
          requestBody: details.requestBody || null,
          responses: details.responses || {}
        });
      }
    }

    return endpoints;
  }
}
