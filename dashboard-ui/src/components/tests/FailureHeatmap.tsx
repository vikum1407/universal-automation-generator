import type { HeatmapCell } from "../../api/types";

export function FailureHeatmap({ cells }: { cells: HeatmapCell[] }) {
  if (!cells.length) return null;

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const hours = [...Array(24).keys()];

  const lookup = new Map<string, number>();
  cells.forEach((c) => {
    lookup.set(`${c.day}-${c.hour}`, c.failures);
  });

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Failure Heatmap</h2>

      <div className="grid grid-cols-25 gap-1">
        <div></div>
        {hours.map((h) => (
          <div key={h} className="text-xs text-center text-gray-600">
            {h}
          </div>
        ))}

        {days.map((d) => (
          <>
            <div key={d} className="text-xs text-gray-600">{d}</div>
            {hours.map((h) => {
              const v = lookup.get(`${d}-${h}`) || 0;
              const intensity = Math.min(255, v * 20);
              return (
                <div
                  key={`${d}-${h}`}
                  className="w-4 h-4 rounded"
                  style={{
                    backgroundColor: `rgb(255, ${255 - intensity}, ${255 - intensity})`
                  }}
                />
              );
            })}
          </>
        ))}
      </div>
    </section>
  );
}
