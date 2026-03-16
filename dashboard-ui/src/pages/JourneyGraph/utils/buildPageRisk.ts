export function buildPageRisk(graphData: any) {
  const pageRisk: Record<string, string> = {};
  graphData.journeys.forEach((j: any) => {
    const priority = j.risk?.priority ?? "P2";
    j.pages?.forEach((p: string) => (pageRisk[p] = priority));
  });
  return pageRisk;
}
