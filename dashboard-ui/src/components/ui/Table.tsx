import React from "react";

export function Table({
  headers,
  children
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-[var(--card-border)] bg-[var(--card-bg)] shadow-card">
      <table className="w-full text-sm">
        <thead className="bg-neutral-light dark:bg-slate-800 text-neutral-dark dark:text-neutral-light">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-2 text-left font-semibold border-b border-[var(--card-border)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-[var(--card-border)]">
          {children}
        </tbody>
      </table>
    </div>
  );
}
