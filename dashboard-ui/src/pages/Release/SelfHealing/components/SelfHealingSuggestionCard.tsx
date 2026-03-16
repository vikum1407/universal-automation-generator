import { Link } from 'react-router-dom';
import { SeverityBadge } from '../../../../components/ui/badges/SeverityBadge';
import { TypeBadge } from '../../../../components/ui/badges/TypeBadge';
import type { SelfHealingSuggestion } from '../types';

interface Props {
  suggestion: SelfHealingSuggestion;
  project: string;
}

export function SelfHealingSuggestionCard({ suggestion, project }: Props) {
  return (
    <Link
      to={`/release/${project}/self-healing/${encodeURIComponent(suggestion.id)}`}
      className="flex flex-col gap-2 p-4 hover:bg-slate-50 dark:hover:bg-slate-800"
    >
      <div className="flex items-center justify-between">
        <SeverityBadge impact={suggestion.impact} />
        <TypeBadge type={suggestion.type} />
      </div>

      <div className="font-medium">{suggestion.summary}</div>

      <div className="text-sm text-slate-600 dark:text-slate-300">
        {suggestion.details}
      </div>

      <div className="text-xs text-slate-500">
        Test: {suggestion.testId}
        {suggestion.requirementId ? ` • Requirement: ${suggestion.requirementId}` : ''}
      </div>
    </Link>
  );
}
