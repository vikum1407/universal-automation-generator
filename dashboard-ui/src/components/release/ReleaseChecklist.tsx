import type { ReleaseChecklistItem } from "../../api/types";

export function ReleaseChecklist({ items }: { items: ReleaseChecklistItem[] }) {
  if (!items.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Release Checklist</h2>

      <div className="space-y-2">
        {items.map((c) => (
          <div key={c.id} className="flex items-center gap-2">
            <input type="checkbox" checked={c.completed} readOnly />
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
