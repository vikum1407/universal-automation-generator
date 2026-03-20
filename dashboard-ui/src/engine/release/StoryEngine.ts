export interface ReleaseStoryItem {
  type: string;
  message: string;
  timestamp: string;
}

export interface ReleaseStory {
  title: string;
  items: ReleaseStoryItem[];
}

export function buildReleaseStory(
  _model: any,
  sync: any,
  evolution: any
): ReleaseStory {
  const items: ReleaseStoryItem[] = [];

  if (sync?.drift?.length) {
    items.push({
      type: "drift",
      message: `${sync.drift.length} tests show drift`,
      timestamp: new Date().toISOString(),
    });
  }

  if (evolution?.updatedTests?.length) {
    items.push({
      type: "updated",
      message: `${evolution.updatedTests.length} tests updated`,
      timestamp: new Date().toISOString(),
    });
  }

  if (evolution?.addedTests?.length) {
    items.push({
      type: "added",
      message: `${evolution.addedTests.length} new tests added`,
      timestamp: new Date().toISOString(),
    });
  }

  if (evolution?.removedTests?.length) {
    items.push({
      type: "removed",
      message: `${evolution.removedTests.length} tests removed`,
      timestamp: new Date().toISOString(),
    });
  }

  return {
    title: "Release Story",
    items,
  };
}
