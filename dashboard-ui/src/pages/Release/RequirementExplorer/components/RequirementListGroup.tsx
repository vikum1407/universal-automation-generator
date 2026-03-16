import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { RequirementRiskSummary } from "../hooks/useRequirementRisk";

type Color = "rose" | "amber" | "emerald" | "sky" | "indigo";

const colorMap: Record<Color, string> = {
  rose: "border-rose-500 text-rose-500",
  amber: "border-amber-500 text-amber-500",
  emerald: "border-emerald-500 text-emerald-500",
  sky: "border-sky-500 text-sky-500",
  indigo: "border-indigo-500 text-indigo-500",
};

interface Props {
  title: string;
  color: Color;
  requirements: RequirementRiskSummary[];
  defaultOpen?: boolean;
}

export default function RequirementListGroup({
  title,
  color,
  requirements,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const { project } = useParams<{ project: string }>();

  if (!requirements || requirements.length === 0) return null;

  return (
    <div className="border rounded-md bg-white shadow-sm">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-2"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${colorMap[color]}`}>
            {title}
          </span>
          <span className="text-xs text-gray-500">{requirements.length} requirements</span>
        </div>
        <span className="text-xs text-gray-500">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="border-t px-4 py-3">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-1 pr-4">ID</th>
                  <th className="py-1 pr-4">Type</th>
                  <th className="py-1 pr-4">Location</th>
                  <th className="py-1 pr-4">Coverage</th>
                  <th className="py-1 pr-4">Status</th>
                  <th className="py-1 pr-4">Risk</th>
                  <th className="py-1 pr-4">Last Run</th>
                </tr>
              </thead>
              <tbody>
                {requirements.map((r) => {
                  const location = r.requirement.page ?? r.requirement.url ?? "-";
                  const coverageLabel = r.hasCoverage ? "Covered" : "Uncovered";
                  const statusLabel =
                    r.latestStatus === "not_executed" ? "Not executed" : r.latestStatus;

                  const riskColor =
                    r.riskLevel === "high"
                      ? "text-rose-600"
                      : r.riskLevel === "medium"
                      ? "text-amber-600"
                      : "text-emerald-600";

                  return (
                    <tr key={r.requirement.id} className="border-t">
                      <td className="py-1 pr-4">
                        <Link
                          to={`/release/${project}/requirements/${r.requirement.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {r.requirement.id}
                        </Link>
                      </td>
                      <td className="py-1 pr-4">{r.requirement.type}</td>
                      <td className="py-1 pr-4">{location}</td>
                      <td className="py-1 pr-4">{coverageLabel}</td>
                      <td className="py-1 pr-4">{statusLabel}</td>
                      <td className={`py-1 pr-4 ${riskColor}`}>{r.riskScore}</td>
                      <td className="py-1 pr-4 text-gray-500">
                        {r.lastRunTimestamp
                          ? new Date(r.lastRunTimestamp).toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
