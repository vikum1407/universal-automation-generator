import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { DashboardAPI } from "../api/dashboard";
import { Card } from "../components/Card";
import { RiskBadge } from "../components/RiskBadge";

interface ProjectOverview {
  id: string;
  timestamp: string;
  passCount: number;
  failCount: number;
  durationMs: number;
  riskScore: number;
  stabilityScore: number;
  insights?: string[];
}

export default function JourneyDetails() {
  const { id } = useParams();
  const [project, setProject] = useState<ProjectOverview | null>(null);

  useEffect(() => {
    if (!id) return;
    DashboardAPI.journey(id).then((data) => {
      setProject(data as ProjectOverview);
    });
  }, [id]);

  if (!project) {
    return <div className="text-gray-500">Loading project...</div>;
  }

  return (
    <div className="space-y-6">

      {/* Page title (Breadcrumbs are now in the global header) */}
      <div>
        <h1 className="text-2xl font-semibold">{project.id}</h1>
        <p className="text-gray-500 dark:text-slate-400">
          Project overview and latest execution insights
        </p>
      </div>

      {/* Back link */}
      <Link
        to="/journeys"
        className="text-blue-600 hover:underline text-sm mb-4 inline-block"
      >
        ← Back to Projects
      </Link>

      {/* Summary Card */}
      <Card>
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Latest Run Summary</h2>
          <RiskBadge priority={project.riskScore > 70 ? "P0" : "P2"} />
        </div>

        <div className="mt-3 text-gray-700 space-y-1">
          <p><strong>Timestamp:</strong> {project.timestamp}</p>
          <p><strong>Passed:</strong> {project.passCount}</p>
          <p><strong>Failed:</strong> {project.failCount}</p>
          <p><strong>Duration:</strong> {project.durationMs} ms</p>
          <p><strong>Risk Score:</strong> {project.riskScore}</p>
          <p><strong>Stability Score:</strong> {project.stabilityScore}</p>
        </div>
      </Card>

      {/* Insights */}
      {project.insights && (
        <Card>
          <h2 className="text-lg font-semibold">Insights</h2>
          <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
            {project.insights.map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
        </Card>
      )}

    </div>
  );
}
