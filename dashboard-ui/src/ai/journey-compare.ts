export type JourneyDiff = {
  addedPages: string[];
  removedPages: string[];
  reorderedPages: string[];
  riskDelta: { page: string; before: string; after: string }[];
  coverageDelta: { transition: string; before: boolean; after: boolean }[];
  frequencyDelta: { transition: string; before: number; after: number }[];
  summary: string;
};

export function compareJourneys(
  journeyA: any,
  journeyB: any,
  pageRisk: Record<string, string>,
  coverage: any,
  transitionFrequency: Record<string, number>
): JourneyDiff {
  const pagesA: string[] = journeyA.pages || [];
  const pagesB: string[] = journeyB.pages || [];

  const transitionsA = pagesA.slice(0, -1).map((p, i) => `${p} → ${pagesA[i + 1]}`);
  const transitionsB = pagesB.slice(0, -1).map((p, i) => `${p} → ${pagesB[i + 1]}`);

  const addedPages = pagesB.filter(p => !pagesA.includes(p));
  const removedPages = pagesA.filter(p => !pagesB.includes(p));

  const reorderedPages = pagesA.filter(
    p => pagesB.includes(p) && pagesA.indexOf(p) !== pagesB.indexOf(p)
  );

  const riskDelta = pagesA
    .filter(p => pagesB.includes(p))
    .map(p => ({
      page: p,
      before: pageRisk[p] || "P2",
      after: pageRisk[p] || "P2"
    }))
    .filter(r => r.before !== r.after);

  const coverageDelta = Array.from(new Set([...transitionsA, ...transitionsB])).map(t => ({
    transition: t,
    before: !!coverage.transitions?.[t],
    after: !!coverage.transitions?.[t]
  }));

  const frequencyDelta = Array.from(new Set([...transitionsA, ...transitionsB])).map(t => ({
    transition: t,
    before: transitionFrequency[t] || 0,
    after: transitionFrequency[t] || 0
  }));

  const summary = [
    addedPages.length
      ? `New pages introduced: ${addedPages.join(", ")}.`
      : "No new pages added.",
    removedPages.length
      ? `Pages removed: ${removedPages.join(", ")}.`
      : "No pages removed.",
    reorderedPages.length
      ? `Pages reordered: ${reorderedPages.join(", ")}.`
      : "No page order changes detected."
  ].join(" ");

  return {
    addedPages,
    removedPages,
    reorderedPages,
    riskDelta,
    coverageDelta,
    frequencyDelta,
    summary
  };
}
