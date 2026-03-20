export interface ReleaseTimelineItem {
  timestamp: string;
  event: string;
  metadata: Record<string, any>;
}

export function buildReleaseTimeline(
  _model: any,
  sync: any,
  evolution: any
): ReleaseTimelineItem[] {
  const timeline: ReleaseTimelineItem[] = [];

  sync?.drift?.forEach((id: string) => {
    timeline.push({
      timestamp: new Date().toISOString(),
      event: `Drift detected in ${id}`,
      metadata: { id },
    });
  });

  evolution?.updatedTests?.forEach((id: string) => {
    timeline.push({
      timestamp: new Date().toISOString(),
      event: `Test updated: ${id}`,
      metadata: { id },
    });
  });

  evolution?.addedTests?.forEach((id: string) => {
    timeline.push({
      timestamp: new Date().toISOString(),
      event: `Test added: ${id}`,
      metadata: { id },
    });
  });

  evolution?.removedTests?.forEach((id: string) => {
    timeline.push({
      timestamp: new Date().toISOString(),
      event: `Test removed: ${id}`,
      metadata: { id },
    });
  });

  return timeline;
}
