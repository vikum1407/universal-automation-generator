import type { WorkerEvent } from "../../api/types";

export function WorkerEventFeed({ events }: { events: WorkerEvent[] }) {
  if (!events.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Worker Events</h2>

      <div className="space-y-2">
        {events.map((e) => (
          <div key={e.id} className="p-2 border rounded bg-white shadow-sm">
            <div className="text-xs text-gray-500">{e.timestamp}</div>
            <div className="font-medium">{e.worker_id}</div>
            <div className="text-sm text-gray-700">{e.event}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
