import type { JourneySummary } from "../ai/journey-summary";

type Props = {
  summary: JourneySummary | null;
};

export function JourneySummaryPanel({ summary }: Props) {
  if (!summary) return null;

  return (
    <div className="p-4 border rounded bg-white shadow w-[350px] text-sm">
      <h2 className="font-semibold text-lg mb-2">{summary.title}</h2>

      <p className="mb-3 text-gray-700 whitespace-pre-line">
        {summary.summary}
      </p>

      <h3 className="font-semibold mt-3 mb-1">Risks</h3>
      <ul className="list-disc ml-5 text-gray-700">
        {summary.risks.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>

      <h3 className="font-semibold mt-3 mb-1">Recommendations</h3>
      <ul className="list-disc ml-5 text-gray-700">
        {summary.recommendations.map((r, i) => (
          <li key={i}>{r}</li>
        ))}
      </ul>
    </div>
  );
}
