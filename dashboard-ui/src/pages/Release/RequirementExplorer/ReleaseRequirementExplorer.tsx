import React from "react";
import { useParams } from "react-router-dom";
import { useRequirementRisk } from "./hooks/useRequirementRisk";

import RequirementListGroup from "./components/RequirementListGroup";

export function ReleaseRequirementExplorer() {
  const { project } = useParams<{ project: string }>();
  const { data, loading, error } = useRequirementRisk(project!);

  if (loading) return <div>Loading requirements…</div>;
  if (error) return <div>Failed to load requirements: {error}</div>;
  if (!data) return <div>No requirements found.</div>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Requirements</h1>

      <RequirementListGroup
        title="High‑Risk Requirements"
        color="rose"
        requirements={data.highRisk}
        defaultOpen={true}
      />

      <RequirementListGroup
        title="Failing Requirements"
        color="rose"
        requirements={data.failing}
      />

      <RequirementListGroup
        title="Uncovered Requirements"
        color="amber"
        requirements={data.uncovered}
      />

      <RequirementListGroup
        title="API Requirements"
        color="sky"
        requirements={data.api}
      />

      <RequirementListGroup
        title="UI Requirements"
        color="emerald"
        requirements={data.ui}
      />

      <RequirementListGroup
        title="AI‑Enriched Requirements"
        color="indigo"
        requirements={data.aiEnriched}
      />
    </div>
  );
}

export default ReleaseRequirementExplorer;
