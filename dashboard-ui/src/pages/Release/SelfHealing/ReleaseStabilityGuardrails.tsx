import { useParams } from "react-router-dom";
import { useStabilityGuardrails } from "./hooks/useStabilityGuardrails";

export function ReleaseStabilityGuardrails() {
  const { project } = useParams();
  const { data, loading, error } = useStabilityGuardrails(project!);

  if (loading) return <div className="p-4">Loading stability guardrails…</div>;
  if (error || !data) return <div className="p-4 text-red-500">{error}</div>;

  const statusColor =
    data.status === "healthy"
      ? "bg-green-600"
      : data.status === "warning"
      ? "bg-yellow-600"
      : "bg-red-600";

  const Section = ({
    title,
    items
  }: {
    title: string;
    items: { message: string; component?: string; module?: string }[];
  }) => {
    if (!items || !items.length) return null;
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-200">
          {items.map((item, idx) => (
            <li key={idx}>
              {item.message}
              {item.component && (
                <span className="text-xs text-slate-500">
                  {" "}
                  (Component: {item.component})
                </span>
              )}
              {item.module && (
                <span className="text-xs text-slate-500">
                  {" "}
                  (Module: {item.module})
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Stability Guardrails</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Automated rules that prevent unstable patterns from entering your
            system and highlight areas that need attention.
          </p>
        </div>
        <span
          className={`px-3 py-1 text-xs text-white rounded-full ${statusColor}`}
        >
          {data.status.toUpperCase()}
        </span>
      </div>

      <div className="space-y-6">
        <Section title="Critical Violations" items={data.violations} />
        <Section title="Warnings" items={data.warnings} />
      </div>
    </div>
  );
}
