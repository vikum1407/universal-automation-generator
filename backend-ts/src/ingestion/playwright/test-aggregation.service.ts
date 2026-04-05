import { Injectable } from "@nestjs/common";
import { db } from "../../core/db";

@Injectable()
export class TestAggregationService {
  async recomputeForTest(testId: string) {
    await db.none(
      `
      INSERT INTO test_suite_aggregates (
        test_id,
        total_runs,
        passed_runs,
        failed_runs,
        flaky_runs,
        avg_duration_ms,
        last_status,
        last_run_at,
        updated_at
      )
      SELECT
        tr.test_id,
        COUNT(*) AS total_runs,
        COUNT(*) FILTER (WHERE tr.status = 'passed') AS passed_runs,
        COUNT(*) FILTER (WHERE tr.status = 'failed') AS failed_runs,
        COUNT(*) FILTER (WHERE m.retry > 0) AS flaky_runs,
        COALESCE(AVG(tr.duration_ms), 0) AS avg_duration_ms,
        (ARRAY_AGG(tr.status ORDER BY tr.started_at DESC))[1] AS last_status,
        MAX(tr.started_at) AS last_run_at,
        NOW() AS updated_at
      FROM test_runs tr
      LEFT JOIN test_run_metadata m ON m.run_id = tr.run_id
      WHERE tr.test_id = $1
      GROUP BY tr.test_id
      ON CONFLICT (test_id) DO UPDATE SET
        total_runs = EXCLUDED.total_runs,
        passed_runs = EXCLUDED.passed_runs,
        failed_runs = EXCLUDED.failed_runs,
        flaky_runs = EXCLUDED.flaky_runs,
        avg_duration_ms = EXCLUDED.avg_duration_ms,
        last_status = EXCLUDED.last_status,
        last_run_at = EXCLUDED.last_run_at,
        updated_at = EXCLUDED.updated_at
    `,
      [testId]
    );
  }

  async getSuiteOverview() {
    return db.manyOrNone(
      `
      SELECT
        test_id,
        total_runs,
        passed_runs,
        failed_runs,
        flaky_runs,
        avg_duration_ms,
        last_status,
        last_run_at
      FROM test_suite_aggregates
      ORDER BY last_run_at DESC NULLS LAST
    `
    );
  }

  async getTestDetail(testId: string) {
    const aggregate = await db.oneOrNone(
      `
      SELECT
        test_id,
        total_runs,
        passed_runs,
        failed_runs,
        flaky_runs,
        avg_duration_ms,
        last_status,
        last_run_at
      FROM test_suite_aggregates
      WHERE test_id = $1
    `,
      [testId]
    );

    const histogram = await db.manyOrNone(
      `
      SELECT
        width_bucket(duration_ms, 0, 600000, 20) AS bucket,
        MIN(duration_ms) AS min_duration_ms,
        MAX(duration_ms) AS max_duration_ms,
        AVG(duration_ms) AS avg_duration_ms,
        COUNT(*) AS count
      FROM test_runs
      WHERE test_id = $1
      GROUP BY bucket
      ORDER BY bucket
    `,
      [testId]
    );

    const recent = await db.manyOrNone(
      `
      SELECT
        run_id,
        status,
        duration_ms,
        started_at,
        finished_at
      FROM test_runs
      WHERE test_id = $1
      ORDER BY started_at DESC
      LIMIT 50
    `,
      [testId]
    );

    return { aggregate, histogram, recent };
  }
}
