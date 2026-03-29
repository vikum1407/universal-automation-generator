export function Skeleton({ height }: { height: number }) {
  return (
    <div
      className="w-full bg-neutral-light animate-pulse rounded-card"
      style={{ height }}
    />
  );
}
