import type { TestDashboard } from "@/types/test-dashboard";
import { Card } from "@/components/Card";
import { RiskBadge } from "@/components/RiskBadge";

export function AiInsightsPanel({
  aiInsights,
}: {
  aiInsights: TestDashboard["aiInsights"];
}) {
  return (
    <div className="p-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">AI Insights</h2>
          <RiskBadge priority={aiInsights.riskLevel} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Key Findings</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              {aiInsights.keyFindings.map((f, idx) => (
                <li key={idx}>{f}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-2">Suggested Fixes</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              {aiInsights.suggestedFixes.map((f, idx) => (
                <li key={idx}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
