import { RTMWorkspaceLayout } from "../components/RTMWorkspaceLayout";
import { RTMGapsPanel } from "@/pages/projects/RTMGapsPanel";

export function RTMGapsPage({ projectId }: { projectId: string }) {
  return (
    <RTMWorkspaceLayout
      projectId={projectId}
      title="Gap Analysis"
      subtitle="Identify and close coverage gaps across requirements, endpoints, and journeys"
    >
      {() => <RTMGapsPanel projectId={projectId} />}
    </RTMWorkspaceLayout>
  );
}
