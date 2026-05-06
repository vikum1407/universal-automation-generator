import React, { useState, useEffect } from 'react';
import { useAIDocs } from './useAIDocs';
import type { GeneratedDoc } from './useAIDocs';

interface Props {
  jobId:    string | null;
  aiEnabled: boolean;
}

export function AIDocsPreviewPanel({ jobId, aiEnabled }: Props) {
  const { docs, loading, error, fetchDocs } = useAIDocs();
  const [activeDoc, setActiveDoc] = useState<string>('README.md');

  useEffect(() => {
    if (jobId && aiEnabled) {
      fetchDocs(jobId);
    }
  }, [jobId, aiEnabled]);

  if (!aiEnabled) return null;
  if (!jobId) return null;

  const current = docs.find(d => d.filename === activeDoc) ?? docs[0] ?? null;

  return (
    <div className="rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-purple-100 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/30">
        <span className="text-purple-500 dark:text-purple-400 text-base">✦</span>
        <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-300">
          AI-Generated Documentation
        </h3>
        {loading && (
          <span className="ml-auto text-xs text-purple-500 animate-pulse">Loading…</span>
        )}
      </div>

      {error && (
        <div className="p-4 text-xs text-red-500">{error}</div>
      )}

      {!loading && docs.length === 0 && !error && (
        <div className="p-6 text-center text-sm text-gray-400 dark:text-gray-500 italic">
          No AI docs were generated for this job.
        </div>
      )}

      {docs.length > 0 && (
        <>
          <div className="flex gap-1 px-4 pt-3">
            {docs.map((doc: GeneratedDoc) => (
              <button
                key={doc.filename}
                onClick={() => setActiveDoc(doc.filename)}
                className={`px-3 py-1 rounded-t-md text-xs font-medium border-b-2 transition-colors ${
                  activeDoc === doc.filename
                    ? 'border-purple-500 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {doc.filename}
              </button>
            ))}
          </div>

          <div className="p-4 max-h-96 overflow-y-auto">
            {current && (
              <pre className="text-xs font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {current.content}
              </pre>
            )}
          </div>
        </>
      )}
    </div>
  );
}
