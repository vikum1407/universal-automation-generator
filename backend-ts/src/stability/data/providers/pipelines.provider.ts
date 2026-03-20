import { db } from "../../../db";

export class PipelinesProvider {
  async getRecent(project: string, limit = 20) {
    return db.manyOrNone(
      `SELECT pipeline_id, status, executed_at
       FROM pipelines
       WHERE project = $1
       ORDER BY executed_at DESC
       LIMIT $2`,
      [project, limit]
    );
  }
}
