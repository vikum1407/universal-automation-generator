export interface JourneyCoverage {
  id:            string;
  projectId:     string;
  rtmVersionId:  string;
  journeyId:     string;
  totalTests:    number;
  passedTests:   number;
  failedTests:   number;
  coverageScore: number;
  lastComputedAt: string;
  // Enriched
  journeyKey?:  string;
  journeyName?: string;
}

export interface RTMCoverageSummary {
  projectId:                    string;
  rtmVersionId:                 string;
  requirementsTotal:            number;
  requirementsCovered:          number;
  requirementsCoveragePercent:  number;
  endpointsTotal:               number;
  endpointsCovered:             number;
  endpointsCoveragePercent:     number;
  journeysTotal:                number;
  journeysCovered:              number;
  journeysCoveragePercent:      number;
  riskWeightedCoverageScore:    number;  // 0–100
  lastComputedAt:               string | null;
}
