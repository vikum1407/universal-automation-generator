import { useState } from "react";
import { computeReleaseDiff } from "../../../ai/release-diff";
import { generateReleaseStory } from "../../../ai/release-story";

export function useReleaseDiff() {
  const [releaseDiff, setReleaseDiff] = useState<any>(null);
  const [releaseStory, setReleaseStory] = useState<string | null>(null);

  function compareReleases(prev: any, next: any) {
    const diff = computeReleaseDiff(prev, next);
    setReleaseDiff(diff);
    setReleaseStory(generateReleaseStory(diff));
  }

  return { releaseDiff, releaseStory, compareReleases };
}
