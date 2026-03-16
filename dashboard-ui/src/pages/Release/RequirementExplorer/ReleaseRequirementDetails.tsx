import React from "react";
import { useParams } from "react-router-dom";

import { useRequirementDetails } from "./hooks/useRequirementDetails";

import RequirementOverviewCard from "./components/RequirementOverviewCard";
import RequirementHistoryChart from "./components/RequirementHistoryChart";
import RequirementPatternsCard from "./components/RequirementPatternsCard";
import RequirementFixSuggestions from "./components/RequirementFixSuggestions";

export function ReleaseRequirementDetails() {
  const { project, requirementId } = useParams<{
    project: string;
    requirementId: string;
  }>();

  const { data, loading, error } = useRequirementDetails(project!, requirementId!);

  if (loading) return <div>Loading requirement…</div>;
  if (error) return <div>Failed to load requirement: {error}</div>;
  if (!data || !data.risk) return <div>Requirement not found.</div>;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Requirement {requirementId}</h1>

      <RequirementOverviewCard risk={data.risk} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RequirementHistoryChart history={data.history} />
        <RequirementPatternsCard patterns={data.patterns} />
      </div>

      <RequirementFixSuggestions fixes={data.fixes} />
    </div>
  );
}

export default ReleaseRequirementDetails;
