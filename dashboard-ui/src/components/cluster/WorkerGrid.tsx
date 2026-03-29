import type { WorkerNode } from "../../api/types";
import { WorkerHealthCard } from "./WorkerHealthCard";

export function WorkerGrid({ workers }: { workers: WorkerNode[] }) {
  if (!workers.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Cluster Workers</h2>

      <div className="grid grid-cols-3 gap-4">
        {workers.map((w) => (
          <WorkerHealthCard key={w.id} worker={w} />
        ))}
      </div>
    </section>
  );
}
