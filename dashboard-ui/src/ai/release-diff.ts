export type ReleaseDiff = {
  addedPages: string[];
  removedPages: string[];
  addedTransitions: string[];
  removedTransitions: string[];
  riskChanges: { page: string; from: string; to: string }[];
  clusterChanges: { page: string; from: string; to: string }[];
};

export function computeReleaseDiff(prev: any, next: any): ReleaseDiff {
  const prevPages = new Set<string>(
    prev.journeys.flatMap((j: any) => j.pages as string[])
  );
  const nextPages = new Set<string>(
    next.journeys.flatMap((j: any) => j.pages as string[])
  );

  const addedPages: string[] = [...nextPages].filter(p => !prevPages.has(p));
  const removedPages: string[] = [...prevPages].filter(p => !nextPages.has(p));

  const prevTransitions = new Set<string>(
    Object.keys(prev.coverage.transitions || {}) as string[]
  );
  const nextTransitions = new Set<string>(
    Object.keys(next.coverage.transitions || {}) as string[]
  );

  const addedTransitions: string[] = [...nextTransitions].filter(
    t => !prevTransitions.has(t)
  );
  const removedTransitions: string[] = [...prevTransitions].filter(
    t => !nextTransitions.has(t)
  );

  const riskChanges: { page: string; from: string; to: string }[] = [];
  const clusterChanges: { page: string; from: string; to: string }[] = [];

  (next.journeys as any[]).forEach((j: any) => {
    (j.pages as string[]).forEach((p: string) => {
      const prevJ = (prev.journeys as any[]).find((x: any) =>
        (x.pages as string[]).includes(p)
      );
      if (!prevJ) return;

      const prevRisk = (prevJ.risk?.priority as string) ?? "P2";
      const nextRisk = (j.risk?.priority as string) ?? "P2";
      if (prevRisk !== nextRisk) {
        riskChanges.push({ page: p, from: prevRisk, to: nextRisk });
      }

      const prevCluster = (prevJ.cluster as string) ?? "unknown";
      const nextCluster = (j.cluster as string) ?? "unknown";
      if (prevCluster !== nextCluster) {
        clusterChanges.push({ page: p, from: prevCluster, to: nextCluster });
      }
    });
  });

  return {
    addedPages,
    removedPages,
    addedTransitions,
    removedTransitions,
    riskChanges,
    clusterChanges
  };
}
