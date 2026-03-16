import { useParams } from 'react-router-dom';
import { useSelfHealingSummary } from './hooks/useSelfHealingSummary';
import { SelfHealingGroup } from './components/SelfHealingGroup';

export default function ReleaseSelfHealingOverview() {
  const { project } = useParams<{ project: string }>();
  const { data, loading, error } = useSelfHealingSummary(project!);

  if (loading) return <div>Loading self‑healing suggestions…</div>;
  if (error) return <div>Failed to load self‑healing: {error}</div>;
  if (!data || !data.suggestions.length) return <div>No self‑healing suggestions found.</div>;

  const groups = {
    high: data.suggestions.filter(s => s.impact === 'high'),
    medium: data.suggestions.filter(s => s.impact === 'medium'),
    low: data.suggestions.filter(s => s.impact === 'low'),
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Self‑Healing Suggestions</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={data.totalSuggestions} />
        <StatCard label="High impact" value={data.highImpact} />
        <StatCard label="Medium impact" value={data.mediumImpact} />
        <StatCard label="Low impact" value={data.lowImpact} />
      </div>

      <SelfHealingGroup
        title="High Impact"
        impact="high"
        suggestions={groups.high}
        project={project!}
      />

      <SelfHealingGroup
        title="Medium Impact"
        impact="medium"
        suggestions={groups.medium}
        project={project!}
      />

      <SelfHealingGroup
        title="Low Impact"
        impact="low"
        suggestions={groups.low}
        project={project!}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
