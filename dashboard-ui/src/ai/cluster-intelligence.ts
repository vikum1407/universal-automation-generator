export type ClusterIntelligence = {
  cluster: string;
  summary: string;
  topPages: string[];
  topTransitions: string[];
  riskHotspots: string[];
  coverageGaps: string[];
  recommendations: string[];
};

export function analyzeCluster(
  clusterName: string,
  journeys: any[],
  coverage: any,
  pageRisk: Record<string, string>,
  transitionFrequency: Record<string, number>
): ClusterIntelligence {
  const clusterJourneys = journeys.filter(j => j.cluster === clusterName);

  const pages: string[] = [];
  const transitions: string[] = [];

  clusterJourneys.forEach(j => {
    j.pages?.forEach((p: string) => pages.push(p));
    j.pages?.slice(0, -1).forEach((p: string, i: number) => {
      transitions.push(`${p} → ${j.pages[i + 1]}`);
    });
  });

  const pageCount: Record<string, number> = {};
  pages.forEach(p => (pageCount[p] = (pageCount[p] || 0) + 1));

  const transitionCount: Record<string, number> = {};
  transitions.forEach(t => (transitionCount[t] = (transitionCount[t] || 0) + 1));

  const topPages = Object.entries(pageCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([p]) => p);

  const topTransitions = Object.entries(transitionCount)
  .sort((a, b) => {
    const freqA = transitionFrequency[a[0]] || 0;
    const freqB = transitionFrequency[b[0]] || 0;
    return freqB - freqA;
  })
  .slice(0, 5)
  .map(([t]) => t);

  const riskHotspots = topPages.filter(p => pageRisk[p] === "P0" || pageRisk[p] === "P1");

  const coverageGaps = topTransitions.filter(t => !coverage.transitions?.[t]);

  const recommendations: string[] = [];

  if (riskHotspots.length) {
    recommendations.push(
      `Prioritize stabilizing high‑risk cluster pages: ${riskHotspots.join(", ")}.`
    );
  }

  if (coverageGaps.length) {
    recommendations.push(
      `Add automation coverage for missing cluster transitions: ${coverageGaps.join(", ")}.`
    );
  }

  if (!riskHotspots.length && !coverageGaps.length) {
    recommendations.push("Cluster appears stable with no major issues.");
  }

  const summary = [
    `Cluster **${clusterName}** contains ${clusterJourneys.length} journeys.`,
    `Top pages include ${topPages.slice(0, 3).join(", ")}.`,
    `Most common transitions include ${topTransitions.slice(0, 3).join(", ")}.`
  ].join(" ");

  return {
    cluster: clusterName,
    summary,
    topPages,
    topTransitions,
    riskHotspots,
    coverageGaps,
    recommendations
  };
}
