import { useSelfHealing } from "../../hooks/useSelfHealing";

export default function SelfHealingPanel({ project }: { project: string }) {
  const { healingSignals, loading, error } = useSelfHealing(project);

  if (loading) return <div>Loading self‑healing signals…</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4 rounded bg-white dark:bg-slate-800 shadow space-y-4">
      <div className="text-lg font-semibold">Self‑Healing Overview</div>

      {healingSignals.length === 0 && (
        <div className="text-sm text-gray-500">No healing signals detected.</div>
      )}

      {healingSignals.length > 0 && (
        <ul className="list-disc ml-5 text-sm text-gray-600 space-y-1">
          {healingSignals.map((signal: any, idx: number) => (
            <li key={idx}>
              {signal.summary ??
                signal.message ??
                signal.description ??
                JSON.stringify(signal)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
