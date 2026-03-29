import React from "react";
import type { AIInsights } from "../../api/types";

export function AIInsightsPanel({ insights }: { insights: AIInsights | null }) {
  if (!insights) return null;

  return (
    <section>
      <h2 className="text-xl font-semibold">AI Insights</h2>
      <pre className="bg-gray-100 p-4 rounded mt-2">
        {insights.insights}
      </pre>
    </section>
  );
}
