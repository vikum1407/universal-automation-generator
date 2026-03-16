import React from "react";
import type { RequirementRiskSummary } from "../hooks/useRequirementRisk";

interface Props {
  risk: RequirementRiskSummary;
}

export default function RequirementOverviewCard({ risk }: Props) {
  const location = risk.requirement.page ?? risk.requirement.url ?? "-";
  const coverageLabel = risk.hasCoverage ? "Covered" : "Uncovered";
  const statusLabel =
    risk.latestStatus === "not_executed" ? "Not executed" : risk.latestStatus;

  const riskColor =
    risk.riskLevel === "high"
      ? "text-rose-600"
      : risk.riskLevel === "medium"
      ? "text-amber-600"
      : "text-emerald-600";

  return (
    <div className="border rounded-md bg-white shadow-sm p-4 flex flex-col gap-2 text-sm">
      <div className="flex justify-between items-center">
        <div>
          <div className="text-xs text-gray-500">Requirement</div>
          <div className="font-semibold">{risk.requirement.id}</div>
        </div>
        <div className={`text-lg font-semibold ${riskColor}`}>{risk.riskScore}</div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-2">
        <div>
          <div className="text-xs text-gray-500">Type</div>
          <div>{risk.requirement.type}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Location</div>
          <div>{location}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Coverage</div>
          <div>{coverageLabel}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Latest Status</div>
          <div>{statusLabel}</div>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Last run:{" "}
        {risk.lastRunTimestamp
          ? new Date(risk.lastRunTimestamp).toLocaleString()
          : "No runs"}
      </div>
    </div>
  );
}
