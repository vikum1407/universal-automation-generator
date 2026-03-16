interface ConfidenceBarProps {
  value: number; // 0–1
}

export function ConfidenceBar({ value }: ConfidenceBarProps) {
  const pct = Math.round(value * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-600 dark:text-slate-300">Confidence</span>
        <span className="font-medium">{pct}%</span>
      </div>

      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded">
        <div
          className="h-2 rounded bg-gradient-to-r from-green-500 via-yellow-400 to-red-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
