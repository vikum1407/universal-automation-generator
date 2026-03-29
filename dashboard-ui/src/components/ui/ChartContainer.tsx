export function ChartContainer({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-h3 font-semibold text-neutral-dark dark:text-neutral-light">
        {title}
      </h3>

      <div className="rounded-card border border-[var(--card-border)] bg-[var(--card-bg)] shadow-card p-4">
        {children}
      </div>
    </div>
  );
}
