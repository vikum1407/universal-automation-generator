import type { GlobalTrendPoint } from "../../api/types";

export function GlobalTrendChart({ points }: { points: GlobalTrendPoint[] }) {
  if (!points.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Org‑Wide Trends</h2>

      <svg width="100%" height="140">
        {points.map((p, i) => {
          const x = (i / (points.length - 1)) * 100;
          const y = 100 - p.failures;

          return (
            <circle
              key={i}
              cx={`${x}%`}
              cy={`${y}%`}
              r="3"
              fill="red"
            />
          );
        })}
      </svg>
    </section>
  );
}
