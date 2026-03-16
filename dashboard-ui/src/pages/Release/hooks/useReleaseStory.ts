import { useEffect, useState } from "react";

export type ReleaseStoryData = {
  summary: {
    title: string;
    narrative: string[];
  };
  highlights: {
    improvements: string[];
    regressions: string[];
    riskDrops: string[];
    riskSpikes: string[];
  };
  metrics: {
    passRateDelta: string;
    failureDelta: string;
    durationDeltaMs: string;
    stabilityDelta: string;
    riskDelta: string;
  };
  verdict: {
    status: "safe" | "risky" | "blocked";
    reason: string;
    severity: "low" | "medium" | "high";
  };
};

export function useReleaseStory(project: string) {
  const [data, setData] = useState<ReleaseStoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/release/${project}/story`)
      .then(res => res.json())
      .then((json: ReleaseStoryData) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [project]);

  return { data, loading };
}
