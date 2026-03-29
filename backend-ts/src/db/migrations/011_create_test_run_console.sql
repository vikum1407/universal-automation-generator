CREATE TABLE test_run_console (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES test_runs(run_id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_console_run_id ON test_run_console(run_id);
