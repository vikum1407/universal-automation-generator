import type { ClusterIntelligence } from "../ai/cluster-intelligence";

type Props = {
  cluster: ClusterIntelligence | null;
};

export function ClusterIntelligencePanel({ cluster }: Props) {
  if (!cluster) return null;

  return (
    <div className="p-4 border rounded bg-white shadow w-[350px] text-sm">
      <h2 className="font-semibold text-lg mb-3">
        Cluster Intelligence: {cluster.cluster}
      </h2>

      <p className="mb-4 text-gray-700">{cluster.summary}</p>

      <Section title="Top Pages" items={cluster.topPages} />
      <Section title="Top Transitions" items={cluster.topTransitions} />
      <Section title="Risk Hotspots" items={cluster.riskHotspots} />
      <Section title="Coverage Gaps" items={cluster.coverageGaps} />
      <Section title="Recommendations" items={cluster.recommendations} />
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;

  return (
    <div className="mb-3">
      <h3 className="font-semibold">{title}</h3>
      <ul className="list-disc ml-5 text-gray-700">
        {items.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
