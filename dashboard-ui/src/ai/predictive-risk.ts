export type RiskForecastPoint = {
  index: number;
  label: string;
  predicted: number;
  confidenceLow: number;
  confidenceHigh: number;
};

function weightedAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const weights = values.map((_, i) => i + 1);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const weightedSum = values.reduce((sum, v, i) => sum + v * weights[i], 0);
  return weightedSum / totalWeight;
}

function volatility(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.map(v => Math.pow(v - avg, 2)).reduce((a, b) => a + b, 0) /
    values.length;
  return Math.sqrt(variance);
}

export function forecastRisk(
  evolutionPoints: any[],
  futureCount: number = 5
): RiskForecastPoint[] {
  if (!evolutionPoints || evolutionPoints.length === 0) return [];

  const history = evolutionPoints.map(p => p.severity);

  const base = weightedAverage(history);
  const vol = volatility(history);

  const results: RiskForecastPoint[] = [];

  for (let i = 1; i <= futureCount; i++) {
    const predicted = base + vol * (i * 0.3);
    results.push({
      index: evolutionPoints.length + i,
      label: `Forecast +${i}`,
      predicted,
      confidenceLow: Math.max(0, predicted - vol * 0.5),
      confidenceHigh: predicted + vol * 0.5
    });
  }

  return results;
}
