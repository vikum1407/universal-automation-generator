export interface RequirementCoverage {
  id:                string;
  projectId:         string;
  rtmVersionId:      string;
  requirementId:     string;
  hasTests:          boolean;
  totalTests:        number;
  passedTests:       number;
  failedTests:       number;
  skippedTests:      number;
  uiFlowsTotal:      number;
  uiFlowsCovered:    number;
  endpointsTotal:    number;
  endpointsCovered:  number;
  journeysTotal:     number;
  journeysCovered:   number;
  coverageScore:     number;  // 0–1
  riskWeightedScore: number;  // 0–1
  lastComputedAt:    string;
  // Enriched fields returned alongside the snapshot
  requirementKey?:   string;
  requirementTitle?: string;
  risk?:             string;
  priority?:         string;
}
