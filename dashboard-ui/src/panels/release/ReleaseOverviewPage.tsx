import { useNavigate, useParams } from "react-router-dom";

import ReleaseDashboardHeader from "@/components/release/ReleaseDashboardHeader";
import ReleaseSummaryPanel from "@/panels/release/ReleaseSummaryPanel";
import ReleaseIntelligenceSummary from "@/panels/release/ReleaseIntelligenceSummary";
import ReleaseRiskBreakdownPanel from "@/panels/release/ReleaseRiskBreakdownPanel";
import PredictiveStabilityPanel from "@/panels/release/PredictiveStabilityPanel";
import OrchestratedActionsPanel from "@/panels/release/OrchestratedActionsPanel";
import ReleaseStabilityMatrix from "@/panels/release/ReleaseStabilityMatrix";
import ReadinessPanel from "@/panels/release/ReadinessPanel";
import ReleaseStoryPanel from "@/panels/release/ReleaseStoryPanel";
import ReleaseTimelinePanel from "@/panels/release/ReleaseTimelinePanel";

import { useStabilitySnapshot } from "@/hooks/useStabilitySnapshot";

export default function ReleaseOverviewPage() {
  const { project } = useParams();
  const navigate = useNavigate();

  const { data, loading, error } = useStabilitySnapshot(project ?? "");

  if (!project) return <div>No project selected.</div>;
  if (loading) return <div>Loading release overview…</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return <div>No release data available.</div>;

  const runs = [...(data.executions ?? [])].sort(
    (a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
  );

  if (runs.length < 1) return <div>No runs available for this release.</div>;

  const latest = runs[runs.length - 1];
  const previous = runs.length > 1 ? runs[runs.length - 2] : null;

  return (
    <div className="p-6 space-y-10">
      <ReleaseDashboardHeader />

      <div className="flex items-center justify-between">
        <div className="text-2xl font-semibold">Release Overview</div>

        {previous && (
          <button
            onClick={() =>
              navigate(
                `/projects/${project}/compare/${previous.runId}/${latest.runId}`
              )
            }
            className="text-sm text-blue-500 hover:underline"
          >
            Compare latest with previous
          </button>
        )}
      </div>

      <ReleaseSummaryPanel snapshot={data} />

      <ReleaseIntelligenceSummary snapshot={data} />

      <ReleaseRiskBreakdownPanel snapshot={data} />

      <PredictiveStabilityPanel snapshot={data} />

      <OrchestratedActionsPanel snapshot={data} />

      <ReleaseStabilityMatrix snapshot={data} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ReadinessPanel
          project={project}
          runA={previous ? previous.runId : latest.runId}
          runB={latest.runId}
        />

        <ReleaseStoryPanel
          project={project}
          runA={previous ? previous.runId : latest.runId}
          runB={latest.runId}
        />
      </div>

      <ReleaseTimelinePanel project={project} />
    </div>
  );
}
