import { db } from "../../../db";

export class RiskTrendsProvider {
  async getLatest(project: string) {
    return db.oneOrNone(
      `SELECT *
       FROM risk_trends
       WHERE project = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [project]
    );
  }
}
