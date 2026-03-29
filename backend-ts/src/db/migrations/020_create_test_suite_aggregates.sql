CREATE TABLE test_suite_aggregates (
  test_id TEXT PRIMARY KEY,
  total_runs INT NOT NULL DEFAULT 0,
  passed_runs INT NOT NULL DEFAULT 0,
  failed_runs INT NOT NULL DEFAULT 0,
  flaky_runs INT NOT NULL DEFAULT 0,
  avg_duration_ms NUMERIC NOT NULL DEFAULT 0,
  last_status TEXT,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_test_suite_aggregates_last_run_at
  ON test_suite_aggregates(last_run_at DESC);
