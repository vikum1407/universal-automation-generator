export const SQL = {
  LOAD_RUNS: `
    SELECT
      run_id,
      status,
      started_at,
      finished_at,
      duration_ms
    FROM test_runs
    WHERE test_id = $1
    ORDER BY started_at DESC
  `,

  LOAD_ASSERTIONS: `
    SELECT id, passed, message
    FROM test_run_assertions
    WHERE run_id = $1
  `,

  LOAD_LOGS: `
    SELECT type, message, timestamp
    FROM test_run_logs
    WHERE run_id = $1
    ORDER BY timestamp ASC
  `,

  LOAD_ARTIFACTS: `
    SELECT id, type, url
    FROM test_run_artifacts
    WHERE run_id = $1
  `,

  LOAD_ERROR: `
    SELECT message, stack
    FROM test_run_errors
    WHERE run_id = $1
    LIMIT 1
  `,

  LOAD_TRENDS: `
    SELECT
      day,
      success_rate,
      failure_rate,
      flakiness
    FROM test_daily_trends
    WHERE test_id = $1
    ORDER BY day ASC
  `,

  LOAD_AI_INSIGHTS: `
    SELECT
      key_findings,
      suggested_fixes,
      risk_level
    FROM test_ai_insights
    WHERE test_id = $1
    LIMIT 1
  `
};
