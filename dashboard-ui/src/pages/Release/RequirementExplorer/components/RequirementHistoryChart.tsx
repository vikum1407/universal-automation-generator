import React from "react";
import type { RequirementHistory } from "../hooks/useRequirementDetails";

interface Props {
  history: RequirementHistory;
}

export default function RequirementHistoryChart({ history }: Props) {
  if (!history.points || history.points.length === 0) {
    return (
      <div className="border rounded-md bg-white shadow-sm p-4 text-sm">
        No history available.
      </div>
    );
  }

  return (
    <div className="border rounded-md bg-white shadow-sm p-4 text-sm">
      <div className="font-semibold mb-2">History</div>
      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto text-xs">
        {history.points.map((p) => {
          const statusColor =
            p.status === "failed"
              ? "text-rose-600"
              : p.status === "passed"
              ? "text-emerald-600"
              : "text-gray-500";

          return (
            <div key={p.runId} className="flex justify-between">
              <div>
                <span className="font-mono text-gray-600">{p.runId}</span>
                <span className="ml-2 text-gray-500">
                  {new Date(p.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className={statusColor}>{p.status}</span>
                <span className="text-gray-500">risk {p.riskScore}</span>
                <span className="text-gray-500">
                  {p.hasCoverage ? "covered" : "uncovered"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
