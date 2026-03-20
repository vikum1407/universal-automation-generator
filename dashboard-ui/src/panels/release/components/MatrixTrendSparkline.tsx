export default function MatrixTrendSparkline({ passRate }: { passRate: number }) {
  const pct = Math.max(0, Math.min(1, passRate));
  const height = 16;
  const width = 60;
  const barHeight = pct * height;

  return (
    <svg width={width} height={height}>
      <rect
        x={0}
        y={height - barHeight}
        width={width}
        height={barHeight}
        className="fill-green-500/70"
      />
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        className="fill-transparent stroke-slate-300 dark:stroke-slate-600"
      />
    </svg>
  );
}
