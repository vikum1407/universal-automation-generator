const COLORS: Record<string, string> = {
  safe: "border-green-500 text-green-600 dark:text-green-400",
  warning: "border-orange-500 text-orange-600 dark:text-orange-400",
  danger: "border-red-500 text-red-600 dark:text-red-400"
};

const ICONS: Record<string, string> = {
  safe: "🟢",
  warning: "🟠",
  danger: "🔴"
};

export function ReadinessIndicator({ readiness }: { readiness: any }) {
  const status = readiness?.status ?? "warning";
  const colorClass = COLORS[status] ?? "border-gray-400 text-gray-600 dark:text-gray-300";
  const icon = ICONS[status] ?? "⚠️";

  return (
    <div className={`border-2 rounded-lg p-6 bg-white dark:bg-gray-800 shadow text-center ${colorClass}`}>
      <h2 className="text-xl font-semibold mb-3">Release Readiness</h2>

      <div className="text-5xl mb-2">{icon}</div>

      <div className="text-xl font-bold">{status.toUpperCase()}</div>

      {readiness?.details && (
        <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-4 max-h-32 overflow-auto">
          {JSON.stringify(readiness.details, null, 2)}
        </pre>
      )}
    </div>
  );
}
