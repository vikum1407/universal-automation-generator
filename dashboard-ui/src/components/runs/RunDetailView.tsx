import { useRunDetail } from "../../hooks/useRunDetail";
import { useLiveRun } from "../../hooks/useLiveRun";
import { useLiveConsole } from "../../hooks/useLiveConsole";
import { useLiveLogs } from "../../hooks/useLiveLogs";
import { useLiveNetwork } from "../../hooks/useLiveNetwork";
import { useLiveSteps } from "../../hooks/useLiveSteps";
import { useLiveScreenshots } from "../../hooks/useLiveScreenshots";
import { useLiveVideo } from "../../hooks/useLiveVideo";
import { useFixDiff } from "../../hooks/useFixDiff";
import { useAutoPatch } from "../../hooks/useAutoPatch";
import { useRunIntelligence } from "../../hooks/useRunIntelligence";

import { TimelineViewer } from "./TimelineViewer";
import { ConsolePanel } from "./ConsolePanel";
import { LogsPanel } from "./LogsPanel";
import { NetworkPanel } from "./NetworkPanel";
import { NetworkWaterfall } from "./NetworkWaterfall";
import { HarLikeViewer } from "./HarLikeViewer";
import { StepTree } from "./StepTree";
import { ScreenshotStrip } from "./ScreenshotStrip";
import { VideoPlayer } from "./VideoPlayer";
import { AttachmentViewer } from "./AttachmentViewer";
import { FixDiffViewer } from "./FixDiffViewer";
import { AutoPatchPreview } from "./AutoPatchPreview";
import { RunIntelligencePanel } from "./RunIntelligencePanel";

import { buildStepTree } from "../../utils/stepTree";

import { AIInsightsPanel } from "./AIInsightsPanel";
import { AISuggestionPanel } from "./AISuggestionPanel";
import { DistributedInfoPanel } from "./DistributedInfoPanel";
import { useHealingEvents } from "../../hooks/useHealingEvents";
import { useHealingSuggestions } from "../../hooks/useHealingSuggestions";

import { HealingEventList } from "./HealingEventList";
import { HealingSuggestionPanel } from "./HealingSuggestionPanel";
import { DistributedExecutionPanel } from "../cluster/DistributedExecutionPanel";
import { PerformanceProfilerPanel } from "../profiler/PerformanceProfilerPanel";
import { DependencyPanel } from "../deps/DependencyPanel";
import { TestReplayPanel } from "../replay/TestReplayPanel";

import { Section } from "../ui/Section";
import { EmptyState } from "../ui/EmptyState";

export function RunDetailView({ runId }: { runId: string }) {
  const { data, loading } = useRunDetail(runId);
  const { liveEvents, connected } = useLiveRun(runId);
  const { consoleEvents } = useLiveConsole(runId);
  const { logEvents } = useLiveLogs(runId);
  const { networkEvents } = useLiveNetwork(runId);
  const { stepEvents } = useLiveSteps(runId);
  const { screenshots } = useLiveScreenshots(runId);
  const { videoUrl } = useLiveVideo(runId);
  const { data: fixDiff } = useFixDiff(runId);
  const { data: autoPatch } = useAutoPatch(runId);
  const { data: intel } = useRunIntelligence(runId);
  const { data: healingEvents } = useHealingEvents(runId);
  const { data: healingSuggestions } = useHealingSuggestions(runId);

  if (loading) return <EmptyState message="Loading run…" />;
  if (!data) return <EmptyState message="No data found" />;

  const mergedTimeline = [...data.timeline, ...liveEvents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const mergedNetwork = [
    ...mergedTimeline.filter((e) => e.event_type === "network"),
    ...networkEvents
  ];

  const mergedSteps = [
    ...mergedTimeline.filter((e) => e.event_type === "step"),
    ...stepEvents
  ];

  const mergedScreenshots = [
    ...mergedTimeline.filter((e) => e.event_type === "screenshot"),
    ...screenshots
  ];

  const mergedAttachments = mergedTimeline.filter(
    (e) => e.event_type === "attachment"
  );

  const stepTree = buildStepTree(mergedSteps);

  return (
    <div className="space-y-8">
      <Section title="Live Status">
        <div className="flex items-center gap-2">
          <div
            className={`h-3 w-3 rounded-full ${
              connected ? "bg-brand-secondary" : "bg-neutral-mid"
            }`}
          />
          <span>{connected ? "Live" : "Offline"}</span>
        </div>
      </Section>

      <RunIntelligencePanel intel={intel} />

      <VideoPlayer url={videoUrl} />
      <ScreenshotStrip events={mergedScreenshots} />
      <AttachmentViewer events={mergedAttachments} />
      <StepTree steps={stepTree} />

      <FixDiffViewer diff={fixDiff} />
      <AutoPatchPreview patch={autoPatch} />

      <TimelineViewer events={mergedTimeline} />
      <ConsolePanel events={consoleEvents} />
      <LogsPanel events={logEvents} />
      <NetworkPanel events={mergedNetwork} />
      <NetworkWaterfall events={mergedNetwork} />
      <HarLikeViewer events={mergedNetwork} />

      <AIInsightsPanel insights={data.insights} />
      <AISuggestionPanel fix={data.fix} />
      <DistributedInfoPanel info={data.distributed} />
      <HealingEventList events={healingEvents} />
      <HealingSuggestionPanel items={healingSuggestions} />
      <DistributedExecutionPanel runId={runId} />
      <PerformanceProfilerPanel runId={runId} />
      <DependencyPanel runId={runId} />
      <TestReplayPanel runId={runId} />
    </div>
  );
}
