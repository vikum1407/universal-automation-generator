export type RtmMappingStrength = 'primary' | 'secondary';

export interface RtmReqFlowMapping {
  id:            string;
  projectId:     string;
  rtmVersionId:  string;
  requirementId: string;
  flowId:        string;
  strength:      RtmMappingStrength;
  createdAt:     string;
}

export interface RtmJourneyFlowMapping {
  id:           string;
  projectId:    string;
  rtmVersionId: string;
  journeyId:    string;
  flowId:       string;
  createdAt:    string;
}

// Thin view of a discovered Flow returned alongside mapping data
export interface DiscoveredFlow {
  id:        string;
  projectId: string;
  name:      string;
  createdAt: string;
}
