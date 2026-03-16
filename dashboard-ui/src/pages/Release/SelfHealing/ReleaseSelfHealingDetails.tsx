import { useParams } from 'react-router-dom';
import { useSelfHealingDetails } from './hooks/useSelfHealingDetails';
import { useSelfHealingFix } from './hooks/useSelfHealingFix';
import { useApplySelfHealingFix } from './hooks/useApplySelfHealingFix';

import { DiffBlock } from '../../../components/ui/diff/DiffBlock';
import { ConfidenceBar } from '../../../components/ui/badges/ConfidenceBar';
import { CopyButton } from '../../../components/ui/CopyButton';
import { PRStatusBlock } from '../../../components/ui/PRStatusBlock';

export function ReleaseSelfHealingDetails() {
  const { project, suggestionId } = useParams();

  const { data, loading, error } = useSelfHealingDetails(project!, suggestionId!);

  const {
    data: fix,
    loading: fixLoading,
    generating,
    error: fixError,
    generateFix
  } = useSelfHealingFix(project!, suggestionId!);

  const {
    applyFix,
    pr,
    loading: prLoading,
    error: prError
  } = useApplySelfHealingFix(project!, suggestionId!);

  if (loading) return <div className="p-4">Loading…</div>;
  if (error || !data) return <div className="p-4 text-red-500">{error}</div>;

  const suggestion = data.suggestion;

  return (
    <div className="p-6 space-y-8">

      {/* Suggestion Details */}
      <div className="border rounded-lg p-4 space-y-2">
        <h2 className="text-lg font-semibold">Suggestion Details</h2>
        <div className="text-sm">{suggestion.summary}</div>
        <div className="text-sm text-slate-600">{suggestion.details}</div>
      </div>

      {/* AI‑Generated Fix Panel */}
      <div className="border rounded-lg p-4 space-y-4">
        <h2 className="text-lg font-semibold">AI‑Generated Fix</h2>

        {/* FIX LOADING STATE */}
        {(fixLoading || generating) && (
          <div className="p-4 text-sm text-slate-500">
            Generating fix… This may take a few seconds.
            <div className="mt-4 h-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
          </div>
        )}

        {/* FIX EXISTS */}
        {fix && !fixLoading && !generating && (
          <div className="space-y-4">
            <DiffBlock patch={fix.patch} />
            <ConfidenceBar confidence={fix.confidence} />
            <div className="text-sm text-slate-600">{fix.explanation}</div>
            <CopyButton text={fix.patch} />

            {/* APPLY FIX / PR STATUS */}
            {!pr && (
              <button
                onClick={() => applyFix(fix.patch)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Apply Fix
              </button>
            )}

            {prLoading && (
              <div className="text-sm text-slate-500">Creating PR…</div>
            )}

            {pr && <PRStatusBlock pr={pr} />}

            {prError && (
              <div className="text-red-500 text-sm">{prError}</div>
            )}
          </div>
        )}

        {/* NO FIX YET */}
        {!fix && !fixLoading && !generating && (
          <div className="space-y-4">
            <div className="text-sm text-slate-600">
              No fix has been generated yet for this suggestion.
            </div>
            <button
              onClick={generateFix}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Generate Fix
            </button>
            {fixError && <div className="text-red-500 text-sm">{fixError}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
