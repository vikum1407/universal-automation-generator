import { useEffect, useState } from 'react';

const API_BASE = "http://localhost:3000";

export function useExecutionRun(id: string) {
  const [run, setRun] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/history/run/${id}`)
      .then(res => res.json())
      .then((data: any) => {
        setRun(data);
        setLoading(false);
      });
  }, [id]);

  return { run, loading };
}
