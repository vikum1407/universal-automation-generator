import { Card } from "../../../components/Card";
import type { EvolutionForecast } from "../hooks/useReleaseEvolution";

type Props = {
  forecast: EvolutionForecast;
};

const confidenceColor: Record<string, string> = {
  high: "text-emerald-600 dark:text-emerald-400",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-slate-600 dark:text-slate-300"
};

export function EvolutionForecastCard({ forecast }: Props) {
  return (
    <Card>
      <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-slate-100">
        Risk Forecast
      </h2>

      <p className="text-sm text-gray-700 dark:text-slate-200 mb-2">
        Predicted risk score for next run:
      </p>
      <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">
        {forecast.nextRunRiskScore}
      </p>

      <p
        className={`text-sm mt-2 font-medium ${confidenceColor[forecast.confidence]}`}
      >
        Confidence: {forecast.confidence.toUpperCase()}
      </p>
    </Card>
  );
}
