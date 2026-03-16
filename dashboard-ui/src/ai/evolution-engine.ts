export type EvolutionDiff = {
  addedPages: string[];
  removedPages: string[];
  addedTransitions: string[];
  removedTransitions: string[];
  riskChanges: Array<{ page: string; from: string; to: string }>;
  clusterChanges: Array<{ page: string; from: string; to: string }>;
  summary: string;
};

export function computeEvolutionDiff(
  _oldJourneys: any[],
  _newJourneys: any[],
  _oldCoverage: any,
  _newCoverage: any
): EvolutionDiff {
  const oldJourneys = _oldJourneys || [];
  const newJourneys = _newJourneys || [];

  const oldPages = new Set<string>();
  const newPages = new Set<string>();

  const oldTransitions = new Set<string>();
  const newTransitions = new Set<string>();

  const oldRisk: Record<string, string> = {};
  const newRisk: Record<string, string> = {};

  const oldCluster: Record<string, string> = {};
  const newCluster: Record<string, string> = {};

  // Extract old snapshot
  oldJourneys.forEach(j => {
    const priority = j.risk?.priority ?? "P2";
    const cluster = j.cluster ?? "default";

    j.pages?.forEach((p: string, i: number) => {
      oldPages.add(p);
      oldRisk[p] = priority;
      oldCluster[p] = cluster;

      if (i < j.pages.length - 1) {
        const t = `${p} → ${j.pages[i + 1]}`;
        oldTransitions.add(t);
      }
    });
  });

  // Extract new snapshot
  newJourneys.forEach(j => {
    const priority = j.risk?.priority ?? "P2";
    const cluster = j.cluster ?? "default";

    j.pages?.forEach((p: string, i: number) => {
      newPages.add(p);
      newRisk[p] = priority;
      newCluster[p] = cluster;

      if (i < j.pages.length - 1) {
        const t = `${p} → ${j.pages[i + 1]}`;
        newTransitions.add(t);
      }
    });
  });

  const addedPages = [...newPages].filter(p => !oldPages.has(p));
  const removedPages = [...oldPages].filter(p => !newPages.has(p));

  const addedTransitions = [...newTransitions].filter(t => !oldTransitions.has(t));
  const removedTransitions = [...oldTransitions].filter(t => !newTransitions.has(t));

  const riskChanges: Array<{ page: string; from: string; to: string }> = [];
  const clusterChanges: Array<{ page: string; from: string; to: string }> = [];

  [...newPages].forEach(p => {
    if (oldRisk[p] && newRisk[p] && oldRisk[p] !== newRisk[p]) {
      riskChanges.push({ page: p, from: oldRisk[p], to: newRisk[p] });
    }

    if (oldCluster[p] && newCluster[p] && oldCluster[p] !== newCluster[p]) {
      clusterChanges.push({ page: p, from: oldCluster[p], to: newCluster[p] });
    }
  });

  const summaryParts: string[] = [];

  if (addedPages.length) summaryParts.push(`Added pages: ${addedPages.join(", ")}`);
  if (removedPages.length) summaryParts.push(`Removed pages: ${removedPages.join(", ")}`);
  if (addedTransitions.length) summaryParts.push(`New transitions: ${addedTransitions.join(", ")}`);
  if (removedTransitions.length) summaryParts.push(`Removed transitions: ${removedTransitions.join(", ")}`);
  if (riskChanges.length) summaryParts.push(`Risk changes: ${riskChanges.length}`);
  if (clusterChanges.length) summaryParts.push(`Cluster changes: ${clusterChanges.length}`);

  const summary = summaryParts.length
    ? summaryParts.join(" • ")
    : "No significant changes detected.";

  return {
    addedPages,
    removedPages,
    addedTransitions,
    removedTransitions,
    riskChanges,
    clusterChanges,
    summary
  };
}
