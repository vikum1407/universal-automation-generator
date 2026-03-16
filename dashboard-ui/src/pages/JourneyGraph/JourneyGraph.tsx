import { useRef } from "react";

import { PageHeader } from "../../components/PageHeader";
import { Card } from "../../components/Card";

import { useGraphData } from "../../graph/useGraphData";
import { GraphProvider } from "../../graph/graphContext";
import { useJourneyGraph } from "../../graph";

import { ExplainButton } from "./controls/ExplainButton";
import { RecommendButton } from "./controls/RecommendButton";
import { CompareControls } from "./controls/CompareControls";
import { ClusterControls } from "./controls/ClusterControls";
import { EvolutionControls } from "./controls/EvolutionControls";
import { EvolutionHeatmapSelector } from "./controls/EvolutionHeatmapSelector";
import { EvolutionStoryButton } from "./controls/EvolutionStoryButton";
import { ReleaseCompareButton } from "./controls/ReleaseCompareButton";
import { AnomalyButton } from "./controls/AnomalyButton";
import { TransitionHealingButton } from "./controls/TransitionHealingButton";

import { SummaryPanel } from "./panels/SummaryPanel";
import { NextBestActionPanel } from "./panels/NextBestActionPanel";
import { ComparisonPanel } from "./panels/ComparisonPanel";
import { ClusterPanel } from "./panels/ClusterPanel";
import { EvolutionPanel } from "./panels/EvolutionPanel";
import { EvolutionPlaybackControls } from "./panels/EvolutionPlaybackControls";
import { EvolutionTimeline } from "./panels/EvolutionTimeline";
import { EvolutionStoryPanel } from "./panels/EvolutionStoryPanel";
import { ReleasePanel } from "./panels/ReleasePanel";
import { ReleaseStoryPanel } from "./panels/ReleaseStoryPanel";
import { RiskTrendPanel } from "./panels/RiskTrendPanel";
import { FlowEvolutionPanel } from "./panels/FlowEvolutionPanel";
import { AnomalyPanel } from "./panels/AnomalyPanel";
import { RiskForecastPanel } from "./panels/RiskForecastPanel";
import { TransitionHealingPanel } from "./panels/TransitionHealingPanel";

import { useJourneyActions } from "./hooks/useJourneyActions";
import { useEvolution } from "./hooks/useEvolution";
import { usePlayback } from "./hooks/usePlayback";
import { useEvolutionHeatmap } from "./hooks/useEvolutionHeatmap";
import { useEvolutionStory } from "./hooks/useEvolutionStory";
import { useReleaseDiff } from "./hooks/useReleaseDiff";
import { useRiskTrends } from "./hooks/useRiskTrends";
import { useFlowEvolution } from "./hooks/useFlowEvolution";
import { useAnomalies } from "./hooks/useAnomalies";
import { useRiskForecast } from "./hooks/useRiskForecast";
import { useTransitionHealing } from "./hooks/useTransitionHealing";

