import { useEffect, useRef } from "react";

export function ReplayVideo({
  runId,
  currentTime
}: {
  runId: string;
  currentTime: number;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = currentTime / 1000;
    }
  }, [currentTime]);

  return (
    <div className="rounded-card overflow-hidden border border-[var(--card-border)] bg-[var(--card-bg)]">
      <video
        ref={videoRef}
        src={`/api/runs/${runId}/video`}
        className="w-full"
        controls
      />
    </div>
  );
}
