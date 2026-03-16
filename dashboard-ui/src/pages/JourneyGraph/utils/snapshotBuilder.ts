import { computeEvolutionDiff } from "../../../ai/evolution-engine";

export function buildSnapshots(graphData: any) {
  const diff = computeEvolutionDiff(
    graphData.journeys,
    graphData.journeys,
    graphData.coverage,
    graphData.coverage
  );

  return [{ id: "Snapshot 1", diff }];
}
