import { db } from "../../../db";

export class HealedPatternsProvider {
  async getRecent(project: string, limit = 20) {
    return db.manyOrNone(
      `SELECT pattern, occurrences, healed_at
       FROM healed_patterns
       WHERE project = $1
       ORDER BY healed_at DESC
       LIMIT $2`,
      [project, limit]
    );
  }
}
