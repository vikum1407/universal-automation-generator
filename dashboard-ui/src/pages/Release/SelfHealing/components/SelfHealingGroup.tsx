import { useState } from 'react';
import { SeverityBadge } from '../../../../components/ui/badges/SeverityBadge';
import { SelfHealingSuggestionCard } from './SelfHealingSuggestionCard';
import type { SelfHealingSuggestion } from '../types';


interface Props {
  title: string;
  impact: 'high' | 'medium' | 'low';
  suggestions: SelfHealingSuggestion[];
  project: string;
}

export function SelfHealingGroup({ title, impact, suggestions, project }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 font-semibold uppercase"
      >
        <div className="flex items-center gap-2">
          <SeverityBadge impact={impact} />
          {title}
        </div>

        <span className="text-slate-500">
          {open ? '▼' : '▶'}
        </span>
      </button>

      {open && (
        <div className="divide-y">
          {suggestions.map(s => (
            <SelfHealingSuggestionCard
              key={s.id}
              suggestion={s}
              project={project}
            />
          ))}
        </div>
      )}
    </div>
  );
}
