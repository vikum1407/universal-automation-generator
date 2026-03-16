import { useParams } from "react-router-dom";
import { useStabilityRecommendations } from "./hooks/useStabilityRecommendations";

export function ReleaseStabilityRecommendations() {
  const { project } = useParams();
  const { data, loading, error } = useStabilityRecommendations(project!);

  if (loading) return <div className="p-4">Loading stability recommendations…</div>;
  if (error || !data) return <div className="p-4 text-red-500">{error}</div>;

  const Section = ({
    title,
    items
  }: {
    title: string;
    items: string[];
  }) => {
    if (!items || !items.length) return null;
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-200">
          {items.map((line, idx) => (
            <li key={idx}>{line}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">Stability Recommendations</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Guidance generated from healing patterns, risk trends, and nightly runs.
        These recommendations help improve long-term stability across your
        codebase, tests, infrastructure, and engineering workflows.
      </p>

      <div className="space-y-6">
        <Section title="Codebase Improvements" items={data.codebase} />
        <Section title="Test Suite Improvements" items={data.tests} />
        <Section title="Infrastructure Improvements" items={data.infrastructure} />
        <Section title="Process Improvements" items={data.process} />
        <Section title="Preventive Actions" items={data.preventive} />
      </div>
    </div>
  );
}
