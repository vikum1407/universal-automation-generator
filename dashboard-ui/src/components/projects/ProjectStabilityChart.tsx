import type { ProjectStabilityPoint } from "../../api/types";

export function ProjectStabilityChart({ points }: { points: ProjectStabilityPoint[] }) {
  if (!points.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Project Stability</h2>

      <svg width="100%" height="140">
        {points.map((p, i) => {
          const x = (i / (points.length - 1)) * 100;
          const y = 100 - p.stability;

          return (
            <rect
              key={i}
              x={`${x}%`}
              y={`${y}%`}
              width="4"
              height="4"
              fill="blue"
            />
          );
        })}
      </svg>
    </section>
  );
}
