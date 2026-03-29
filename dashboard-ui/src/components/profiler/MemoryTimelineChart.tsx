import type { MemoryPoint } from "../../api/types";

export function MemoryTimelineChart({ points }: { points: MemoryPoint[] }) {
  if (!points.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Memory Timeline</h2>

      <svg width="100%" height="120">
        {points.map((p, i) => {
          const x = (i / (points.length - 1)) * 100;
          const y = 100 - p.used_mb;

          return (
            <circle
              key={i}
              cx={`${x}%`}
              cy={`${y}%`}
              r="3"
              fill="blue"
            />
          );
        })}
      </svg>
    </section>
  );
}
