export type RtmEndpointMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RtmEndpoint {
  id:             string;
  rtmVersionId:   string;
  key:            string;
  method:         RtmEndpointMethod;
  path:           string;
  serviceName:    string | null;
  description:    string;
  requirementIds: string[];
  createdAt:      Date;
}
