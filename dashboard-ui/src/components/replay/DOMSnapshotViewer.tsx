import type { DOMSnapshot } from "../../api/types";
import { Section } from "../ui/Section";
import { Card } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";

export function DOMSnapshotViewer({
  snapshot,
  loading
}: {
  snapshot: DOMSnapshot | null;
  loading: boolean;
}) {
  return (
    <Section title="DOM Snapshot">
      {loading ? (
        <Skeleton height={380} />
      ) : snapshot ? (
        <Card>
          <iframe
            className="w-full h-96 rounded-card border border-neutral-light"
            srcDoc={snapshot.html}
          />
        </Card>
      ) : null}
    </Section>
  );
}
