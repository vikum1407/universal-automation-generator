import { Section } from "../ui/Section";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";

interface Cluster {
  id: string;
  title: string;
  count: number;
  description: string;
}

export function ClusterPanel({ clusters }: { clusters: Cluster[] }) {
  if (!clusters?.length)
    return <EmptyState message="No failure clusters detected." />;

  return (
    <Section title="Failure Clusters">
      <div className="space-y-4">
        {clusters.map((c) => (
          <Card key={c.id}>
            <div className="font-medium text-body">{c.title}</div>
            <div className="text-caption text-neutral-mid mt-1">
              {c.count} occurrences
            </div>
            <div className="text-body text-neutral-dark mt-3 whitespace-pre-line">
              {c.description}
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}
