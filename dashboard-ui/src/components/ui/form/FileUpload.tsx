export function FileUpload({
  label,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-medium text-neutral-dark dark:text-neutral-light">
          {label}
        </label>
      )}

      <input
        type="file"
        {...props}
        className={`
          w-full px-3 py-2 rounded border border-[var(--card-border)]
          bg-[var(--card-bg)] text-[var(--fg)]
          file:bg-brand-primary file:text-white file:border-none file:px-4 file:py-2
          file:mr-4 file:rounded
          transition
          ${className}
        `}
      />
    </div>
  );
}
