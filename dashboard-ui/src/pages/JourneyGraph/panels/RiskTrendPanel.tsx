import type { RiskTrendPoint } from "../../../ai/risk-trend";

export function RiskTrendPanel({ trend }: { trend: RiskTrendPoint[] }) {
  if (!trend || trend.length === 0) return null;

  return (
    <div className="w-[340px]">
      <div className="font-semibold mb-2">Risk Trend</div>
      <ul className="text-xs space-y-1">
        {trend.map(p => (
          <li key={p.index}>
            <span className="font-medium">{p.label}:</span> avg risk {p.avgRisk.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}
