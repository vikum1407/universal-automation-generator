import type { CoverageSummarySnapshot } from '../entities/closure-iteration.entity';

export interface ClosureStrategy {
  targetRequirementCoverage: number;  // 0–1
  targetEndpointCoverage?:   number;
  targetJourneyCoverage?:    number;
  maxIterations:             number;
  maxTestsPerIteration:      number;
  prioritizeHighRisk:        boolean;
  dryRun:                    boolean;
  framework:                 string;
  language:                  string;
  baseUrl:                   string;
}

export function coverageTargetsMet(snap: CoverageSummarySnapshot, strategy: ClosureStrategy): boolean {
  const reqMet = snap.requirementsCoveragePercent >= strategy.targetRequirementCoverage * 100;
  const epMet  = !strategy.targetEndpointCoverage
    || snap.endpointsCoveragePercent >= strategy.targetEndpointCoverage * 100;
  const jMet   = !strategy.targetJourneyCoverage
    || snap.journeysCoveragePercent  >= strategy.targetJourneyCoverage  * 100;
  return reqMet && epMet && jMet;
}

export function coverageDelta(before: CoverageSummarySnapshot, after: CoverageSummarySnapshot): number {
  return after.requirementsCoveragePercent - before.requirementsCoveragePercent;
}

// Map gap plan urgency to a generation strategy
export function resolveGenStrategy(plan: { summary: { must: number; should: number } }): 'smoke' | 'regression' | 'full' {
  if (plan.summary.must > 0) return 'regression';
  return 'full';
}
