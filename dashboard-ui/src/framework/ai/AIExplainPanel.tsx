import React, { useEffect } from 'react';
import { useAIExplain } from './useAIExplain';

interface Props {
  blueprint: Record<string, any>;
}

export function AIExplainPanel({ blueprint }: Props) {
  const { explanation, loading, error, configured, explain } = useAIExplain();

  useEffect(() => {
    if (blueprint?.framework) {
      explain(blueprint);
    }
  }, [blueprint?.framework, blueprint?.language, blueprint?.architecture]);

  if (!configured && !explanation) return null;

  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-blue-600 dark:text-blue-400 text-lg">✦</span>
        <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
          AI Blueprint Explanation
        </h3>
        {loading && (
          <span className="ml-auto text-xs text-blue-500 dark:text-blue-400 animate-pulse">
            Generating…
          </span>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 dark:text-red-400">{error}</p>
      )}

      {!loading && explanation && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {explanation.split('\n').map((line, i) => {
            if (line.startsWith('- ') || line.startsWith('• ')) {
              return (
                <div key={i} className="flex gap-2 mt-1">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span className="text-gray-700 dark:text-gray-300 text-sm">
                    {line.replace(/^[-•]\s*/, '')}
                  </span>
                </div>
              );
            }
            return line ? (
              <p key={i} className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-2">
                {line}
              </p>
            ) : null;
          })}
        </div>
      )}

      {!loading && !explanation && !error && (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          Select a framework and architecture to see AI explanation.
        </p>
      )}
    </div>
  );
}
