import { useEffect, useState, useRef } from "react";
import { AnalyticsAPI } from "../api/analytics";
import type { DOMSnapshot } from "../api/types";

const cache = new Map<string, DOMSnapshot>();

export function useSnapshot(snapshotId: string | null) {
  const [data, setData] = useState<DOMSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    if (!snapshotId) return;

    if (cache.has(snapshotId)) {
      setData(cache.get(snapshotId)!);
      return;
    }

    setLoading(true);
    lastId.current = snapshotId;

    AnalyticsAPI.getSnapshot(snapshotId).then((value: unknown) => {
      if (lastId.current !== snapshotId) return;
      const snap = value as DOMSnapshot;
      cache.set(snapshotId, snap);
      setData(snap);
      setLoading(false);
    });
  }, [snapshotId]);

  return { data, loading };
}
