import { useCPUProfile } from "../../hooks/useCPUProfile";
import { useMemoryTimeline } from "../../hooks/useMemoryTimeline";
import { useBottlenecks } from "../../hooks/useBottlenecks";

import { CPUFlamegraph } from "./CPUFlamegraph";
import { MemoryTimelineChart } from "./MemoryTimelineChart";
import { BottleneckPanel } from "./BottleneckPanel";

export function PerformanceProfilerPanel({ runId }: { runId: string }) {
  const { data: cpu } = useCPUProfile(runId);
  const { data: memory } = useMemoryTimeline(runId);
  const { data: bottlenecks } = useBottlenecks(runId);

  return (
    <div className="space-y-8">
      <CPUFlamegraph root={cpu} />
      <MemoryTimelineChart points={memory} />
      <BottleneckPanel items={bottlenecks} />
    </div>
  );
}
