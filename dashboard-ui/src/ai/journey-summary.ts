export type JourneySummary = {
  title: string;
  summary: string;
  risks: string[];
  recommendations: string[];
};

export function generateJourneySummary(
  journey: any,
  coverage: any,
  pageRisk: Record<string, string>
): JourneySummary {
  const pages: string[] = journey.pages || [];
  const transitions = pages.slice(0, -1).map((p, i) => `${p} → ${pages[i + 1]}`);

  const highRiskPages = pages.filter(p => pageRisk[p] === "P0" || pageRisk[p] === "P1");
  const uncoveredTransitions = transitions.filter(t => !coverage.transitions?.[t]);

  const cluster = journey.cluster ?? "default";

  const summary = [
    `This journey follows ${pages.length} steps, starting at **${pages[0]}** and ending at **${pages[pages.length - 1]}**.`,
    `It belongs to the **${cluster}** behavioral cluster.`,
    `The flow includes ${transitions.length} transitions, with notable movement through key screens such as ${pages.slice(1, 3).join(", ")}.`
  ].join(" ");

  const risks = [
    highRiskPages.length
      ? `High‑risk pages detected: ${highRiskPages.join(", ")}`
      : "No high‑risk pages detected in this journey.",
    uncoveredTransitions.length
      ? `Uncovered transitions: ${uncoveredTransitions.join(", ")}`
      : "All transitions are covered by automation."
  ];

  const recommendations: string[] = [];

  if (highRiskPages.length) {
    recommendations.push(
      `Prioritize stabilizing or testing high‑risk pages: ${highRiskPages.join(", ")}.`
    );
  }

  if (uncoveredTransitions.length) {
    recommendations.push(
      `Add automation coverage for missing transitions: ${uncoveredTransitions.join(", ")}.`
    );
  }

  if (!highRiskPages.length && !uncoveredTransitions.length) {
    recommendations.push("This journey is stable and fully covered.");
  }

  return {
    title: journey.name || "Journey Summary",
    summary,
    risks,
    recommendations
  };
}
