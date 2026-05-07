// Hybrid mapping combines a UI flow + an API endpoint for a requirement.
// This structure is ready for Phase 2 but not yet persisted; hybrid mappings
// are derived from req↔flow + req↔endpoint overlap in Phase 3.
export interface RtmReqHybridMapping {
  requirementId:        string;
  uiFlowId:             string;
  discoveredEndpointId: string;
  projectId:            string;
  rtmVersionId:         string;
}

export interface RequirementMappingSummary {
  requirementId: string;
  uiFlows:       { id: string; name: string; strength: string }[];
  endpoints:     { id: string; method: string; path: string; strength: string }[];
  journeys:      { id: string; name: string }[];
}

export interface JourneyMappingSummary {
  journeyId:     string;
  requirementIds: string[];
  uiFlows:       { id: string; name: string }[];
  endpoints:     { id: string; method: string; path: string }[];
}
