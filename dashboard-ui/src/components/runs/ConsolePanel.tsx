import type { TimelineEvent } from "../../api/types";

export function ConsolePanel({ events }: { events: TimelineEvent[] }) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Console</h2>
      <div className="bg-black text-green-400 p-3 rounded h-64 overflow-auto text-sm">
        {events.map((e) => (
          <div key={e.id}>{e.payload?.message}</div>
        ))}
      </div>
    </section>
  );
}
