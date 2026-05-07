export interface JourneyGap {
  id:                      string;
  projectId:               string;
  rtmVersionId:            string;
  journeyId:               string;

  hasNoTests:              boolean;
  hasInsufficientTests:    boolean;

  missingEndToEndFlow:     boolean;
  missingAlternativePaths: boolean;

  coverageScore:           number;
  lastComputedAt:          string;

  // Enriched
  journeyKey?:             string;
  journeyName?:            string;
}

export interface GapSummary {
  projectId:                       string;
  rtmVersionId:                    string;
  requirementsTotal:               number;
  requirementsNoTests:             number;
  requirementsInsufficient:        number;
  requirementsHighRiskGap:         number;
  endpointsTotal:                  number;
  endpointsNoTests:                number;
  endpointsInsufficient:           number;
  journeysTotal:                   number;
  journeysNoTests:                 number;
  journeysInsufficient:            number;
  lastComputedAt:                  string | null;
}
