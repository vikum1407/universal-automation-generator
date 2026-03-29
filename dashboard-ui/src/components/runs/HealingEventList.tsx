import type { HealingEvent } from "../../api/types";

export function HealingEventList({ events }: { events: HealingEvent[] }) {
  if (!events.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Healing Events</h2>

      <div className="space-y-3">
        {events.map((e) => (
          <div key={e.id} className="p-3 border rounded bg-white shadow-sm">
            <div className="font-semibold">
              {e.selector} → {e.healed_selector}
            </div>

            <div className="text-xs text-gray-600 mt-1">
              Confidence: {e.confidence}%
            </div>

            <div className="text-sm text-gray-700 mt-2 whitespace-pre-line">
              {e.reason}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
