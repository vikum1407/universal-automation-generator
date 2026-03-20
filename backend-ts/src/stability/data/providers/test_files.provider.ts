import { db } from "../../../db";

export class TestFilesProvider {
  async getRecent(project: string, limit = 50) {
    return db.manyOrNone(
      `SELECT file_path, status, last_modified
       FROM test_files
       WHERE project = $1
       ORDER BY last_modified DESC
       LIMIT $2`,
      [project, limit]
    );
  }
}
