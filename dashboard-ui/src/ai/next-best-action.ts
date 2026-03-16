export type NextBestActions = {
  nextTest: string;
  nextFix: string;
  nextAutomation: string;
  nextInsight: string;
};

export function computeNextBestActions(
  journey: any,
  coverage: any,
  pageRisk: Record<string, string>,
  transitionFrequency: Record<string, number>
): NextBestActions {
  const pages: string[] = journey.pages || [];
  const transitions = pages.slice(0, -1).map((p, i) => `${p} → ${pages[i + 1]}`);

  const score: Record<"P0" | "P1" | "P2", number> = {
    P0: 2,
    P1: 1,
    P2: 0
  };

  const highRiskPages = pages
    .filter(p => pageRisk[p] === "P0" || pageRisk[p] === "P1")
    .sort((a, b) => {
      const ra = (pageRisk[a] as "P0" | "P1" | "P2") || "P2";
      const rb = (pageRisk[b] as "P0" | "P1" | "P2") || "P2";
      return score[rb] - score[ra];
    });

  const nextFix = highRiskPages.length
    ? `Investigate and stabilize high‑risk page: ${highRiskPages[0]}`
    : "No critical page fixes required.";

  const uncoveredTransitions = transitions.filter(t => !coverage.transitions?.[t]);

  const nextTest = uncoveredTransitions.length
    ? `Create a test for uncovered transition: ${uncoveredTransitions[0]}`
    : "All transitions are covered by tests.";

  const automationCandidates = transitions
    .map(t => ({
      t,
      freq: transitionFrequency[t] || 0,
      covered: !!coverage.transitions?.[t]
    }))
    .filter(x => !x.covered)
    .sort((a, b) => b.freq - a.freq);

  const nextAutomation = automationCandidates.length
    ? `Automate high‑traffic uncovered transition: ${automationCandidates[0].t}`
    : "No missing automation for this journey.";

  const loops = transitions.filter(t => {
    const [from, to] = t.split("→").map(s => s.trim());
    return from === to;
  });

  const nextInsight = loops.length
    ? `Investigate loop behavior at: ${loops[0]}`
    : highRiskPages.length
    ? `Analyze why users encounter high‑risk page: ${highRiskPages[0]}`
    : "Journey appears stable with no anomalies.";

  return {
    nextTest,
    nextFix,
    nextAutomation,
    nextInsight
  };
}
