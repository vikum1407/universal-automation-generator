CREATE TABLE test_run_timeline (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES test_runs(run_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_timeline_run_id ON test_run_timeline(run_id);
