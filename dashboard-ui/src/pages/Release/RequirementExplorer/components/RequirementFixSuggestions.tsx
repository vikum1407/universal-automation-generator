import React from "react";
import type { RequirementFixSuggestion } from "../hooks/useRequirementDetails";

interface Props {
  fixes: RequirementFixSuggestion[];
}

export default function RequirementFixSuggestions({ fixes }: Props) {
  if (!fixes || fixes.length === 0) {
    return (
      <div className="border rounded-md bg-white shadow-sm p-4 text-sm">
        No suggestions available.
      </div>
    );
  }

  const badgeColor = (priority: RequirementFixSuggestion["priority"]) =>
    priority === "high"
      ? "bg-rose-100 text-rose-700"
      : priority === "medium"
      ? "bg-amber-100 text-amber-700"
      : "bg-emerald-100 text-emerald-700";

  return (
    <div className="border rounded-md bg-white shadow-sm p-4 text-sm">
      <div className="font-semibold mb-2">AI‑Assisted Fix Suggestions</div>
      <div className="flex flex-col gap-2 text-xs">
        {fixes.map((fix, idx) => (
          <div key={idx} className="border rounded-md p-2">
            <div className="flex justify-between items-center mb-1">
              <div className="font-semibold">{fix.title}</div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${badgeColor(fix.priority)}`}>
                {fix.priority.toUpperCase()}
              </span>
            </div>
            <div className="text-gray-700">{fix.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
