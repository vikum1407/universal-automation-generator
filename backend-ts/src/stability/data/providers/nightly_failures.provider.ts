import { db } from "../../../db";

export class NightlyFailuresProvider {
  async getRecent(project: string, limit = 20) {
    return db.manyOrNone(
      `SELECT test_name, component, failure_count, timestamp
       FROM nightly_failures
       WHERE project = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [project, limit]
    );
  }
}
