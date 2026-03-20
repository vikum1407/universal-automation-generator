import type { ReleaseIntelligenceResponse } from "@/api/types/ReleaseIntelligenceResponse";

interface ReadinessPanelProps {
  readiness: ReleaseIntelligenceResponse["readiness"];
}

export default function ReadinessPanel({ readiness }: ReadinessPanelProps) {
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-2">Release Readiness</h2>

      <div className="text-4xl font-bold mb-4">{readiness.score}</div>

      <ul className="space-y-2">
        {readiness.guardrails.map((g) => (
          <li key={g.name} className="flex justify-between">
            <span>{g.name}</span>
            <span
              className={
                g.status === "pass"
                  ? "text-green-600"
                  : g.status === "warn"
                  ? "text-yellow-600"
                  : "text-red-600"
              }
            >
              {g.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
