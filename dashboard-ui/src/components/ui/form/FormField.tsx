export function FormField({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-neutral-dark dark:text-neutral-light">
        {label}
      </label>
      {children}
    </div>
  );
}
