import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CommandPalette({
  open,
  setOpen,
  toggleTheme,
  toggleSidebar
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  // Example requirement IDs (replace with backend data later)
  const requirementIds = ["REQ-101", "REQ-202", "REQ-303", "REQ-404"];

  const commands = [
    { label: "Execution Timeline", action: () => navigate("/execution") },
    { label: "Execution Trends", action: () => navigate("/execution/trends") },
    { label: "Execution Insights", action: () => navigate("/execution/insights") },
    { label: "Release Readiness", action: () => navigate("/release") },
    { label: "Release Heatmap", action: () => navigate("/release/heatmap") },
    { label: "Release Story", action: () => navigate("/release/story") },
    { label: "Toggle Theme", action: toggleTheme },
    { label: "Toggle Sidebar", action: toggleSidebar },
    ...requirementIds.map((id) => ({
      label: id,
      action: () => navigate(`/release/my-app/requirements/${id}`)
    }))
  ];

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-32 z-50">
      <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-lg shadow-xl p-4">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command or search…"
          className="w-full px-3 py-2 rounded bg-gray-100 dark:bg-slate-700 outline-none"
        />

        <div className="mt-3 max-h-64 overflow-y-auto">
          {filtered.map((cmd, i) => (
            <button
              key={i}
              onClick={() => {
                cmd.action();
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-slate-700"
            >
              {cmd.label}
            </button>
          ))}

          {filtered.length === 0 && (
            <div className="px-3 py-2 text-gray-500 dark:text-slate-400">
              No results
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
