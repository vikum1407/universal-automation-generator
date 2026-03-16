interface Props {
  confidence: number; // 0–1
}

export function ConfidenceBar({ confidence }: Props) {
  const pct = Math.round(confidence * 100);

  return (
    <div className="space-y-1">
      <div className="text-xs text-slate-500">Confidence: {pct}%</div>
      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded">
        <div
          className="h-2 bg-green-500 rounded"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
