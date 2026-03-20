import { useRequirementDetails } from "../../hooks/useRequirementDetails";

export default function RequirementExplorer({
  project,
  requirementId,
}: {
  project: string;
  requirementId: string;
}) {
  const { requirement, executions, loading, error } =
    useRequirementDetails(project, requirementId);

  if (loading) return <div>Loading requirement…</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!requirement) return <div>Requirement not found.</div>;

  return (
    <div className="p-4 rounded bg-white dark:bg-slate-800 shadow space-y-4">
      <div>
        <div className="text-lg font-semibold">{requirement.title}</div>
        <div className="text-sm text-gray-500">
          Status: {requirement.status}
        </div>
        <div className="text-sm">
          Pass rate: {(requirement.passRate * 100).toFixed(1)}%
        </div>
        <div className="text-sm">
          Recent failures: {requirement.recentFailures}
        </div>
      </div>

      <div>
        <div className="font-semibold mb-1">Linked Tests</div>
        <ul className="list-disc ml-5 text-sm text-gray-600">
          {requirement.linkedTests.map((t: string) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      <div>
        <div className="font-semibold mb-1">Recent Executions</div>
        <ul className="list-disc ml-5 text-sm text-gray-600">
          {executions.slice(0, 5).map((run) => (
            <li key={run.runId}>
              {new Date(run.startedAt).toLocaleString()} — Passed: {run.passed},
              Failed: {run.failed}, Flaky: {run.flaky}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
