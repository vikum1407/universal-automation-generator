import { useExecutionTrends } from "./hooks/useExecutionTrends";
import ExecutionTrendChart from "./components/ExecutionTrendChart";

export default function ExecutionTrendsPanel() {
  const project = "qlitz-demo";
  const { trends, loading } = useExecutionTrends(project);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-slate-100">
        Execution Trends
      </h1>

      {loading && <p>Loading...</p>}

      {!loading && <ExecutionTrendChart trends={trends} />}
    </div>
  );
}
