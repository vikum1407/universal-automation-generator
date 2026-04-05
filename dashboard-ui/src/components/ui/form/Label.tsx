export function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-medium text-neutral-dark dark:text-neutral-light">
      {children}
    </label>
  );
}
