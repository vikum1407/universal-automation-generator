// Coverage threshold: requirement is "covered" when its score meets this.
const THRESHOLD: Record<string, number> = { high: 0.90, medium: 0.70, low: 0.50, critical: 0.95 };
// Minimum test count for regression depth check
const MIN_TESTS:  Record<string, number> = { high: 5, medium: 3, low: 1, critical: 7 };

export type TestClass = 'positive' | 'negative' | 'boundary' | 'unknown';

const NEGATIVE_PATTERNS  = /invalid|error|fail|unauthori[sz]ed|reject|forbidden|missing|wrong/i;
const BOUNDARY_PATTERNS  = /boundary|edge|limit|max|min|empty|overflow|exceed/i;

export function classifyTestId(testId: string): TestClass {
  if (BOUNDARY_PATTERNS.test(testId))  return 'boundary';
  if (NEGATIVE_PATTERNS.test(testId))  return 'negative';
  return 'positive';
}

export interface RequirementGapInput {
  requirementId:   string;
  risk:            string;
  priority:        string;
  coverageScore:   number;
  riskWeightedScore: number;
  totalTests:      number;
  uiFlowsTotal:    number;
  endpointsTotal:  number;
  // Classified test counts (derived from tags + test names)
  uiTestIds:       Set<string>;
  apiTestIds:      Set<string>;
  hybridTestIds:   Set<string>;
  allTestIds:      Set<string>;
}

export interface RequirementGapResult {
  hasNoTests:             boolean;
  hasInsufficientTests:   boolean;
  missingUITests:         boolean;
  missingAPITests:        boolean;
  missingHybridTests:     boolean;
  missingNegativeTests:   boolean;
  missingBoundaryTests:   boolean;
  missingRegressionDepth: boolean;
  suggestedUITests:       number;
  suggestedAPITests:      number;
  suggestedHybridTests:   number;
}

export function computeRequirementGap(input: RequirementGapInput): RequirementGapResult {
  const { risk, coverageScore, totalTests, uiFlowsTotal, endpointsTotal } = input;
  const threshold = THRESHOLD[risk] ?? 0.70;
  const minTests  = MIN_TESTS[risk]  ?? 3;

  const hasNoTests           = totalTests === 0;
  const hasInsufficientTests = coverageScore < threshold;

  const missingUITests   = uiFlowsTotal   > 0 && input.uiTestIds.size   === 0;
  const missingAPITests  = endpointsTotal > 0 && input.apiTestIds.size  === 0;
  const missingHybridTests = uiFlowsTotal > 0 && endpointsTotal > 0 && input.hybridTestIds.size === 0;

  // Classify all test IDs by name pattern
  const classes = [...input.allTestIds].map(id => classifyTestId(id));
  const missingNegativeTests   = !classes.includes('negative');
  const missingBoundaryTests   = !classes.includes('boundary');
  const missingRegressionDepth = totalTests < minTests;

  // Suggested test counts
  let suggestedUITests     = 0;
  let suggestedAPITests    = 0;
  let suggestedHybridTests = 0;

  if (hasNoTests) {
    // No tests at all — suggest based on risk level
    const base = risk === 'high' || risk === 'critical' ? 2 : 1;
    suggestedUITests     = uiFlowsTotal   > 0 ? base : 0;
    suggestedAPITests    = endpointsTotal > 0 ? base : 0;
    suggestedHybridTests = uiFlowsTotal   > 0 && endpointsTotal > 0 ? 1 : 0;
  } else if (hasInsufficientTests) {
    // Partial coverage — fill in the gaps
    suggestedUITests     = missingUITests     ? 1 : 0;
    suggestedAPITests    = missingAPITests     ? 1 : 0;
    suggestedHybridTests = missingHybridTests  ? 1 : 0;
    // Suggest extra tests for missing depth
    if (missingNegativeTests)  suggestedAPITests  = Math.max(suggestedAPITests, 1);
    if (missingBoundaryTests)  suggestedUITests   = Math.max(suggestedUITests,  1);
  }

  return {
    hasNoTests, hasInsufficientTests,
    missingUITests, missingAPITests, missingHybridTests,
    missingNegativeTests, missingBoundaryTests, missingRegressionDepth,
    suggestedUITests, suggestedAPITests, suggestedHybridTests,
  };
}
