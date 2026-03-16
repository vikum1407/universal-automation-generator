import type { ReleaseDiff } from "./release-diff";

export function generateReleaseStory(diff: ReleaseDiff) {
  const lines: string[] = [];

  if (diff.addedPages.length > 0)
    lines.push(`New pages introduced: ${diff.addedPages.join(", ")}.`);

  if (diff.removedPages.length > 0)
    lines.push(`Pages removed: ${diff.removedPages.join(", ")}.`);

  if (diff.addedTransitions.length > 0)
    lines.push(`New transitions added: ${diff.addedTransitions.join(", ")}.`);

  if (diff.removedTransitions.length > 0)
    lines.push(`Transitions removed: ${diff.removedTransitions.join(", ")}.`);

  if (diff.riskChanges.length > 0) {
    const r = diff.riskChanges
      .map(rc => `${rc.page} (${rc.from} → ${rc.to})`)
      .join(", ");
    lines.push(`Risk changes detected: ${r}.`);
  }

  if (diff.clusterChanges.length > 0) {
    const c = diff.clusterChanges
      .map(cc => `${cc.page} (${cc.from} → ${cc.to})`)
      .join(", ");
    lines.push(`Cluster drift observed: ${c}.`);
  }

  if (lines.length === 0)
    return "No meaningful changes between releases.";

  return lines.join(" ");
}
