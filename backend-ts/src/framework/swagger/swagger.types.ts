export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface ParsedParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'body' | 'formData';
  required: boolean;
  type: string;
  description?: string;
  schema?: any;
  example?: any;
  enum?: string[];
}

export interface ParsedEndpoint {
  operationId: string;
  method: HttpMethod;
  path: string;
  tag: string;
  summary: string;
  description?: string;
  parameters: ParsedParameter[];
  requestBodySchema?: any;
  requestBodyRequired?: boolean;
  responses: Record<string, { description: string; schema?: any }>;
  requiresAuth: boolean;
}

export interface SwaggerSummary {
  title: string;
  version: string;
  baseUrl: string;
  endpoints: ParsedEndpoint[];
}
