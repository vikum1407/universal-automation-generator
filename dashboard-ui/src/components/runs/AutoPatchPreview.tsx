import type { AutoPatch } from "../api/types";

export function AutoPatchPreview({ patch }: { patch: AutoPatch | null }) {
  if (!patch) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold mb-2">Auto‑Patch Preview</h2>

      <pre className="bg-gray-100 p-3 rounded border text-sm overflow-auto">
        {patch.patch}
      </pre>

      <div className="mt-2 text-sm text-gray-700 whitespace-pre-line">
        {patch.instructions}
      </div>
    </section>
  );
}
