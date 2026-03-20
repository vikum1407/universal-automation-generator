import { Card } from "@/components/Card";
import { useExecutionRun } from "@/pages/ExecutionTimeline/hooks/useExecutionRun";

export function TestExecutionTimeline({ runId }: { runId: string }) {
  const { run, loading } = useExecutionRun(runId);

  return (
    <div className="p-4">
      <Card>
        <h2 className="text-lg font-semibold mb-4">Execution Timeline</h2>

        {loading && <div>Loading timeline…</div>}
        {!loading && !run && <div>No timeline data</div>}

        {run && (
          <div className="mt-4">
            {run.TimelineComponent && (
              <run.TimelineComponent events={run.events} />
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
