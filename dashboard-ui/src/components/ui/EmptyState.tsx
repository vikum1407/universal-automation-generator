export function EmptyState({ message }: { message: string }) {
  return (
    <div className="p-6 text-center text-neutral-mid dark:text-slate-400 border border-dashed border-[var(--card-border)] rounded-card bg-[var(--card-bg)]">
      {message}
    </div>
  );
}
