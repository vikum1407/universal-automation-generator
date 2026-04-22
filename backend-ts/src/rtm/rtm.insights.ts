import { Requirement, RTMDocument } from './rtm.model';

export interface RTMInsight {
  requirementId: string;
  type: "missing-test" | "weak-coverage" | "high-risk" | "ai-suggestion";
  message: string;
}

export class RTMInsightsEngine {
  generateInsights(rtm: RTMDocument): RTMInsight[] {
    if (!rtm || !Array.isArray(rtm.requirements)) return [];

    const insights: RTMInsight[] = [];

    for (const req of rtm.requirements) {
      const coveredCount = req.coveredBy?.length ?? 0;

      // Missing test
      if (coveredCount === 0) {
        insights.push({
          requirementId: req.id,
          type: "missing-test",
          message: `No tests cover this requirement.`
        });
      }

      // Weak coverage
      if (coveredCount === 1) {
        insights.push({
          requirementId: req.id,
          type: "weak-coverage",
          message: `Only one test covers this requirement. Consider adding more scenarios.`
        });
      }

      // High risk
      if (req.riskLevel === "high") {
        insights.push({
          requirementId: req.id,
          type: "high-risk",
          message: `This requirement is marked high risk and should have strong test coverage.`
        });
      }

      // AI suggestions
      if (req.aiLogic) {
        insights.push({
          requirementId: req.id,
          type: "ai-suggestion",
          message: `AI has generated additional scenarios or assertions for this requirement.`
        });
      }
    }

    return insights;
  }
}