export default function JourneyGraph() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const miniMapRef = useRef<HTMLDivElement | null>(null);

  const graphData = useGraphData();

  const g = useJourneyGraph(
    containerRef,
    miniMapRef,
    graphData.journeys,
    graphData.coverage,
    graphData.svgContent
  ) as any;

  const {
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
  } = useJourneyActions(graphData);

  const {
    evolution,
    snapshots,
    handleEvolution
  } = useEvolution(graphData);

  const {
    evoPlayback,
    evoIndex,
    setEvoIndex
  } = usePlayback(g, snapshots);

  const { mode, setMode } = useEvolutionHeatmap(g, snapshots);

  const { story, buildStory } = useEvolutionStory();

  const {
    releaseDiff,
    releaseStory,
    compareReleases
  } = useReleaseDiff();

  const { trend } = useRiskTrends(snapshots);

  const { evolutionPoints } = useFlowEvolution(snapshots);

  const { anomalies } = useAnomalies(evolutionPoints);

  const { forecast } = useRiskForecast(evolutionPoints);

  const { result: healing, runHealing } = useTransitionHealing(
  {
    pages: graphData.journeys.map(j => ({ id: j.id, label: j.label })),

    transitions: graphData.journeys.flatMap(j =>
      Array.isArray(j.transitions)
        ? j.transitions.map((t: any) => ({
            from: j.id,
            to: t.to,
            weight: t.weight ?? 1
          }))
        : []
    ),

    clusters: Array.from(
      new Set(graphData.journeys.map(j => j.cluster))
    ).map(c => ({ id: c }))
  },
    evolutionPoints,
    anomalies,
    forecast
  );

  return (
    <GraphProvider value={graphData}>
      <div>
        <PageHeader
          title="Journey Graph"
          subtitle="Cluster intelligence, comparison, AI summaries, recommendations, heatmaps, evolution, story mode, release intelligence, risk trends, flow evolution, anomaly detection, predictive risk forecasting & self‑healing transitions"
        />

        <Card>
          <div className="relative">

            <div className="absolute top-4 left-4 z-20 flex gap-2 items-center">
              <ExplainButton onClick={handleExplain} />
              <RecommendButton onClick={handleRecommend} />

              <CompareControls
                journeyA={journeyA}
                journeyB={journeyB}
                setJourneyA={setJourneyA}
                setJourneyB={setJourneyB}
                journeys={graphData.journeys}
                onCompare={handleCompare}
              />

              <ClusterControls
                selectedCluster={selectedCluster}
                setSelectedCluster={setSelectedCluster}
                clusters={Array.from(new Set(graphData.journeys.map(j => j.cluster)))}
                onAnalyze={handleClusterAnalyze}
              />

              <EvolutionControls onEvolution={handleEvolution} />

              <EvolutionHeatmapSelector mode={mode} setMode={setMode} />

              <EvolutionStoryButton onClick={() => buildStory(evolution)} />

              <ReleaseCompareButton
                onClick={() => compareReleases(graphData, graphData)}
              />

              <AnomalyButton onClick={() => {}} />

              <TransitionHealingButton onHeal={runHealing} />
            </div>

            <div className="absolute top-4 right-[380px] z-20">
              <SummaryPanel summary={summary} />
            </div>

            <div className="absolute top-[260px] right-[380px] z-20">
              <NextBestActionPanel actions={actions} />
            </div>

            <div className="absolute top-[520px] right-[380px] z-20">
              <ComparisonPanel diff={diff} />
            </div>

            <div className="absolute top-[780px] right-[380px] z-20">
              <ClusterPanel cluster={clusterIntel} />
            </div>

            <div className="absolute top-[1040px] right-[380px] z-20">
              <EvolutionPanel evolution={evolution} />
            </div>

            <div className="absolute top-[1300px] right-[380px] z-20 w-[360px]">
              <EvolutionPlaybackControls
                total={evoPlayback?.getTotal() ?? 0}
                index={evoIndex}
                snapshots={snapshots}
                onPlay={() => evoPlayback?.play()}
                onPause={() => evoPlayback?.pause()}
                onResume={() => evoPlayback?.resume()}
                onRestart={() => {
                  evoPlayback?.stop();
                  setEvoIndex(0);
                }}
                onSpeed={s => evoPlayback?.setSpeed(s)}
                onSeek={i => {
                  evoPlayback?.goTo(i);
                  setEvoIndex(i);
                }}
              />
            </div>

            <div className="absolute top-[1500px] right-[380px] z-20 w-[360px]">
              <EvolutionTimeline
                snapshots={snapshots}
                index={evoIndex}
                onSeek={i => {
                  evoPlayback?.goTo(i);
                  setEvoIndex(i);
                }}
              />
            </div>

            <div className="absolute top-[1760px] right-[380px] z-20 w-[360px]">
              <EvolutionStoryPanel story={story} />
            </div>

            <div className="absolute top-[2020px] right-[380px] z-20 w-[360px]">
              <ReleasePanel diff={releaseDiff} />
            </div>

            <div className="absolute top-[2280px] right-[380px] z-20 w-[360px]">
              <ReleaseStoryPanel story={releaseStory} />
            </div>

            <div className="absolute top-[2540px] right-[380px] z-20 w-[360px]">
              <RiskTrendPanel trend={trend} />
            </div>

            <div className="absolute top-[2800px] right-[380px] z-20 w-[360px]">
              <FlowEvolutionPanel points={evolutionPoints} />
            </div>

            <div className="absolute top-[3060px] right-[380px] z-20 w-[360px]">
              <AnomalyPanel anomalies={anomalies} />
            </div>

            <div className="absolute top-[3320px] right-[380px] z-20 w-[360px]">
              <RiskForecastPanel forecast={forecast} />
            </div>

            <div className="absolute top-[3580px] right-[380px] z-20 w-[360px]">
              <TransitionHealingPanel result={healing} />
            </div>

            <div
              ref={containerRef}
              className="w-full h-[80vh] overflow-hidden border rounded bg-white dark:bg-slate-800"
            />

            <div
              ref={miniMapRef}
              className="absolute bottom-4 right-4 z-20 w-[200px] h-[200px]"
            />

            <div
              id="cluster-legend"
              className="absolute top-4 right-4 z-20"
            />
          </div>
        </Card>
      </div>
    </GraphProvider>
  );
}
