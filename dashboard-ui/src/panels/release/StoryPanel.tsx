import { useReleaseStory } from "../../hooks/useReleaseStory";

export default function StoryPanel({ project }: { project: string }) {
  const { story, loading, error } = useReleaseStory(project);

  if (loading) return <div>Loading release story…</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!story) return <div>No story available.</div>;

  return (
    <div className="p-4 rounded bg-white dark:bg-slate-800 shadow space-y-4">
      <div className="text-lg font-semibold">Release Story</div>

      <div className="text-sm">
        Recent execution pass rate is{" "}
        <span className="font-medium">
          {(story.avgPassRate * 100).toFixed(1)}%
        </span>{" "}
        based on the last 5 runs.
      </div>

      {story.unstableReqs.length > 0 && (
        <div>
          <div className="font-semibold mb-1">Unstable Requirements</div>
          <ul className="list-disc ml-5 text-sm text-red-400">
            {story.unstableReqs.map((r) => (
              <li key={r.requirementId}>{r.title}</li>
            ))}
          </ul>
        </div>
      )}

      {story.riskyReqs.length > 0 && (
        <div>
          <div className="font-semibold mb-1">Risky Requirements</div>
          <ul className="list-disc ml-5 text-sm text-yellow-500">
            {story.riskyReqs.map((r) => (
              <li key={r.requirementId}>{r.title}</li>
            ))}
          </ul>
        </div>
      )}

      {story.healingSignals.length > 0 && (
        <div>
          <div className="font-semibold mb-1">Healing Signals</div>
          <ul className="list-disc ml-5 text-sm text-green-500">
            {story.healingSignals.map((h: any, idx: number) => (
              <li key={idx}>
                {h.summary ??
                  h.message ??
                  h.description ??
                  JSON.stringify(h)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
