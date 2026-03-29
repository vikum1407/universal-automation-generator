import { useEffect, useState } from "react";

export function ReplayScreenshots({
  runId,
  currentTime
}: {
  runId: string;
  currentTime: number;
}) {
  const [shots, setShots] = useState<any[]>([]);

  useEffect(() => {
    fetch(`/api/runs/${runId}/screenshots`)
      .then((r) => r.json())
      .then(setShots);
  }, [runId]);

  const nearest = shots.reduce((best, s) => {
    return Math.abs(s.offset_ms - currentTime) <
      Math.abs(best.offset_ms - currentTime)
      ? s
      : best;
  }, shots[0] || null);

  if (!nearest) return null;

  return (
    <div className="rounded-card border border-[var(--card-border)] bg-[var(--card-bg)] p-3">
      <img
        src={nearest.image_url}
        className="w-full rounded-card border border-[var(--card-border)]"
      />
      <div className="text-xs text-neutral-mid dark:text-slate-400 mt-2">
        Screenshot @ {Math.round(nearest.offset_ms / 1000)}s
      </div>
    </div>
  );
}
