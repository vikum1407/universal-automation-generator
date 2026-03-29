import { useWorkers } from "../../hooks/useWorkers";
import { useWorkerEvents } from "../../hooks/useWorkerEvents";
import { useShardAssignments } from "../../hooks/useShardAssignments";

import { WorkerGrid } from "./WorkerGrid";
import { WorkerEventFeed } from "./WorkerEventFeed";
import { ShardMap } from "./ShardMap";

export function DistributedExecutionPanel({ runId }: { runId: string }) {
  const { data: workers } = useWorkers();
  const { data: events } = useWorkerEvents();
  const { data: shards } = useShardAssignments(runId);

  return (
    <div className="space-y-8">
      <WorkerGrid workers={workers} />
      <ShardMap shards={shards} />
      <WorkerEventFeed events={events} />
    </div>
  );
}
