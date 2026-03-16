import { useParams } from "react-router-dom";
import { useHealingInsights } from "./hooks/useHealingInsights";

export function ReleaseHealingInsights() {
  const { project } = useParams();
  const { data, loading, error } = useHealingInsights(project!);

  if (loading) return <div className="p-4">Loading healing insights…</div>;
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
      <h2 className="text-xl font-semibold">Healing Insights</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        A narrative summary of where instability concentrates, what causes it,
        how effective autonomous fixes are, and how risk is evolving across
        your system.
      </p>

      <div className="space-y-6">
        <Section
          title="Where instability is concentrated"
          items={data.problemAreas}
        />
        <Section
          title="What’s causing failures"
          items={data.rootCauses}
        />
        <Section
          title="How effective the fixes are"
          items={data.effectiveness}
        />
        <Section
          title="How risk is evolving"
          items={data.riskTrends}
        />
        <Section
          title="What Qlitz predicts next"
          items={data.predictions}
        />
      </div>
    </div>
  );
}
