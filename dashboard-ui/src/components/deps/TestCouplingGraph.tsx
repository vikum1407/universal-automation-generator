import type { TestCouplingEdge } from "../../api/types";

export function TestCouplingGraph({ edges }: { edges: TestCouplingEdge[] }) {
  if (!edges.length) return null;

  const nodes = Array.from(
    new Set(edges.flatMap(e => [e.test_a, e.test_b]))
  );

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Cross‑Test Coupling Map</h2>

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

        {edges.map((e, i) => {
          const s = nodes.indexOf(e.test_a);
          const t = nodes.indexOf(e.test_b);

          return (
            <svg
              key={i}
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
            >
              <line
                x1={`${(s / nodes.length) * 80 + 10}%`}
                y1={`${(s % 5) * 20 + 10}%`}
                x2={`${(t / nodes.length) * 80 + 10}%`}
                y2={`${(t % 5) * 20 + 10}%`}
                stroke="orange"
                strokeWidth={Math.max(1, e.weight)}
              />
            </svg>
          );
        })}
      </div>
    </section>
  );
}
