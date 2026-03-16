import type { AnomalyPoint } from "../../../ai/anomaly-engine";

export function AnomalyPanel({ anomalies }: { anomalies: AnomalyPoint[] }) {
  if (!anomalies || anomalies.length === 0) return null;

  return (
    <div className="w-[340px]">
      <div className="font-semibold mb-2">Anomaly Detection</div>
      <ul className="text-xs space-y-2">
        {anomalies.map(a => (
          <li key={a.index} className="border-b pb-1 last:border-b-0">
            <div className="flex justify-between">
              <span className="font-medium">{a.label}</span>
              <span>Severity: {a.severity.toFixed(1)}</span>
            </div>
            <ul className="ml-3 list-disc">
              {a.reason.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
