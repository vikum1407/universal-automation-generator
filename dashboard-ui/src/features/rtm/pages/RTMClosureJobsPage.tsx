import { RTMWorkspaceLayout } from "../components/RTMWorkspaceLayout";
import { RTMClosurePanel } from "@/pages/projects/RTMClosurePanel";

export function RTMClosureJobsPage({ projectId }: { projectId: string }) {
  return (
    <RTMWorkspaceLayout
      projectId={projectId}
      title="Closure Jobs"
      subtitle="Automatically generate tests until coverage targets are met"
    >
      {() => <RTMClosurePanel projectId={projectId} />}
    </RTMWorkspaceLayout>
  );
}
