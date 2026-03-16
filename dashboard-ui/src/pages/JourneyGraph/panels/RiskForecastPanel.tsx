import type { RiskForecastPoint } from "../../../ai/predictive-risk";

export function RiskForecastPanel({ forecast }: { forecast: RiskForecastPoint[] }) {
  if (!forecast || forecast.length === 0) return null;

  return (
    <div className="w-[340px]">
      <div className="font-semibold mb-2">Risk Forecast</div>
      <ul className="text-xs space-y-2">
        {forecast.map(p => (
          <li key={p.index} className="border-b pb-1 last:border-b-0">
            <div className="flex justify-between">
              <span className="font-medium">{p.label}</span>
              <span>{p.predicted.toFixed(2)}</span>
            </div>
            <div className="text-[10px] text-gray-500">
              Confidence: {p.confidenceLow.toFixed(2)} – {p.confidenceHigh.toFixed(2)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
