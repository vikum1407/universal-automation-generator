export function ProgressOverlay({
  title,
  step,
  percent,
}: {
  title: string;
  step: string;
  percent: number;
}) {
  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/40 backdrop-blur-sm
      "
    >
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl px-10 py-8 shadow-xl max-w-md w-full text-center">
        <h2 className="text-xl font-semibold text-[var(--fg)] mb-2">
          {title}
        </h2>

        <p className="text-sm text-neutral-mid dark:text-slate-400 mb-4">
          {step}
        </p>

        <div className="w-full bg-neutral-light dark:bg-slate-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-brand-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="mt-2 text-xs text-neutral-mid dark:text-slate-400">
          {percent}% complete
        </div>
      </div>
    </div>
  );
}
