export interface RequirementGap {
  id:                     string;
  projectId:              string;
  rtmVersionId:           string;
  requirementId:          string;

  hasNoTests:             boolean;
  hasInsufficientTests:   boolean;

  missingUITests:         boolean;
  missingAPITests:        boolean;
  missingHybridTests:     boolean;

  missingNegativeTests:   boolean;
  missingBoundaryTests:   boolean;
  missingRegressionDepth: boolean;

  risk:                   string;
  priority:               string;

  coverageScore:          number;
  riskWeightedScore:      number;

  suggestedUITests:       number;
  suggestedAPITests:      number;
  suggestedHybridTests:   number;

  lastComputedAt:         string;

  // Enriched
  requirementKey?:        string;
  requirementTitle?:      string;
}
