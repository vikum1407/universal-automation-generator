import { db } from "../../../db";

export class PredictionsProvider {
  async getRecent(project: string, limit = 20) {
    return db.manyOrNone(
      `SELECT component, risk_score, predicted_at
       FROM predictions
       WHERE project = $1
       ORDER BY predicted_at DESC
       LIMIT $2`,
      [project, limit]
    );
  }
}
