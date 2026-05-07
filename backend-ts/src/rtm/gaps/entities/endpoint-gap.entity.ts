export interface EndpointGap {
  id:                   string;
  projectId:            string;
  rtmVersionId:         string;
  endpointId:           string;

  hasNoTests:           boolean;
  hasInsufficientTests: boolean;

  missingPositiveTests: boolean;
  missingNegativeTests: boolean;
  missingBoundaryTests: boolean;

  coverageScore:        number;
  lastComputedAt:       string;

  // Enriched
  endpointKey?:         string;
  method?:              string;
  path?:                string;
}
