import React from 'react';
import type { SelfHealingSummary } from '../types';

interface SelfHealingSummaryHeaderProps {
  summary: SelfHealingSummary;
}

export default function SelfHealingSummaryHeader({
  summary,
}: SelfHealingSummaryHeaderProps) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold mb-2">Self‑Healing Suggestions</h2>

      <div className="flex flex-wrap gap-4 text-sm">
        <div>
          <span className="font-semibold">Total:</span>{' '}
          {summary.totalSuggestions}
        </div>
        <div className="text-red-600">
          <span className="font-semibold">High:</span> {summary.highImpact}
        </div>
        <div className="text-orange-500">
          <span className="font-semibold">Medium:</span> {summary.mediumImpact}
        </div>
        <div className="text-yellow-600">
          <span className="font-semibold">Low:</span> {summary.lowImpact}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
        {Object.entries(summary.byType).map(([type, count]) => (
          <div key={type}>
            <span className="font-semibold">{type}:</span> {count}
          </div>
        ))}
      </div>
    </div>
  );
}
