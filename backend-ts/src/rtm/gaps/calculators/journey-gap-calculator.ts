const JOURNEY_THRESHOLD = 0.60;

export interface JourneyGapInput {
  journeyId:     string;
  coverageScore: number;
  testIds:       Set<string>;
}

export interface JourneyGapResult {
  hasNoTests:              boolean;
  hasInsufficientTests:    boolean;
  missingEndToEndFlow:     boolean;
  missingAlternativePaths: boolean;
}

export function computeJourneyGap(input: JourneyGapInput): JourneyGapResult {
  const { coverageScore, testIds } = input;

  const hasNoTests           = testIds.size === 0;
  const hasInsufficientTests = coverageScore < JOURNEY_THRESHOLD;

  // End-to-end: at least one test that's not classified purely as "negative" or "boundary"
  const names = [...testIds];
  const missingEndToEndFlow = hasNoTests ||
    names.every(id => /invalid|error|fail|boundary|edge|limit/i.test(id));

  // Alternative paths: need at least 2 distinct tests
  const missingAlternativePaths = testIds.size < 2;

  return {
    hasNoTests,
    hasInsufficientTests,
    missingEndToEndFlow,
    missingAlternativePaths,
  };
}
