import { db } from "../../../db";

export class RiskTrendsProvider {
  async getRiskTrends(project: string) {
    return db.manyOrNone(
      "SELECT increasing_streak FROM risk_trends WHERE project = $1 ORDER BY created_at DESC LIMIT 10",
      [project]
    );
  }
}
