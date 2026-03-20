import type { ReleaseIntelligenceResponse } from "./types/ReleaseIntelligenceResponse";
import { computeReadiness } from "@/engine/release/ReadinessEngine";
import { buildReleaseStory } from "@/engine/release/StoryEngine";
import { buildReleaseTimeline } from "@/engine/release/TimelineEngine";
import { buildReleaseSummary } from "@/engine/release/SummaryEngine";

export function getReleaseIntelligenceHandler(context: any): ReleaseIntelligenceResponse {
  const model = context.currentModel;
  const sync = context.syncResult;
  const evolution = context.evolutionResult;

  const readiness = computeReadiness(model, sync, evolution);
  const story = buildReleaseStory(model, sync, evolution);
  const timeline = buildReleaseTimeline(model, sync, evolution);
  const summary = buildReleaseSummary(model, sync, evolution);

  return {
    readiness,
    story,
    timeline,
    summary,
  };
}
