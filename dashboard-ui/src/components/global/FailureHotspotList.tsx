import type { FailureHotspot } from "../../api/types";

export function FailureHotspotList({ items }: { items: FailureHotspot[] }) {
  if (!items.length) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Failure Hotspots</h2>

      <ul className="list-disc ml-6 space-y-1">
        {items.map((h) => (
          <li key={h.file}>
            {h.file} — {h.count} failures
          </li>
        ))}
      </ul>
    </section>
  );
}
