import { useState } from "react";
import { generateEvolutionStory } from "../../../ai/evolution-story";

export function useEvolutionStory() {
  const [story, setStory] = useState<string | null>(null);

  function buildStory(diff: any) {
    if (!diff) return;
    setStory(generateEvolutionStory(diff));
  }

  return { story, buildStory };
}
