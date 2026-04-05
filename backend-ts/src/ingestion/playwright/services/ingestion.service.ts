import { Injectable } from "@nestjs/common";
import { db } from "../../../core/db";

@Injectable()
export class IngestionService {
  async storeRun(payload: any, timeline: any[], distributed: any) {
    const {
      runId,
      testId,
      status,
      startedAt,
      finishedAt,
      durationMs,
      logs,
      error,
      artifacts,
      network,
      console: consoleLogs,
      metadata
    } = payload;

    await db.tx(async (t) => {
      await t.none(
        `
        INSERT INTO test_runs (run_id, test_id, status, started_at, finished_at, duration_ms)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (run_id) DO NOTHING
      `,
        [runId, testId, status, startedAt, finishedAt, durationMs]
      );

      await t.none(
        `
        INSERT INTO test_run_metadata (
          run_id, browser, browser_version, os, os_version,
          device, project, worker_index, retry, parallel_index
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (run_id) DO UPDATE SET
          browser = EXCLUDED.browser,
          browser_version = EXCLUDED.browser_version,
          os = EXCLUDED.os,
          os_version = EXCLUDED.os_version,
          device = EXCLUDED.device,
          project = EXCLUDED.project,
          worker_index = EXCLUDED.worker_index,
          retry = EXCLUDED.retry,
          parallel_index = EXCLUDED.parallel_index
      `,
        [
          runId,
          metadata.browser,
          metadata.browser_version,
          metadata.os,
          metadata.os_version,
          metadata.device,
          metadata.project,
          metadata.worker_index,
          metadata.retry,
          metadata.parallel_index
        ]
      );

      await t.none(
        `
        INSERT INTO test_distributed_execution (
          run_id, machine_id, ci_provider, ci_run_id, ci_job, ci_worker,
          shard_index, shard_total
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (run_id) DO UPDATE SET
          machine_id = EXCLUDED.machine_id,
          ci_provider = EXCLUDED.ci_provider,
          ci_run_id = EXCLUDED.ci_run_id,
          ci_job = EXCLUDED.ci_job,
          ci_worker = EXCLUDED.ci_worker,
          shard_index = EXCLUDED.shard_index,
          shard_total = EXCLUDED.shard_total
      `,
        [
          runId,
          distributed.machine_id,
          distributed.ci_provider,
          distributed.ci_run_id,
          distributed.ci_job,
          distributed.ci_worker,
          distributed.shard_index,
          distributed.shard_total
        ]
      );

      for (const e of timeline) {
        await t.none(
          `
          INSERT INTO test_run_timeline (id, run_id, event_type, payload, timestamp)
          VALUES ($1,$2,$3,$4,$5)
        `,
          [e.id, e.run_id, e.event_type, e.payload, e.timestamp]
        );
      }

      for (const log of logs) {
        await t.none(
          `
          INSERT INTO test_run_logs (run_id, type, message, timestamp)
          VALUES ($1,$2,$3,$4)
        `,
          [runId, log.type, log.message, log.timestamp]
        );
      }

      if (error) {
        await t.none(
          `
          INSERT INTO test_run_errors (run_id, message, stack)
          VALUES ($1,$2,$3)
          ON CONFLICT (run_id) DO UPDATE SET
            message = $2,
            stack = $3
        `,
          [runId, error.message, error.stack]
        );
      }

      for (const art of artifacts) {
        await t.none(
          `
          INSERT INTO test_run_artifacts (id, run_id, type, url)
          VALUES ($1,$2,$3,$4)
        `,
          [art.id, runId, art.type, art.url]
        );
      }

      for (const n of network) {
        await t.none(
          `
          INSERT INTO test_run_network (
            id, run_id, url, method, status,
            request_body, response_body,
            started_at, finished_at, duration_ms
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        `,
          [
            n.id,
            runId,
            n.url,
            n.method,
            n.status,
            n.request_body,
            n.response_body,
            n.started_at,
            n.finished_at,
            n.duration_ms
          ]
        );
      }

      for (const c of consoleLogs) {
        await t.none(
          `
          INSERT INTO test_run_console (id, run_id, type, message, timestamp)
          VALUES ($1,$2,$3,$4,$5)
        `,
          [c.id, runId, c.type, c.message, c.timestamp]
        );
      }
    });
  }

  async storeAIClassification(runId: string, ai: any) {
    await db.none(
      `
      INSERT INTO test_failure_ai (run_id, category, root_cause, suggestion, risk_level)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (run_id) DO UPDATE SET
        category = EXCLUDED.category,
        root_cause = EXCLUDED.root_cause,
        suggestion = EXCLUDED.suggestion,
        risk_level = EXCLUDED.risk_level
    `,
      [runId, ai.category, ai.root_cause, ai.suggestion, ai.risk_level]
    );
  }

  async storeAISuggestion(runId: string, fix: any) {
    await db.none(
      `
      INSERT INTO test_failure_suggestions (run_id, suggestion, code_snippet)
      VALUES ($1,$2,$3)
      ON CONFLICT (run_id) DO UPDATE SET
        suggestion = EXCLUDED.suggestion,
        code_snippet = EXCLUDED.code_snippet
    `,
      [runId, fix.suggestion, fix.code_snippet]
    );
  }

  async storeInsights(runId: string, insight: any) {
    await db.none(
      `
      INSERT INTO test_insights (run_id, insights)
      VALUES ($1,$2)
      ON CONFLICT (run_id) DO UPDATE SET
        insights = EXCLUDED.insights
    `,
      [runId, insight.insights]
    );
  }

  async storeCrossRun(testId: string, cross: any) {
    await db.none(
      `
      INSERT INTO test_cross_run_intelligence (test_id, summary, clusters, trend)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (test_id) DO UPDATE SET
        summary = EXCLUDED.summary,
        clusters = EXCLUDED.clusters,
        trend = EXCLUDED.trend
    `,
      [testId, cross.summary, cross.clusters, cross.trend]
    );
  }

  async storeAssertion(payload: any) {
    const { id, runId, passed, message, error } = payload;

    await db.none(
      `
      INSERT INTO test_run_assertions (id, run_id, passed, message)
      VALUES ($1,$2,$3,$4)
    `,
      [id, runId, passed, message]
    );

    if (error) {
      await db.none(
        `
        INSERT INTO test_run_errors (run_id, message, stack)
        VALUES ($1,$2,$3)
        ON CONFLICT (run_id) DO UPDATE SET
          message = $2,
          stack = $3
      `,
        [runId, error.message, error.stack]
      );
    }
  }
}
