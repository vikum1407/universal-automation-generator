import { Link } from "react-router-dom";
import { useExecutionTimeline } from "./hooks/useExecutionTimeline";
import ExecutionSummaryCard from "./components/ExecutionSummaryCard";

export default function ExecutionTimeline() {
  const project = "qlitz-demo";
  const { runs, loading } = useExecutionTimeline(project);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-slate-100">
        Execution Timeline
      </h1>

      {loading && <p>Loading...</p>}

      <div className="grid grid-cols-1 gap-4">
        {runs.map(run => (
          <Link key={run.id} to={`/execution/${run.id}`}>
            <ExecutionSummaryCard run={run} />
          </Link>
        ))}
      </div>
    </div>
  );
}
