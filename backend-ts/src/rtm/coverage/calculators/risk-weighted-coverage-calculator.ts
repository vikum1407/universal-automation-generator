const RISK_FACTOR: Record<string, number> = {
  high:   1.0,
  medium: 0.7,
  low:    0.4,
};

export function computeRiskWeightedScore(coverageScore: number, risk: string): number {
  return coverageScore * (RISK_FACTOR[risk] ?? 0.7);
}

// Aggregate risk-weighted score across all requirements
export function aggregateRiskWeightedScore(
  items: { coverageScore: number; risk: string }[],
): number {
  if (!items.length) return 0;
  const total = items.reduce(
    (sum, r) => sum + computeRiskWeightedScore(r.coverageScore, r.risk),
    0,
  );
  return total / items.length;
}
