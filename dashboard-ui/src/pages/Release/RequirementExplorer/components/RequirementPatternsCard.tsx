import React from "react";
import type { RequirementPattern } from "../hooks/useRequirementDetails";

interface Props {
  patterns: RequirementPattern;
}

export default function RequirementPatternsCard({ patterns }: Props) {
  return (
    <div className="border rounded-md bg-white shadow-sm p-4 text-sm">
      <div className="font-semibold mb-2">Patterns</div>
      <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
        <li>Executions: {patterns.totalExecutions}, Failures: {patterns.failureCount}</li>
        <li>Uncovered runs: {patterns.uncoveredRuns}</li>
        <li>
          Recurring failures:{" "}
          <span className={patterns.recurringFailures ? "text-rose-600" : "text-emerald-600"}>
            {patterns.recurringFailures ? "yes" : "no"}
          </span>
        </li>
        <li>
          Long uncovered:{" "}
          <span className={patterns.longUncovered ? "text-amber-600" : "text-emerald-600"}>
            {patterns.longUncovered ? "yes" : "no"}
          </span>
        </li>
        <li>
          API hotspot:{" "}
          <span className={patterns.isApiHotspot ? "text-rose-600" : "text-gray-500"}>
            {patterns.isApiHotspot ? "yes" : "no"}
          </span>
        </li>
        <li>
          UI hotspot:{" "}
          <span className={patterns.isUiHotspot ? "text-rose-600" : "text-gray-500"}>
            {patterns.isUiHotspot ? "yes" : "no"}
          </span>
        </li>
      </ul>
    </div>
  );
}
