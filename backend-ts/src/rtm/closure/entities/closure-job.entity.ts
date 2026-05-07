export type ClosureJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ClosureJob {
  id:                        string;
  projectId:                 string;
  rtmVersionId:              string;
  framework:                 string;
  language:                  string;
  baseUrl:                   string;
  targetRequirementCoverage: number;
  targetEndpointCoverage:    number | null;
  targetJourneyCoverage:     number | null;
  maxIterations:             number;
  maxTestsPerIteration:      number;
  prioritizeHighRisk:        boolean;
  dryRun:                    boolean;
  status:                    ClosureJobStatus;
  currentIteration:          number;
  testsGeneratedTotal:       number;
  createdAt:                 string;
  completedAt:               string | null;
  failureReason:             string | null;
  iterations?:               import('./closure-iteration.entity').ClosureIteration[];
}

export interface StartClosureJobDto {
  framework:                 string;
  language:                  string;
  baseUrl:                   string;
  targetRequirementCoverage: number;   // 0–1 (e.g., 0.95)
  targetEndpointCoverage?:   number;
  targetJourneyCoverage?:    number;
  maxIterations:             number;
  maxTestsPerIteration:      number;
  prioritizeHighRisk:        boolean;
  dryRun:                    boolean;
}
