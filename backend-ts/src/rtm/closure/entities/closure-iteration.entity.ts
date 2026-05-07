export type IterationStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface CoverageSummarySnapshot {
  requirementsTotal:           number;
  requirementsCovered:         number;
  requirementsCoveragePercent: number;
  endpointsTotal:              number;
  endpointsCovered:            number;
  endpointsCoveragePercent:    number;
  journeysTotal:               number;
  journeysCovered:             number;
  journeysCoveragePercent:     number;
  riskWeightedCoverageScore:   number;
}

export interface ClosureIteration {
  id:              string;
  closureJobId:    string;
  iterationNumber: number;
  coverageBefore:  CoverageSummarySnapshot;
  coverageAfter:   CoverageSummarySnapshot | null;
  generationPlan:  Record<string, any> | null;
  testsGenerated:  number;
  testsExecuted:   number;
  status:          IterationStatus;
  startedAt:       string | null;
  completedAt:     string | null;
  failureReason:   string | null;
}
