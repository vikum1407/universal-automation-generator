import type { SnapshotDiff } from "../../api/types";
import { Section } from "../ui/Section";
import { Card } from "../ui/Card";
import { Skeleton } from "../ui/Skeleton";

export function SnapshotDiffViewer({
  diff,
  loading
}: {
  diff: SnapshotDiff | null;
  loading: boolean;
}) {
  return (
    <Section title="Snapshot Diff">
      {loading ? (
        <Skeleton height={380} />
      ) : diff ? (
        <Card>
          <iframe
            className="w-full h-96 rounded-card border border-neutral-light"
            srcDoc={diff.diff_html}
          />
        </Card>
      ) : null}
    </Section>
  );
}
