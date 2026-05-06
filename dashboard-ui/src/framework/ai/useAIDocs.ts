import { useState, useCallback } from 'react';
import { getJobDocs } from '../api/framework';

export interface GeneratedDoc {
  filename: string;
  content:  string;
}

interface DocsState {
  docs:    GeneratedDoc[];
  loading: boolean;
  error:   string | null;
}

export function useAIDocs() {
  const [state, setState] = useState<DocsState>({
    docs:    [],
    loading: false,
    error:   null,
  });

  const fetchDocs = useCallback(async (jobId: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await getJobDocs(jobId);
      setState({ docs: data.docs ?? [], loading: false, error: null });
    } catch (err: any) {
      setState(s => ({
        ...s,
        loading: false,
        error:   err?.message ?? 'Failed to fetch docs',
      }));
    }
  }, []);

  return { ...state, fetchDocs };
}
