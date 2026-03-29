CREATE TABLE test_runs (
  run_id TEXT PRIMARY KEY,
  test_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed', 'running')),
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER
);

CREATE INDEX idx_test_runs_test_id ON test_runs(test_id);
CREATE INDEX idx_test_runs_started_at ON test_runs(started_at DESC);
