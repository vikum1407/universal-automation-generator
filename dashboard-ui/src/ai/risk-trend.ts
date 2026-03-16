export type RiskTrendPoint = {
  index: number;
  label: string;
  avgRisk: number;
};

function priorityToScore(p: string): number {
  switch (p) {
    case "P0":
      return 0;
    case "P1":
      return 1;
    case "P2":
      return 2;
    case "P3":
      return 3;
    default:
      return 2;
  }
}

export function buildRiskTrend(snapshots: any[]): RiskTrendPoint[] {
  if (!snapshots || snapshots.length === 0) return [];

  return snapshots.map((s, idx) => {
    const changes = s.diff?.riskChanges || [];
    if (!changes.length) {
      return {
        index: idx,
        label: s.id ?? `Snapshot ${idx + 1}`,
        avgRisk: 0
      };
    }

    const scores = changes.map((c: any) => priorityToScore(c.to));
    const avg =
      scores.reduce((acc: number, v: number) => acc + v, 0) / scores.length;

    return {
      index: idx,
      label: s.id ?? `Snapshot ${idx + 1}`,
      avgRisk: avg
    };
  });
}
