import React from "react";

export function Input({
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
        {...props}
        className={`
          w-full px-3 py-2 rounded border border-[var(--card-border)]
          bg-[var(--card-bg)] text-[var(--fg)]
          focus:outline-none focus:ring-2 focus:ring-brand-primary
          transition
          ${className}
        `}
      />
    </div>
  );
}
