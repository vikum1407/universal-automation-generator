interface TypeBadgeProps {
  type: string;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  return (
    <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
      {type.toUpperCase()}
    </span>
  );
}
