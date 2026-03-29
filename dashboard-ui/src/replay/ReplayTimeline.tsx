import { useEffect, useState } from "react";

export function ReplayTimeline({
  runId,
  currentTime,
  setCurrentTime
}: {
  runId: string;
  currentTime: number;
  setCurrentTime: (t: number) => void;
}) {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/runs/${runId}/timeline`)
      .then((r) => r.json())
      .then(setEvents);
  }, [runId]);

  return (
    <div className="relative h-20 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-card p-3 overflow-x-auto">
      <div className="flex gap-4">
        {events.map((e) => (
          <div
            key={e.timestamp}
            onClick={() => setCurrentTime(e.offset_ms)}
            className={`
              px-2 py-1 rounded text-xs cursor-pointer transition
              ${
                currentTime >= e.offset_ms - 200 &&
                currentTime <= e.offset_ms + 200
                  ? "bg-brand-primary text-white"
                  : "bg-neutral-light dark:bg-slate-700 text-neutral-dark dark:text-slate-300 hover:bg-neutral-light/70"
              }
            `}
          >
            {e.label}
          </div>
        ))}
      </div>
    </div>
  );
}
