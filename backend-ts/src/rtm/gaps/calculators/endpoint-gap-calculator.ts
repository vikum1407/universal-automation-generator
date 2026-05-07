import { classifyTestId } from './requirement-gap-calculator';

const ENDPOINT_THRESHOLD = 0.60;

export interface EndpointGapInput {
  endpointId:    string;
  coverageScore: number;
  testIds:       Set<string>;
}

export interface EndpointGapResult {
  hasNoTests:           boolean;
  hasInsufficientTests: boolean;
  missingPositiveTests: boolean;
  missingNegativeTests: boolean;
  missingBoundaryTests: boolean;
}

export function computeEndpointGap(input: EndpointGapInput): EndpointGapResult {
  const { coverageScore, testIds } = input;

  const hasNoTests           = testIds.size === 0;
  const hasInsufficientTests = coverageScore < ENDPOINT_THRESHOLD;

  const classes = [...testIds].map(id => classifyTestId(id));
  const hasPositive = classes.includes('positive') || (testIds.size > 0 && !classes.every(c => c === 'negative' || c === 'boundary'));
  const hasNegative = classes.includes('negative');
  const hasBoundary = classes.includes('boundary');

  return {
    hasNoTests,
    hasInsufficientTests,
    missingPositiveTests: !hasPositive,
    missingNegativeTests: !hasNegative,
    missingBoundaryTests: !hasBoundary,
  };
}
