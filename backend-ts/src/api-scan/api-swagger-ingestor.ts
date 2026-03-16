import axios from 'axios';

export interface RawSwagger {
  paths: Record<string, any>;
  components?: Record<string, any>;
  info?: Record<string, any>;
}

export class ApiSwaggerIngestor {
  async fetch(swaggerUrl: string): Promise<RawSwagger> {
    const response = await axios.get(swaggerUrl, {
      headers: { 'User-Agent': 'Qlitz-API-Scanner/1.0' }
    });
    return response.data as RawSwagger;
  }
}
