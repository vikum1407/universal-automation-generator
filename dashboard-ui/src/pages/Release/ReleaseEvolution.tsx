import { useReleaseEvolution } from "./hooks/useReleaseEvolution";
import { EvolutionTrendsCard } from "./components/EvolutionTrendsCard";
import { EvolutionForecastCard } from "./components/EvolutionForecastCard";
import { EvolutionRecommendationsCard } from "./components/EvolutionRecommendationsCard";

export default function ReleaseEvolution() {
  const project = "qlitz-demo";
  const { data, loading } = useReleaseEvolution(project);

  if (loading) return <p>Loading...</p>;
  if (!data) return <p>No evolution data available.</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-slate-100">
        Release Evolution
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <EvolutionTrendsCard trends={data.trends} />
        </div>
        <div className="lg:col-span-1">
          <EvolutionForecastCard forecast={data.riskForecast} />
        </div>
      </div>

      <EvolutionRecommendationsCard recommendations={data.recommendations} />
    </div>
  );
}
