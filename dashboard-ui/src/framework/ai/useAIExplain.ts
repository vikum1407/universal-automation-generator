import { useState, useCallback } from 'react';
import { explainBlueprint } from '../api/framework';

interface ExplainState {
  explanation: string | null;
  loading:     boolean;
  error:       string | null;
  configured:  boolean;
}

export function useAIExplain() {
  const [state, setState] = useState<ExplainState>({
    explanation: null,
    loading:     false,
    error:       null,
    configured:  true,
  });

  const explain = useCallback(async (blueprint: Record<string, any>) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await explainBlueprint(blueprint);
      setState({
        explanation: data.explanation ?? null,
        loading:     false,
        error:       null,
        configured:  data.configured ?? true,
      });
    } catch (err: any) {
      setState(s => ({
        ...s,
        loading: false,
        error:   err?.message ?? 'Failed to fetch explanation',
      }));
    }
  }, []);

  return { ...state, explain };
}
