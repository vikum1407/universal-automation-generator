export interface JourneyTestStats {
  totalTests:  number;
  passedTests: number;
  failedTests: number;
}

// Phase 3: binary coverage — has tests exercising this journey?
export function computeJourneyCoverageScore(stats: JourneyTestStats): number {
  return stats.totalTests > 0 ? 1 : 0;
}
