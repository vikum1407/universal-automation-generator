import type { DurationBucket } from "../../api/types";

export function DurationHistogram({ buckets }: { buckets: DurationBucket[] }) {
  return (
    <div className="flex items-end gap-2 h-40">
      {buckets.map((b) => (
        <div
          key={b.bucket}
          className="bg-blue-500 w-4"
          style={{ height: `${b.count * 10}px` }}
          title={`${b.count} runs`}
        />
      ))}
    </div>
  );
}
