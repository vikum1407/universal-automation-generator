import { db } from "../../core/db";

export const PlaywrightRecorder = {
  async record(payload: any) {
    const {
      runId,
      testId,
      status,
      startedAt,
      finishedAt,
      durationMs,
      logs,
      error,
      artifacts
    } = payload;

    await db.tx(async (t) => {
      await t.none(
        `
        INSERT INTO test_runs (run_id, test_id, status, started_at, finished_at, duration_ms)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (run_id) DO NOTHING
      `,
        [runId, testId, status, startedAt, finishedAt, durationMs]
      );

      for (const log of logs) {
        await t.none(
          `
          INSERT INTO test_run_logs (run_id, type, message, timestamp)
          VALUES ($1, $2, $3, $4)
        `,
          [runId, log.type, log.message, log.timestamp]
        );
      }

      if (error) {
        await t.none(
          `
          INSERT INTO test_run_errors (run_id, message, stack)
          VALUES ($1, $2, $3)
          ON CONFLICT (run_id) DO UPDATE SET message = $2, stack = $3
        `,
          [runId, error.message, error.stack]
        );
      }

      for (const art of artifacts) {
        await t.none(
          `
          INSERT INTO test_run_artifacts (id, run_id, type, url)
          VALUES ($1, $2, $3, $4)
        `,
          [art.id, runId, art.type, art.url]
        );
      }
    });
  }
};
