import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { ShardAssignment } from "../api/types";

export function useShardAssignments(runId: string) {
  const [data, setData] = useState<ShardAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AnalyticsAPI.getShardAssignments(runId).then((value: unknown) => {
      setData(value as ShardAssignment[]);
      setLoading(false);
    });
  }, [runId]);

  return { data, loading };
}
