const COLORS: Record<string, string> = {
  pass: "border-green-500 text-green-600 dark:text-green-400",
  warning: "border-orange-500 text-orange-600 dark:text-orange-400",
  fail: "border-red-500 text-red-600 dark:text-red-400"
};

const ICONS: Record<string, string> = {
  pass: "✔️",
  warning: "⚠️",
  fail: "❌"
};

export function GuardrailCard({ guardrail }: { guardrail: any }) {
  const status = guardrail.status ?? "warning";
  const colorClass = COLORS[status] ?? "border-gray-400 text-gray-600 dark:text-gray-300";
  const icon = ICONS[status] ?? "⚠️";

  return (
    <div className={`w-64 border-2 rounded-lg p-4 bg-white dark:bg-gray-800 shadow ${colorClass}`}>
      <div className="flex items-center mb-2">
        <span className="text-xl mr-2">{icon}</span>
        <h3 className="text-lg font-semibold">{guardrail.name}</h3>
      </div>

      <div className="font-bold mb-2">{status.toUpperCase()}</div>

      <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded max-h-32 overflow-auto">
        {JSON.stringify(guardrail.details, null, 2)}
      </pre>
    </div>
  );
}
