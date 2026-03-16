export interface ApiParameterModel {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie' | 'body';
  required: boolean;
  type?: string;
}

export interface ApiEndpointModel {
  id: string;
  method: string;
  path: string;
  summary?: string;
  tags?: string[];
  parameters: ApiParameterModel[];
  hasRequestBody: boolean;
  hasResponse: boolean;
}
