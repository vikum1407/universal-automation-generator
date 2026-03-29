import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { SnapshotDiff } from "../api/types";

export function useSnapshotDiff(beforeId: string | null, afterId: string | null) {
  const [data, setData] = useState<SnapshotDiff | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!beforeId || !afterId) return;

    setLoading(true);

    AnalyticsAPI.getSnapshotDiff(beforeId, afterId).then((value: unknown) => {
      setData(value as SnapshotDiff);
      setLoading(false);
    });
  }, [beforeId, afterId]);

  return { data, loading };
}
