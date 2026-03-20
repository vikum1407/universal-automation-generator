import { db } from "../../../db";

export class FlakinessProvider {
  async getLatest(project: string) {
    return db.oneOrNone(
      `SELECT *
       FROM flakiness
       WHERE project = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [project]
    );
  }
}
