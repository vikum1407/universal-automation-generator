export interface EndpointCoverage {
  id:            string;
  projectId:     string;
  rtmVersionId:  string;
  endpointId:    string;
  totalTests:    number;
  passedTests:   number;
  failedTests:   number;
  coverageScore: number;
  lastComputedAt: string;
  // Enriched
  endpointKey?:  string;
  method?:       string;
  path?:         string;
}
