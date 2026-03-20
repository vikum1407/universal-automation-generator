import type { ReleaseOverviewResponse } from "./types/ReleaseOverviewResponse";
import { computeReadiness } from "@/engine/release/ReadinessEngine";
import { buildReleaseStory } from "@/engine/release/StoryEngine";
import { buildReleaseTimeline } from "@/engine/release/TimelineEngine";
import { buildReleaseSummary } from "@/engine/release/SummaryEngine";

export function getReleaseOverviewHandler(context: any): ReleaseOverviewResponse {
  const model = context.currentModel;
  const sync = context.syncResult;
  const evolution = context.evolutionResult;

  const readiness = computeReadiness(model, sync, evolution);
  const story = buildReleaseStory(model, sync, evolution);
  const timeline = buildReleaseTimeline(model, sync, evolution);
  const summary = buildReleaseSummary(model, sync, evolution);

  return {
    model,
    intelligence: {
      readiness,
      story,
      timeline,
      summary,
    },
    sync,
    evolution,
  };
}
