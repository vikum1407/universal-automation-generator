export const loadStabilityContext = async (project: string) => {
  return {
    recentPRDiffs: [],
    testFiles: [],
    riskTrends: [],
    nightlyFailures: [],
    healedPatterns: [],
    predictions: []
  };
};
