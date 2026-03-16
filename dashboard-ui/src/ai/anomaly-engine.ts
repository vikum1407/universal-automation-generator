export type AnomalyPoint = {
  index: number;
  label: string;
  severity: number;
  reason: string[];
};

export function detectAnomalies(flow: any[]): AnomalyPoint[] {
  if (!flow || flow.length === 0) return [];

  const severities = flow.map(f => f.severity);
  const avg = severities.reduce((a, b) => a + b, 0) / severities.length;
  const std =
    Math.sqrt(
      severities
        .map(s => Math.pow(s - avg, 2))
        .reduce((a, b) => a + b, 0) / severities.length
    ) || 0;

  const threshold = avg + std * 1.5;

  return flow
    .map(f => {
      const reasons: string[] = [];

      if (f.severity > threshold) reasons.push("Severity spike");
      if (f.riskChanges > 3) reasons.push("High risk drift");
      if (f.clusterChanges > 2) reasons.push("Cluster instability");
      if (f.addedPages > 3 || f.removedPages > 3)
        reasons.push("Large page structure change");

      return {
        index: f.index,
        label: f.label,
        severity: f.severity,
        reason: reasons
      };
    })
    .filter(a => a.reason.length > 0);
}
