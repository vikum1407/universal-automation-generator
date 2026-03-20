import { db } from "../../../db";

export class HealingEffectivenessProvider {
  async getLatest(project: string) {
    return db.oneOrNone(
      `SELECT *
       FROM healing_effectiveness
       WHERE project = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [project]
    );
  }
}
