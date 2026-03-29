import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { StabilityLeaderboardItem } from "../api/types";

export function useStabilityLeaderboard() {
  const [data, setData] = useState<StabilityLeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getStabilityLeaderboard().then((value: unknown) => {
      setData(value as StabilityLeaderboardItem[]);
      setLoading(false);
    });
  }, []);

  return { data, loading };
}
