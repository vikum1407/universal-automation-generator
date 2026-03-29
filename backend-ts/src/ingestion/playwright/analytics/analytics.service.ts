import { Injectable } from "@nestjs/common";
import db from "../../../core/db";

@Injectable()
export class AnalyticsService {
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

  async getRunDetail(runId: string) {
    const run = await db.oneOrNone(
      `
      SELECT
        tr.run_id,
        tr.test_id,
        tr.status,
        tr.duration_ms,
        tr.started_at,
        tr.finished_at,
        m.browser,
        m.browser_version,
        m.os,
        m.os_version,
        m.device,
        m.project,
        m.worker_index,
        m.retry,
        m.parallel_index
      FROM test_runs tr
      LEFT JOIN test_run_metadata m ON m.run_id = tr.run_id
      WHERE tr.run_id = $1
    `,
      [runId]
    );

    const timeline = await db.manyOrNone(
      `
      SELECT id, event_type, payload, timestamp
      FROM test_run_timeline
      WHERE run_id = $1
      ORDER BY timestamp ASC
    `,
      [runId]
    );

    const ai = await db.oneOrNone(
      `
      SELECT category, root_cause, suggestion, risk_level
      FROM test_failure_ai
      WHERE run_id = $1
    `,
      [runId]
    );

    const fix = await db.oneOrNone(
      `
      SELECT suggestion, code_snippet
      FROM test_failure_suggestions
      WHERE run_id = $1
    `,
      [runId]
    );

    const insights = await db.oneOrNone(
      `
      SELECT insights
      FROM test_insights
      WHERE run_id = $1
    `,
      [runId]
    );

    const distributed = await db.oneOrNone(
      `
      SELECT
        machine_id,
        ci_provider,
        ci_run_id,
        ci_job,
        ci_worker,
        shard_index,
        shard_total
      FROM test_distributed_execution
      WHERE run_id = $1
    `,
      [runId]
    );

    return {
      run,
      timeline,
      ai,
      fix,
      insights,
      distributed
    };
  }
}
