export function Section({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 mt-section">
      <h2 className="text-h2 font-semibold text-neutral-dark dark:text-neutral-light">
        {title}
      </h2>
      {children}
    </section>
  );
}
