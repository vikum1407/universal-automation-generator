import type { RtmMappingStrength } from './ui-flow-mapping.entity';

export interface RtmReqEndpointMapping {
  id:                   string;
  projectId:            string;
  rtmVersionId:         string;
  requirementId:        string;
  discoveredEndpointId: string;
  strength:             RtmMappingStrength;
  createdAt:            string;
}

export interface RtmJourneyEndpointMapping {
  id:                   string;
  projectId:            string;
  rtmVersionId:         string;
  journeyId:            string;
  discoveredEndpointId: string;
  createdAt:            string;
}

// Thin view of a discovered Endpoint returned alongside mapping data
export interface DiscoveredEndpoint {
  id:          string;
  projectId:   string;
  method:      string;
  path:        string;
  flowId:      string | null;
  createdAt:   string;
}
