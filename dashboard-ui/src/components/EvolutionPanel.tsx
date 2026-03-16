import type { EvolutionDiff } from "../ai/evolution-engine";

type Props = {
  evolution: EvolutionDiff | null;
};

export function EvolutionPanel({ evolution }: Props) {
  if (!evolution) {
    return (
      <div className="w-[340px] bg-white dark:bg-slate-900 border rounded shadow p-4 text-sm text-slate-500">
        No evolution data yet. Select snapshots or trigger an evolution analysis.
      </div>
    );
  }

  return (
    <div className="w-[340px] bg-white dark:bg-slate-900 border rounded shadow p-4 text-sm space-y-3">
      <h3 className="font-semibold text-slate-800 dark:text-slate-100">
        Flow Evolution
      </h3>

      <p className="text-slate-600 dark:text-slate-300">
        {evolution.summary}
      </p>

      {evolution.addedPages.length > 0 && (
        <div>
          <div className="font-semibold mb-1">Added pages</div>
          <ul className="list-disc list-inside text-slate-600 dark:text-slate-300">
            {evolution.addedPages.map(p => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {evolution.removedPages.length > 0 && (
        <div>
          <div className="font-semibold mb-1">Removed pages</div>
          <ul className="list-disc list-inside text-slate-600 dark:text-slate-300">
            {evolution.removedPages.map(p => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {evolution.addedTransitions.length > 0 && (
        <div>
          <div className="font-semibold mb-1">New transitions</div>
          <ul className="list-disc list-inside text-slate-600 dark:text-slate-300">
            {evolution.addedTransitions.map(t => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {evolution.removedTransitions.length > 0 && (
        <div>
          <div className="font-semibold mb-1">Removed transitions</div>
          <ul className="list-disc list-inside text-slate-600 dark:text-slate-300">
            {evolution.removedTransitions.map(t => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {evolution.riskChanges.length > 0 && (
        <div>
          <div className="font-semibold mb-1">Risk changes</div>
          <ul className="list-disc list-inside text-slate-600 dark:text-slate-300">
            {evolution.riskChanges.map(rc => (
              <li key={rc.page}>
                {rc.page}: {rc.from} → {rc.to}
              </li>
            ))}
          </ul>
        </div>
      )}

      {evolution.clusterChanges.length > 0 && (
        <div>
          <div className="font-semibold mb-1">Cluster changes</div>
          <ul className="list-disc list-inside text-slate-600 dark:text-slate-300">
            {evolution.clusterChanges.map(cc => (
              <li key={cc.page}>
                {cc.page}: {cc.from} → {cc.to}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
