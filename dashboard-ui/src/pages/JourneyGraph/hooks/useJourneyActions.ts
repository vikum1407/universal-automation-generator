import { useState } from "react";
import { generateJourneySummary } from "../../../ai/journey-summary";
import { computeNextBestActions } from "../../../ai/next-best-action";
import { compareJourneys } from "../../../ai/journey-compare";
import { analyzeCluster } from "../../../ai/cluster-intelligence";
import { buildPageRisk } from "../utils/buildPageRisk";

export function useJourneyActions(graphData: any) {
  const [summary, setSummary] = useState<any>(null);
  const [actions, setActions] = useState<any>(null);
  const [diff, setDiff] = useState<any>(null);
  const [clusterIntel, setClusterIntel] = useState<any>(null);

  const [journeyA, setJourneyA] = useState("");
  const [journeyB, setJourneyB] = useState("");
  const [selectedCluster, setSelectedCluster] = useState("");

  function handleExplain() {
    const j = graphData.journeys[0];
    if (!j) return;
    const pageRisk = buildPageRisk(graphData);
    setSummary(generateJourneySummary(j, graphData.coverage, pageRisk));
  }

  function handleRecommend() {
    const j = graphData.journeys[0];
    if (!j) return;
    const pageRisk = buildPageRisk(graphData);
    const tf = graphData.coverage.transitions || {};
    setActions(computeNextBestActions(j, graphData.coverage, pageRisk, tf));
  }

  function handleCompare() {
    if (!journeyA || !journeyB) return;

    const jA = graphData.journeys.find((j: any) => j.name === journeyA);
    const jB = graphData.journeys.find((j: any) => j.name === journeyB);
    if (!jA || !jB) return;

    const pageRisk = buildPageRisk(graphData);
    const tf = graphData.coverage.transitions || {};

    setDiff(compareJourneys(jA, jB, pageRisk, graphData.coverage, tf));
  }

  function handleClusterAnalyze() {
    if (!selectedCluster) return;

    const pageRisk = buildPageRisk(graphData);
    const tf = graphData.coverage.transitions || {};

    setClusterIntel(
      analyzeCluster(
        selectedCluster,
        graphData.journeys,
        graphData.coverage,
        pageRisk,
        tf
      )
    );
  }

  return {
    summary,
    actions,
    diff,
    clusterIntel,
    handleExplain,
    handleRecommend,
    handleCompare,
    handleClusterAnalyze,
    journeyA,
    journeyB,
    setJourneyA,
    setJourneyB,
    selectedCluster,
    setSelectedCluster
  };
}
