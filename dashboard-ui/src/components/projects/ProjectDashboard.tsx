import { useProjectTrends } from "../../hooks/useProjectTrends";
import { useProjectStability } from "../../hooks/useProjectStability";
import { useProjectFlakiness } from "../../hooks/useProjectFlakiness";
import { useProjectHotspots } from "../../hooks/useProjectHotspots";
import { useProjectFailureModel } from "../../hooks/useProjectFailureModel";

import { ProjectTrendChart } from "./ProjectTrendChart";
import { ProjectStabilityChart } from "./ProjectStabilityChart";
import { ProjectFlakinessChart } from "./ProjectFlakinessChart";
import { ProjectHotspotList } from "./ProjectHotspotList";
import { ProjectFailureModelTable } from "./ProjectFailureModelTable";

export function ProjectDashboard({ projectId }: { projectId: string }) {
  const { data: trends } = useProjectTrends(projectId);
  const { data: stability } = useProjectStability(projectId);
  const { data: flakiness } = useProjectFlakiness(projectId);
  const { data: hotspots } = useProjectHotspots(projectId);
  const { data: failureModel } = useProjectFailureModel(projectId);

  return (
    <div className="space-y-8">
      <ProjectTrendChart points={trends} />
      <ProjectStabilityChart points={stability} />
      <ProjectFlakinessChart points={flakiness} />
      <ProjectHotspotList items={hotspots} />
      <ProjectFailureModelTable items={failureModel} />
    </div>
  );
}
