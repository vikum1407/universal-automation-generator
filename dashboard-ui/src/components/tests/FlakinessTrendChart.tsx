import type { FlakinessPoint } from "../../api/types";

export function FlakinessTrendChart({ points }: { points: FlakinessPoint[] }) {
  if (!points.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Flakiness Trend</h2>

      <svg width="100%" height="120">
        {points.map((p, i) => {
          const x = (i / (points.length - 1)) * 100;
          const y = 100 - p.flakiness;

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
