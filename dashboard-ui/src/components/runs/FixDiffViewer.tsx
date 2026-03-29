import type { FixDiff } from "../../api/types";

export function FixDiffViewer({ diff }: { diff: FixDiff | null }) {
  if (!diff) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">AI Fix Diff</h2>

      <div className="grid grid-cols-2 gap-4">
        <pre className="bg-red-50 p-3 rounded border text-sm overflow-auto">
          {diff.before}
        </pre>

        <pre className="bg-green-50 p-3 rounded border text-sm overflow-auto">
          {diff.after}
        </pre>
      </div>
    </section>
  );
}
