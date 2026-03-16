export type FlowEvolutionPoint = {
  index: number;
  label: string;
  severity: number;
  addedPages: number;
  removedPages: number;
  addedTransitions: number;
  removedTransitions: number;
  riskChanges: number;
  clusterChanges: number;
};

function scoreSnapshot(diff: any): number {
  if (!diff) return 0;

  const addedPages = (diff.addedPages || []).length;
  const removedPages = (diff.removedPages || []).length;
  const addedTransitions = (diff.addedTransitions || []).length;
  const removedTransitions = (diff.removedTransitions || []).length;
  const riskChanges = (diff.riskChanges || []).length;
  const clusterChanges = (diff.clusterChanges || []).length;

  return (
    addedPages * 1 +
    removedPages * 1 +
    addedTransitions * 0.5 +
    removedTransitions * 0.5 +
    riskChanges * 2 +
    clusterChanges * 1.5
  );
}

export function buildFlowEvolution(snapshots: any[]): FlowEvolutionPoint[] {
  if (!snapshots || snapshots.length === 0) return [];

  return snapshots.map((s: any, idx: number) => {
    const diff = s.diff || {};
    const addedPages = (diff.addedPages || []).length;
    const removedPages = (diff.removedPages || []).length;
    const addedTransitions = (diff.addedTransitions || []).length;
    const removedTransitions = (diff.removedTransitions || []).length;
    const riskChanges = (diff.riskChanges || []).length;
    const clusterChanges = (diff.clusterChanges || []).length;

    return {
      index: idx,
      label: s.id ?? `Snapshot ${idx + 1}`,
      severity: scoreSnapshot(diff),
      addedPages,
      removedPages,
      addedTransitions,
      removedTransitions,
      riskChanges,
      clusterChanges
    };
  });
}
