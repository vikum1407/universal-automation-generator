import { useParams, Link } from "react-router-dom";
import { useReleaseReadiness } from "./hooks/useReleaseReadiness";

export function ReleaseReleaseReadiness() {
  const { project } = useParams();
  const { data, loading, error } = useReleaseReadiness(project!);

  if (loading) return <div className="p-4">Evaluating release readiness…</div>;
  if (error || !data) return <div className="p-4 text-red-500">{error}</div>;

  const statusColor =
    data.status === "safe"
      ? "bg-green-600"
      : data.status === "risky"
      ? "bg-yellow-600"
      : "bg-red-600";

  const Section = ({ title, items }: { title: string; items: string[] }) => {
    if (!items || !items.length) return null;
    return (
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-700 dark:text-slate-200">
          {items.map((line, idx) => (
            <li key={idx}>{line}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Release Readiness</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            A narrative evaluation of whether your system is stable enough to
            ship a release.
          </p>
        </div>
        <span
          className={`px-3 py-1 text-white text-lg rounded ${statusColor}`}
        >
          {data.status.toUpperCase()}
        </span>
      </div>

      <div className="text-sm">
        Stability Score:{" "}
        <span className="font-semibold">
          {(data.stabilityScore * 100).toFixed(0)}%
        </span>
      </div>

      <div className="space-y-6">
        <Section title="Reasons" items={data.reasons} />
        <Section title="Recommended Actions" items={data.recommendations} />
      </div>

      {data.status !== "safe" && (
        <Link
          to={`/release/${project}/stability/stabilization`}
          className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded"
        >
          Run Autonomous Stabilization
        </Link>
      )}
    </div>
  );
}
