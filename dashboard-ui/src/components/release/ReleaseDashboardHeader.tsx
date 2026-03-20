import { useNavigate, useParams } from "react-router-dom";
import { useStabilitySnapshot } from "@/hooks/useStabilitySnapshot";
import ReleaseLifecycleBar from "@/components/release/ReleaseLifecycleBar";

function extractReleaseInfo(release: any) {
  if (!release) {
    return {
      name: "Unknown Release",
      version: undefined,
      branch: undefined,
      environment: undefined,
      status: undefined,
      owner: undefined,
      createdAt: undefined,
      frozenAt: undefined,
      deployedAt: undefined,
      completedAt: undefined,
      readinessScore: undefined,
      riskLevel: undefined,
    };
  }

  if (typeof release === "string") {
    return {
      name: release,
      version: undefined,
      branch: undefined,
      environment: undefined,
      status: undefined,
      owner: undefined,
      createdAt: undefined,
      frozenAt: undefined,
      deployedAt: undefined,
      completedAt: undefined,
      readinessScore: undefined,
      riskLevel: undefined,
    };
  }

  return {
    name: release.name ?? "Unknown Release",
    version: release.version,
    branch: release.branch,
    environment: release.environment,
    status: release.status,
    owner: release.owner,
    createdAt: release.createdAt,
    frozenAt: release.frozenAt,
    deployedAt: release.deployedAt,
    completedAt: release.completedAt,
    readinessScore: release.readinessScore,
    riskLevel: release.riskLevel,
  };
}

function getStatusColor(status?: string) {
  switch (status) {
    case "ready":
      return "bg-green-50 dark:bg-green-900/20";
    case "in_progress":
      return "bg-blue-50 dark:bg-blue-900/20";
    case "frozen":
      return "bg-yellow-50 dark:bg-yellow-900/20";
    case "blocked":
      return "bg-red-50 dark:bg-red-900/20";
    case "failed":
      return "bg-red-100 dark:bg-red-900/30";
    default:
      return "bg-white dark:bg-slate-900";
  }
}

export default function ReleaseDashboardHeader() {
  const { project } = useParams();
  const navigate = useNavigate();
  const { data } = useStabilitySnapshot(project ?? "");

  const info = extractReleaseInfo(data?.release);
  const statusColor = getStatusColor(info.status);

  const runs = [...(data?.executions ?? [])].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  const latestRun = runs.length > 0 ? runs[0].runId : "";
  const previousRun = runs.length > 1 ? runs[1].runId : "";

  return (
    <div className={`p-4 shadow rounded space-y-6 ${statusColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">{info.name}</div>
          {info.version && (
            <div className="text-sm text-gray-500">Version {info.version}</div>
          )}
        </div>

        {previousRun && latestRun && (
          <button
            onClick={() =>
              navigate(
                `/projects/${project}/compare/${previousRun}/${latestRun}`
              )
            }
            className="px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Compare Latest with Previous
          </button>
        )}
      </div>

      <ReleaseLifecycleBar
        createdAt={info.createdAt}
        frozenAt={info.frozenAt}
        deployedAt={info.deployedAt}
        completedAt={info.completedAt}
      />

      <div className="flex flex-wrap gap-6 text-sm">
        {info.branch && (
          <div>
            <span className="font-medium">Branch:</span> {info.branch}
          </div>
        )}

        {info.environment && (
          <div>
            <span className="font-medium">Environment:</span> {info.environment}
          </div>
        )}

        {info.status && (
          <div>
            <span className="font-medium">Status:</span>{" "}
            <span className="capitalize">{info.status}</span>
          </div>
        )}

        {info.owner && (
          <div>
            <span className="font-medium">Owner:</span> {info.owner}
          </div>
        )}

        {info.readinessScore !== undefined && (
          <div>
            <span className="font-medium">Readiness:</span>{" "}
            {(info.readinessScore * 100).toFixed(1)}%
          </div>
        )}

        {info.riskLevel && (
          <div>
            <span className="font-medium">Risk:</span>{" "}
            <span className="capitalize">{info.riskLevel}</span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-6 text-xs text-gray-600 dark:text-gray-400">
        {info.createdAt && (
          <div>Created: {new Date(info.createdAt).toLocaleString()}</div>
        )}
        {info.frozenAt && (
          <div>Frozen: {new Date(info.frozenAt).toLocaleString()}</div>
        )}
        {info.deployedAt && (
          <div>Deployed: {new Date(info.deployedAt).toLocaleString()}</div>
        )}
        {info.completedAt && (
          <div>Completed: {new Date(info.completedAt).toLocaleString()}</div>
        )}
      </div>

      <div className="flex gap-4 items-center">
        <select
          value={latestRun}
          onChange={(e) =>
            navigate(`/projects/${project}/runs/${e.target.value}`)
          }
          className="px-3 py-1 rounded border dark:bg-slate-800"
        >
          {runs.map((r) => (
            <option key={r.runId} value={r.runId}>
              Run {r.runId}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
