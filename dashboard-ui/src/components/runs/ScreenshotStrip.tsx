import type { TimelineEvent } from "../../api/types";

export function ScreenshotStrip({ events }: { events: TimelineEvent[] }) {
  if (!events.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Screenshots</h2>

      <div className="flex gap-2 overflow-x-auto p-2 bg-gray-100 rounded">
        {events.map((e) => (
          <img
            key={e.id}
            src={e.payload?.base64}
            alt="screenshot"
            className="h-32 rounded border"
          />
        ))}
      </div>
    </section>
  );
}
