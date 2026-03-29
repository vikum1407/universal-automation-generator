export function ReplayControls({
  currentTime,
  setCurrentTime
}: {
  currentTime: number;
  setCurrentTime: (t: number) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => setCurrentTime(currentTime - 2000)}
        className="px-3 py-1 rounded bg-neutral-light dark:bg-slate-700"
      >
        ⏪ -2s
      </button>

      <button
        onClick={() => setCurrentTime(currentTime + 2000)}
        className="px-3 py-1 rounded bg-neutral-light dark:bg-slate-700"
      >
        +2s ⏩
      </button>

      <div className="text-sm text-neutral-mid dark:text-slate-400">
        {Math.round(currentTime / 1000)}s
      </div>
    </div>
  );
}
