import { useParams } from "react-router-dom";
import { useExecutionRun } from "./hooks/useExecutionRun";
import ExecutionResultTable from "./components/ExecutionResultTable";

export default function ExecutionRunDetails() {
  const { id } = useParams();
  const { run, loading } = useExecutionRun(id!);

  if (loading) return <p>Loading...</p>;
  if (!run) return <p>Run not found</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-slate-100">
        Execution Run: {run.id}
      </h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold">Summary</h2>
        <p>Passed: {run.execution.summary.passed}</p>
        <p>Failed: {run.execution.summary.failed}</p>
        <p>Total: {run.execution.summary.total}</p>
      </div>

      <ExecutionResultTable results={run.execution.results} />

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Raw Logs</h2>
        <pre className="bg-gray-900 text-gray-200 p-4 rounded text-xs">
          {run.execution.raw.stdout}
        </pre>
      </div>
    </div>
  );
}
