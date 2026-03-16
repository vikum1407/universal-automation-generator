import { useReleaseReadiness } from "./hooks/useReleaseReadiness";
import { ReleaseSummaryCard } from "./components/ReleaseSummaryCard";
import { LatestRunCard } from "./components/LatestRunCard";
import { AiReleaseRecommendation } from "./components/AiReleaseRecommendation";

export default function ReleaseReadinessDashboard() {
  const project = "qlitz-demo";
  const { data, loading } = useReleaseReadiness(project);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!data) {
    return <p>No release readiness data available.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-slate-100">
        Release Readiness
      </h1>

      <ReleaseSummaryCard {...data.releaseSummary} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 my-6">
        <LatestRunCard {...data.latestRun} />
        <AiReleaseRecommendation {...data.aiRecommendation} />
      </div>
    </div>
  );
}
