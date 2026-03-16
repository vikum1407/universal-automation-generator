import { useEffect, useState } from 'react';

const API_BASE = "http://localhost:3000";

export function useExecutionTimeline(project: string) {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/history/${project}`)
      .then(res => res.json())
      .then((data: any[]) => {
        setRuns(data);
        setLoading(false);
      });
  }, [project]);

  return { runs, loading };
}
