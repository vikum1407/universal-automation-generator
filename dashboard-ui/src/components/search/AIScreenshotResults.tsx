import type { AIScreenshotResult } from "../../api/types";

export function AIScreenshotResults({ items }: { items: AIScreenshotResult[] }) {
  if (!items.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Screenshot Matches</h2>

      <div className="flex gap-3 overflow-x-auto">
        {items.map((i) => (
          <div
            key={i.screenshot_id}
            className="p-2 border rounded bg-white shadow-sm"
          >
            <img
              src={i.thumbnail_base64}
              className="h-32 rounded"
              alt="match"
            />
            <div className="text-xs text-gray-600 mt-1">
              Score: {i.score}
            </div>
            <div className="text-xs text-gray-500">
              Project: {i.project_id}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
