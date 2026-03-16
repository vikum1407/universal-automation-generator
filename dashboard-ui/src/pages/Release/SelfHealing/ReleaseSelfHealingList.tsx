import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelfHealingList } from "./hooks/useSelfHealingList";

interface Suggestion {
  id: string;
  summary: string;
  details: string;
}

export function ReleaseSelfHealingList() {
  const { project } = useParams();
  const navigate = useNavigate();

  const { data, loading, error } = useSelfHealingList(project!);
  const [selected, setSelected] = useState<string[]>([]);

  if (loading) return <div className="p-4">Loading…</div>;
  if (error || !data) return <div className="p-4 text-red-500">{error}</div>;

  const suggestions: Suggestion[] = data.suggestions;

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const runPipeline = async () => {
    if (!selected.length) return;

    const res = await fetch(
      `/dashboard/projects/${encodeURIComponent(
        project!
      )}/self-healing/pipeline`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestionIds: selected })
      }
    );

    if (!res.ok) return;

    const json = await res.json();

    navigate(
      `/release/${encodeURIComponent(
        project!
      )}/self-healing/pipeline/${encodeURIComponent(json.pipelineId)}`
    );
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Self‑Healing Suggestions</h2>

        <button
          onClick={runPipeline}
          disabled={!selected.length}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          Run Self‑Healing Pipeline
        </button>
      </div>

      <div className="space-y-2">
        {suggestions.map((s: Suggestion) => (
          <div
            key={s.id}
            className="flex items-center gap-3 border rounded-lg p-3"
          >
            <input
              type="checkbox"
              checked={selected.includes(s.id)}
              onChange={() => toggleSelect(s.id)}
            />

            <div className="flex-1">
              <div className="text-sm font-medium">{s.summary}</div>
              <div className="text-xs text-slate-500">{s.details}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
