import type { ProjectFlakinessPoint } from "../../api/types";

export function ProjectFlakinessChart({ points }: { points: ProjectFlakinessPoint[] }) {
  if (!points.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Project Flakiness</h2>

      <svg width="100%" height="140">
        {points.map((p, i) => {
          const x = (i / (points.length - 1)) * 100;
          const y = 100 - p.flakiness;

          return (
            <circle
              key={i}
              cx={`${x}%`}
              cy={`${y}%`}
              r="3"
              fill="orange"
            />
          );
        })}
      </svg>
    </section>
  );
}
