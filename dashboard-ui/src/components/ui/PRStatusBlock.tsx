export function PRStatusBlock({ pr }: any) {
  const color =
    pr.status === "open"
      ? "bg-green-600"
      : pr.status === "merged"
      ? "bg-purple-600"
      : "bg-red-600";

  return (
    <div className="border rounded-lg p-4 space-y-2 bg-slate-50 dark:bg-slate-800">
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 text-xs text-white rounded ${color}`}>
          {pr.status.toUpperCase()}
        </span>

        <a
          href={pr.prUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline"
        >
          View PR
        </a>
      </div>

      <div className="text-sm text-slate-600 dark:text-slate-300">
        <div><strong>Branch:</strong> {pr.branch}</div>
        <div><strong>Commit:</strong> {pr.commit}</div>
      </div>
    </div>
  );
}
