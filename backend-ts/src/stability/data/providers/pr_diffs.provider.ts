import { db } from "../../../db";

export class PrDiffsProvider {
  async getRecent(project: string, limit = 20) {
    return db.manyOrNone(
      `SELECT pr_number, file_path, change_type, created_at
       FROM pr_diffs
       WHERE project = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [project, limit]
    );
  }
}
