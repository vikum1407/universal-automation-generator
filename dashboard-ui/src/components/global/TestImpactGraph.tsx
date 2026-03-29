import type { TestImpactItem } from "../../api/types";

export function TestImpactGraph({ items }: { items: TestImpactItem[] }) {
  if (!items.length) return null;

  const nodes = Array.from(new Set(items.flatMap(i => [i.test_id, ...i.impacted_tests])));

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Test Impact Analysis</h2>

      <div className="relative h-64 border rounded bg-white">
        {nodes.map((n, i) => (
          <div
            key={n}
            className="absolute p-2 bg-gray-100 rounded border text-xs"
            style={{
              left: `${(i / nodes.length) * 80 + 10}%`,
              top: `${(i % 5) * 20 + 10}%`
            }}
          >
            {n}
          </div>
        ))}

        {items.map((i, idx) =>
          i.impacted_tests.map((t) => {
            const s = nodes.indexOf(i.test_id);
            const d = nodes.indexOf(t);

            return (
              <svg
                key={`${idx}-${t}`}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
              >
                <line
                  x1={`${(s / nodes.length) * 80 + 10}%`}
                  y1={`${(s % 5) * 20 + 10}%`}
                  x2={`${(d / nodes.length) * 80 + 10}%`}
                  y2={`${(d % 5) * 20 + 10}%`}
                  stroke="blue"
                  strokeWidth={Math.max(1, i.impact_score)}
                />
              </svg>
            );
          })
        )}
      </div>
    </section>
  );
}
