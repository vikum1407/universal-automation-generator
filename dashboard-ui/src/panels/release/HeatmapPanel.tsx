import { useRequirementStability } from "../../hooks/useRequirementStability";

export default function HeatmapPanel({ project }: { project: string }) {
  const { requirements, loading, error } = useRequirementStability(project);

  if (loading) return <div>Loading heatmap…</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const colorForStatus = (status: string) => {
    switch (status) {
      case "stable":
        return "bg-green-500";
      case "risky":
        return "bg-yellow-500";
      case "unstable":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  return (
    <div className="grid grid-cols-6 gap-2">
      {requirements.map((req) => (
        <div
          key={req.requirementId}
          className={`h-12 w-12 rounded cursor-pointer ${colorForStatus(
            req.status
          )}`}
          title={`${req.title}\nPass rate: ${(req.passRate * 100).toFixed(
            1
          )}%\nRecent failures: ${req.recentFailures}`}
        />
      ))}
    </div>
  );
}
